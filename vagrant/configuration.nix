{ config, pkgs, ... }:

{
  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs;
                home-manager = builtins.fetchTarball "https://github.com/nix-community/home-manager/archive/release-21.11.tar.gz";
  in [
    "${nixpkgs}/nixos/modules/virtualisation/vagrant-guest.nix"
    (import "${home-manager}/nixos")
  ];

  console = {
    font = "Lat2-Terminus16";
    keyMap = "us";
  };

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
          user = "vagrant";
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

  systemd.services.camunda = {
    after = [ "camunda-init.service" "postgresql.service" ];
    bindsTo = [ "camunda-init.service" "postgresql.service" ];
    wantedBy = [ "multi-user.target" ];
    path = [ pkgs.camunda-platform ];
    environment = {
      MICRONAUT_SERVER_HOST = "localhost";
      MICRONAUT_SERVER_PORT = "8080";
      DATASOURCES_DEFAULT_URL = "jdbc:postgresql://localhost/camunda";
      DATASOURCES_DEFAULT_USERNAME = "camunda";
      DATASOURCES_DEFAULT_PASSWORD = "camunda";
      JVM_OPTS = "-Dfile.encoding=UTF-8";
    };
    serviceConfig = {
      User = "camunda";
      Group = "camunda";
      DynamicUser = true;
      Restart = "on-failure";
    };
    script = ''
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
  };

  systemd.services.carrot-rcc-watcher = {
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "systemctl restart carrot-rcc.service";
    };
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
      SMTP_HOST = "localhost";
      SMTP_PORT = "${toString config.services.mailhog.smtpPort}";
      VAULT_ADDR = "http://${config.services.vault.address}";
      VAULT_TOKEN = "secret";
    };
    serviceConfig = {
      User = "vagrant";
      Group = "users";
      StateDirectory = "carrot-rcc";
    };
    script = ''
      rm -f $STATE_DIRECTORY/carrot-rcc
      cd $STATE_DIRECTORY
      HOME=/home/vagrant carrot-rcc $(find . -name "*.zip")
    '';
  };

  environment.systemPackages = with pkgs; [
    camunda-modeler
    chromium
    git
    gnumake
    rcc
    vim
    xfce.xfdesktop
  ];

  users.extraUsers.vagrant.extraGroups = [ "vagrant" ];

  users.groups.vagrant = {
    gid = 1000;
    members = [ "vagrant" ];
  };

  home-manager.users."vagrant" = {
    home.file.".config/vagrant/camunda-modeler.desktop".source = ./files/camunda-modeler.desktop;
    home.file.".config/vagrant/camunda-modeler.png".source = ./files/camunda-modeler.png;
    home.file.".config/vagrant/chromium-browser.desktop".source = ./files/chromium-browser.desktop;
    home.file.".config/vagrant/xfce4-session-logout.desktop".source = ./files/xfce4-session-logout.desktop;
    home.file.".config/vagrant/camunda.desktop".source = ./files/camunda.desktop;
    home.file.".config/vagrant/camunda.png".source = ./files/camunda.png;
    home.file.".config/vagrant/robocorp-code.desktop".source = ./files/robocorp-code.desktop;
    home.file.".config/vagrant/robocorp-code.png".source = ./files/robocorp-code.png;
    home.file.".config/vagrant/mailhog.desktop".source = ./files/mailhog.desktop;
    home.file.".config/vagrant/mailhog.png".source = ./files/mailhog.png;
    home.file.".config/vagrant/vault.desktop".source = ./files/vault.desktop;
    home.file.".config/vagrant/vault.png".source = ./files/vault.png;
    xsession = {
      enable = true;
      windowManager.command = ''test -n "$1" && eval "$@"'';
      profileExtra = ''
        # resolve directory
        if [ -f ~/.config/user-dirs.dirs ]; then
          source ~/.config/user-dirs.dirs
        fi
        if [ -z "$XDG_DESKTOP_DIR" ]; then
          XDG_DESKTOP_DIR="Desktop"
        fi
        # configure icons
        mkdir -p $XDG_DESKTOP_DIR
        cp -L ~/.config/vagrant/*.desktop $XDG_DESKTOP_DIR
        chmod u+w $XDG_DESKTOP_DIR/*.desktop
        rm -f $XDG_DESKTOP_DIR/Shared
        ln -s /vagrant $XDG_DESKTOP_DIR/Shared
        ln -s /var/lib/carrot-rcc $XDG_DESKTOP_DIR/Robots
      '';
      initExtra= ''
        setxkbmap -layout us
      '';
    };
    programs.vscode.enable = true;
    programs.vscode.userSettings = {
      "python.experiments.enabled" = false;
    };
    programs.vscode.package = (pkgs.vscode-fhsWithPackages (ps: with ps; [
      (ps.python3Full.withPackages(ps: [
        (ps.robotframework.overridePythonAttrs(old: rec {
          version = "4.1.1";
          src = ps.fetchPypi {
            pname = "robotframework";
            extension = "zip";
            inherit version;
            sha256 = "0ddd9dzrn9gi29w0caab78zs6mx06wbf6f99g0xrpymjfz0q8gv6";
          };
          doCheck = false;
        }))
      ]))
      pkgs.rcc
    ]));
    programs.vscode.extensions = (with pkgs.vscode-extensions; [
      ms-python.python
      # vscodevim.vim
      (pkgs.vscode-utils.buildVscodeMarketplaceExtension rec {
        mktplcRef = {
          name = "robotframework-lsp";
          publisher = "robocorp";
          version = "0.33.0";
          sha256 = "1hb2ij4lkgii2h0pc7nmfhyhnhlkq39rsqg3hp2ps06bxnld2hpa";
        };
      })
      (pkgs.vscode-utils.buildVscodeMarketplaceExtension rec {
        mktplcRef = {
          name = "robocorp-code";
          publisher = "robocorp";
          version = "0.21.0";
          sha256 = "16ya9f0zb5pc9kzv67pnsjgwm44pb2yzh4g2wb157nxzn9qxwk1l";
        };
        postInstall = ''
          mkdir -p $out/share/vscode/extensions/robocorp.robocorp-code/bin
          ln -s ${pkgs.rcc}/bin/rcc $out/share/vscode/extensions/robocorp.robocorp-code/bin
        '';
        })
    ]);
  };
}
