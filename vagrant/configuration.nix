{ config, pkgs, lib, ... }:

let

  cfg = config.options;

  robotframework = ps:
    ps.robotframework.overridePythonAttrs(old: rec {
      version = "5.0";
      src = ps.fetchPypi {
        pname = "robotframework";
        extension = "zip";
        inherit version;
        sha256 = "1g08qqr9fw9kj5v990g8vjg06y8hjks0l7wjdn9r8hixqjlcpzmz";
      };
      doCheck = false;
    });

in {

  options = {
    options.username = lib.mkOption { default = "vagrant"; };
    options.ssl = lib.mkOption { default = true; };
    options.shared-folder = lib.mkOption { default = true; };
    options.vscode-with-vim = lib.mkOption { default = false; };
    options.vscode-unfree = lib.mkOption { default = false; };
  };

  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs;
                home-manager = builtins.fetchTarball "https://github.com/nix-community/home-manager/archive/release-21.11.tar.gz";
  in [
    (import "${home-manager}/nixos")
  ];

  config = {

    nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) []
      ++ (if config.options.vscode-unfree then [
          "code"
          "vscode"
          "vscode-extension-ms-vsliveshare-vsliveshare"
      ] else []);

    console = {
      font = "Lat2-Terminus16";
      keyMap = "us";
    };

    networking.nameservers = [ "1.1.1.1" "9.9.9.9" ];
    networking.firewall.allowedTCPPorts = if config.options.ssl then [ 443 ] else [ 8000 ];

    i18n.defaultLocale = "en_US.UTF-8";
    time.timeZone = "Europe/Berlin";

    services = {
      mailhog = {
        enable = true;
      };
      vault = {
        package = pkgs.vault-bin;
        enable = true;
      };
      xserver = {
        enable = true;
        layout = "fi";
        xkbOptions = "eurosign:e";
        libinput.enable = true;
        displayManager = {
          defaultSession = "xfce";
          autoLogin = {
            enable = true;
            user = config.options.username;
          };
        };
        desktopManager = {
          xterm.enable = false;
          xfce.enable = true;
          xfce.noDesktop = true;
        };
      };
    };

    # Fix to run vault with -dev, because this is just a development VM
    systemd.services.vault.serviceConfig.ExecStart =
      pkgs.lib.mkForce "${config.services.vault.package}/bin/vault server -dev";

    # Set test secret
    systemd.services.vault.environment = {
      HOME = "/tmp";
      VAULT_DEV_ROOT_TOKEN_ID = "secret";
    };

    # Camunda
    services.postgresql.enable = true;
    systemd.services.camunda-init = {
      after = [ "postgresql.service" ];
      before = [ "camunda.service" ];
      bindsTo = [ "postgresql.service" ];
      path = [ config.services.postgresql.package ];
      serviceConfig = {
        Type = "oneshot";
        RemainAfterExit = true;
        User = "postgres";
        Group = "postgres";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        set -o errexit -o pipefail -o nounset -o errtrace
        shopt -s inherit_errexit
        create_role="$(mktemp)"
        trap 'rm -f "$create_role"' ERR EXIT
        echo "CREATE ROLE camunda WITH LOGIN PASSWORD 'camunda' CREATEDB" > "$create_role"
        psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='camunda'" | grep -q 1 || psql -tA --file="$create_role"
        psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'camunda'" | grep -q 1 || psql -tAc 'CREATE DATABASE "camunda" OWNER "camunda"'
        psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public" -d camunda
        psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public" -d camunda
      '';
    };

    systemd.paths.camunda-watcher = {
      wantedBy = [ "multi-user.target" ];
      pathConfig = {
        PathChanged = "/var/lib/camunda";
        PathModified = "/var/lib/camunda";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
    };

    systemd.services.camunda-watcher = {
      wantedBy = [ "multi-user.target" ];
      serviceConfig = {
        Type = "oneshot";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        systemctl reset-failed camunda-watcher.path
        systemctl reset-failed camunda-watcher.service
        systemctl reset-failed camunda.service
        systemctl restart camunda.service
      '';
    };

    systemd.services.camunda = {
      after = [ "camunda-init.service" "postgresql.service" ];
      bindsTo = [ "camunda-init.service" "postgresql.service" ];
      wantedBy = [ "multi-user.target" ];
      path = [ pkgs.camunda-platform ];
      environment = {
        CAMUNDA_LOCATIONS = "file:/var/lib/camunda";
        MICRONAUT_SERVER_HOST = "localhost";
        MICRONAUT_SERVER_PORT = "8080";
        DATASOURCES_DEFAULT_URL = "jdbc:postgresql://localhost/camunda";
        DATASOURCES_DEFAULT_USERNAME = "camunda";
        DATASOURCES_DEFAULT_PASSWORD = "camunda";
        JVM_OPTS = "-Dfile.encoding=UTF-8";
      };
      serviceConfig = {
        User = config.options.username;
        Group = "users";
        Restart = "on-failure";
        StateDirectory = "camunda";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        rm -f $STATE_DIRECTORY/camunda
        export $(systemctl show camunda -p NRestarts)
        exec camunda
      '';
    };

    systemd.paths.carrot-rcc-watcher = {
      wantedBy = [ "multi-user.target" ];
      pathConfig = {
        PathChanged = "/var/lib/carrot-rcc";
        PathModified = "/var/lib/carrot-rcc";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
    };

    systemd.services.carrot-rcc-watcher = {
      wantedBy = [ "multi-user.target" ];
      serviceConfig = {
        Type = "oneshot";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        systemctl reset-failed carrot-rcc-watcher.path
        systemctl reset-failed carrot-rcc-watcher.service
        systemctl reset-failed carrot-rcc.service
        systemctl restart carrot-rcc.service
      '';
    };

    systemd.services.carrot-rcc = {
      wantedBy = [ "multi-user.target" ];
      path = with pkgs; [
        findutils
        netcat
        carrot-rcc
        rccFHSUserEnv
      ];
      environment = {
        CLIENT_LOG_LEVEL = "debug";
        CLIENT_POLL_INTERVAL = "5000";
        SMTP_HOST = "localhost";
        SMTP_PORT = "${toString config.services.mailhog.smtpPort}";
        VAULT_ADDR = "http://${config.services.vault.address}";
        VAULT_TOKEN = "secret";
      };
      serviceConfig = {
        User = config.options.username;
        Group = "users";
        Restart = "on-failure";
        RestartSec = 1;
        StateDirectory = "carrot-rcc";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        rm -f $STATE_DIRECTORY/carrot-rcc
        cd $STATE_DIRECTORY
        export HOME=/home/${config.options.username}
        exec carrot-rcc $(find . -name "*.zip")
      '';
    };

    # NoVNC
    services.nginx.enable = true;
    services.nginx.virtualHosts.localhost = {
      root = "${pkgs.novnc}/share/webapps/novnc";
      forceSSL = config.options.ssl;
      sslCertificate = "/etc/novnc-selfsigned.crt";
	  sslCertificateKey = "/etc/novnc-selfsigned.key";
      locations."/websockify" = {
        proxyWebsockets = true;
        proxyPass = "http://localhost:14000";
        extraConfig = ''
          proxy_read_timeout 61s;
          proxy_buffering off;
          proxy_set_header Host $host;
        '';
      };
      locations."/" = {
        index = "vnc.html";
      };
    } // (if config.options.ssl then {} else {
      listen = [{
        addr = "localhost";
        port = 8000;
      }];
    });
    systemd.services.novnc-cert = {
      wantedBy = [ "multi-user.target" ];
      before = [ "nginx.service" ];
      bindsTo = [ "nginx.service" ];
      path = [ pkgs.openssl ];
      serviceConfig = {
        Type = "oneshot";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
         -subj "/C=US/ST=Denial/L=Springfield/O=Carrot-RCC/CN=www.example.com" \
         -keyout /etc/novnc-selfsigned.key -out /etc/novnc-selfsigned.crt
        chown nginx:root /etc/novnc-selfsigned.key
        chown nginx:root /etc/novnc-selfsigned.crt
      '';
    };
    systemd.services.vnc = {
      wantedBy = [ "multi-user.target" ];
      after = [ "display-manager.service" ];
      before = [ "websockify.service" ];
      serviceConfig = {
        Environment = "DISPLAY=:0";
        Restart = "on-failure";
      };
      unitConfig = {
        StartLimitIntervalSec = 0;
      };
      script = ''
        systemctl restart display-manager
        while ! /run/wrappers/bin/su - ${config.options.username} -c "${pkgs.xorg.xset}/bin/xset -q"; do sleep 1; done
        sleep 5  # allow slow GCE instance to catch up
        /run/wrappers/bin/su - ${config.options.username} -c "exec ${pkgs.tigervnc}/bin/x0vncserver -localhost -SecurityTypes none -AlwaysShared"
      '';
    };
    systemd.services.websockify = {
      wantedBy = [ "default.target" ];
      after = [ "vnc.service" ];
      serviceConfig = {
        ExecStart = "${pkgs.python3Packages.websockify}/bin/websockify localhost:14000 localhost:5900";
      };
    };

    environment.systemPackages = with pkgs; [
      camunda-modeler
      chromium
      git
      gnumake
      mockoon
      rcc
      vim
      xfce.xfdesktop
      (python3Full.withPackages(ps: [(robotframework ps)]))
    ];

    users.groups = builtins.listToAttrs [{
      name = config.options.username;
      value = {
        gid = 1000;
        members = [ config.options.username ];
      };
    }];

    users.extraUsers = builtins.listToAttrs [{
      name = config.options.username;
      value = {
        extraGroups = [ config.options.username ];
      };
    }];

    home-manager.users = builtins.listToAttrs [{
      name = config.options.username;
      value = {
        home.file.".config/${config.options.username}/camunda-modeler.png".source = ./files/camunda-modeler.png;
        home.file.".config/${config.options.username}/camunda-modeler.desktop".source = pkgs.writeScript "camunda-modeler.desktop" ''
          [Desktop Entry]
          StartupWMClass=camunda-modeler
          Version=1.0
          Name=Modeler
          Exec=camunda-modeler
          StartupNotify=true
          Terminal=false
          Icon=/home/${config.options.username}/.config/${config.options.username}/camunda-modeler.png
          Type=Application
          MimeType=application/bpmn+xml;application/dmn+xml
        '';
        home.file.".config/${config.options.username}/camunda.png".source = ./files/camunda.png;
        home.file.".config/${config.options.username}/camunda.desktop".source = pkgs.writeScript "camunda.desktop" ''
          [Desktop Entry]
          Version=1.0
          Type=Link
          Name=Camunda
          Icon=/home/${config.options.username}/.config/${config.options.username}/camunda.png
          URL=http://localhost:8080/camunda/
        '';
        home.file.".config/${config.options.username}/chromium-browser.desktop".source = pkgs.writeScript "chromium-browser.desktop" ''
          [Desktop Entry]
          StartupWMClass=chromium-browser
          Version=1.0
          Name=Chromium
          Exec=chromium %U
          StartupNotify=true
          Terminal=false
          Icon=chromium
          Type=Application
          Categories=Network;WebBrowser;
          MimeType=application/pdf;application/rdf+xml;application/rss+xml;application/xhtml+xml;application/xhtml_xml;application/xml;image/gif;image/jpeg;image/png;image/webp;text/html;text/xml;x-scheme-handler/ftp;x-scheme-handler/http;x-scheme-handler/https;x-scheme-handler/webcal;x-scheme-handler/mailto;x-scheme-handler/about;x-scheme-handler/unknown
        '';
        home.file.".config/${config.options.username}/journal.desktop".source = pkgs.writeScript "journal.desktop" ''
          [Desktop Entry]
          StartupWMClass=ksystemlog
          Version=1.0
          Name=Journal
          Exec=nix-shell -p ksystemlog --run ksystemlog
          StartupNotify=false
          Terminal=false
          Icon=system-search
          Type=Application
        '';
        home.file.".config/${config.options.username}/keyboard.desktop".source = pkgs.writeScript "keyboard.desktop" ''
          [Desktop Entry]
          StartupWMClass=xfce4-keyboard-settings
          Version=1.0
          Name=Keyboard
          Exec=/run/current-system/sw/bin/xfce4-keyboard-settings
          StartupNotify=false
          Terminal=false
          Icon=input-keyboard
          Type=Application
        '';
        home.file.".config/${config.options.username}/mailhog.png".source = ./files/mailhog.png;
        home.file.".config/${config.options.username}/mailhog.desktop".source = pkgs.writeScript "mailhog.desktop" ''
          [Desktop Entry]
          Version=1.0
          Type=Link
          Name=MailHog
          Icon=/home/${config.options.username}/.config/${config.options.username}/mailhog.png
          URL=http://localhost:8025/
        '';
        home.file.".config/${config.options.username}/mockoon.png".source = ./files/mockoon.png;
        home.file.".config/${config.options.username}/mockoon.desktop".source = pkgs.writeScript "mockoon.desktop" ''
          [Desktop Entry]
          StartupWMClass=mockoon
          Version=1.0
          Name=Mockoon
          Exec=mockoon-1.17.0
          StartupNotify=true
          Terminal=false
          Icon=/home/${config.options.username}/.config/${config.options.username}/mockoon.png
          Type=Application
        '';
        home.file.".config/${config.options.username}/robocorp-code.png".source = ./files/robocorp-code.png;
        home.file.".config/${config.options.username}/robocorp-code.desktop".source = pkgs.writeScript "robocorp-code.desktop" ''
          [Desktop Entry]
          Categories=Utility;TextEditor;Development;IDE;
          Comment=Code Editing. Redefined.
          Exec=${if config.options.vscode-unfree then "code" else "codium"} /var/lib/carrot-rcc
          GenericName=Text Editor
          Icon=/home/${config.options.username}/.config/${config.options.username}/robocorp-code.png
          MimeType=text/plain;inode/directory;
          Name=Code
          StartupNotify=true
          Terminal=false
          Type=Application
          StartupWMClass=Code
          Actions=new-empty-window;
          Keywords=${if config.options.vscode-unfree then "vscode" else "vscodium"};
        '';
        home.file.".config/${config.options.username}/vault.png".source = ./files/vault.png;
        home.file.".config/${config.options.username}/vault.desktop".source = pkgs.writeScript "vault.desktop" ''
          [Desktop Entry]
          Version=1.0
          Type=Link
          Name=Vault
          Icon=/home/${config.options.username}/.config/${config.options.username}/vault.png
          URL=http://localhost:8200/
        '';
        home.file.".config/${config.options.username}/xfce4-session-logout.desktop".source = pkgs.writeScript "xfce4-session-logout.desktop" ''
          [Desktop Entry]
          Version=1.0
          Type=Application
          Exec=xfce4-session-logout
          Icon=system-log-out
          StartupNotify=false
          Terminal=false
          Categories=System;X-XFCE;X-Xfce-Toplevel;
          OnlyShowIn=XFCE;
          Name=Log Out
          Name[fi]=Kirjaudu ulos
        '';
        home.file.".config/vagrant/robot-framework.png".source = ./files/robot-framework.png;
        xsession = {
          enable = true;
          windowManager.command = ''test -n "$1" && eval "$@"'';
          initExtra= ''
            # resolve directory
            if [ -f ~/.config/user-dirs.dirs ]; then
              source ~/.config/user-dirs.dirs
            fi
            if [ -z "$XDG_DESKTOP_DIR" ]; then
              XDG_DESKTOP_DIR="Desktop"
            fi

            # configure icons
            mkdir -p $XDG_DESKTOP_DIR
            cp -L ~/.config/${config.options.username}/*.desktop $XDG_DESKTOP_DIR
            chmod u+w $XDG_DESKTOP_DIR/*.desktop
            rm -f $XDG_DESKTOP_DIR/Shared
            ${if config.options.shared-folder then "ln -s /${config.options.username} $XDG_DESKTOP_DIR/Shared" else ""}
            ln -s /var/lib/carrot-rcc $XDG_DESKTOP_DIR/Robots
            ln -s /var/lib/camunda $XDG_DESKTOP_DIR/BPMN

            # configure background
            xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/last-image -t string -s ~/.config/vagrant/robot-framework.png
            if [ $? -ne 0 ]; then
              xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/last-image -t string -s ~/.config/vagrant/robot-framework.png --create
            fi
            xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/color-style -t int -s 0
            if [ $? -ne 0 ]; then
              xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/color-style -t int -s 0 --create
            fi
            xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/image-style -t int -s 1
            if [ $? -ne 0 ]; then
              xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/image-style -t int -s 1 --create
            fi
            xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/rgba1 -t double -t double -t double -t double -s 0.368627 -s 0.360784 -s 0.392157 -s 1.0
            if [ $? -ne 0 ]; then
              xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitorVirtual1/workspace0/rgba1 -t double -t double -t double -t double -s 0.368627 -s 0.360784 -s 0.392157 -s 1.0 --create
            fi

            # configure desktop
            xfconf-query -c xfwm4 -p /general/workspace_count -t int -s 1 --create
            setxkbmap -layout us
          '';
        };
        programs.vscode.enable = true;
        programs.vscode.userSettings = {
          "editor.minimap.enabled" = false;
          "python.experiments.enabled" = false;
          "robot.codeLens.enabled" = true;
          "robocorp.verifyLSP" = true;
        };
        programs.vscode.package = ((if config.options.vscode-unfree then pkgs.vscode-fhsWithPackages else pkgs.vscodium-fhsWithPackages) (ps: with ps; [
          (ps.python3Full.withPackages(ps: [(robotframework ps)]))
          pkgs.rcc
        ]));
        programs.vscode.extensions = (with pkgs.vscode-extensions; [
          ms-python.python
          (pkgs.vscode-utils.buildVscodeMarketplaceExtension rec {
            mktplcRef = {
              name = "robotframework-lsp";
              publisher = "robocorp";
              version = "0.42.1";
              sha256 = "1q010v7b2r5h2lsv6cyxqhdiaiqhl9x4f609bp9mw9pbs9xvsg40";
            };
          })
          (pkgs.vscode-utils.buildVscodeMarketplaceExtension rec {
            mktplcRef = {
              name = "robocorp-code";
              publisher = "robocorp";
              version = "0.28.1";
              sha256 = "0blvgxm5f5a89jwpr7ajihb1pk9mj9jgy1yajicvdk6b63v09hv9";
            };
            postInstall = ''
              mkdir -p $out/share/vscode/extensions/robocorp.robocorp-code/bin
              ln -s ${pkgs.rcc}/bin/rcc $out/share/vscode/extensions/robocorp.robocorp-code/bin
            '';
            })
        ] ++ (if config.options.vscode-with-vim then [ vscodevim.vim ] else []))
          ++ (if config.options.vscode-unfree then [ pkgs.vscode-extensions.ms-vsliveshare.vsliveshare ] else []);
      };
    }];
  };
}
