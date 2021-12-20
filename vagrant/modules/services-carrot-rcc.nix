{ config, pkgs, ... }:

let constants = import ./constants.nix {};

in {
  systemd.paths.vasara-carrot-rcc-watcher = {
    wantedBy = [ "multi-user.target" ];
    pathConfig = {
      PathChanged = "/var/lib/carrot-rcc";
      PathModified = "/var/lib/carrot-rcc";
    };
  };
  systemd.services.vasara-carrot-rcc-watcher = {
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = "systemctl restart vasara-carrot-rcc.service";
    };
  };
  systemd.services.vasara-carrot-rcc = {
    wantedBy = [ "multi-user.target" ];
    path = with pkgs; [
      findutils
      netcat
      carrot-rcc
      rccFHSUserEnv
    ];
    environment = {
      CAMUNDA_API_AUTHORIZATION = "Bearer ${constants.vasara_rest_secret}";
      CLIENT_LOG_LEVEL = "debug";
      VAULT_ADDR = "http://${config.services.vault.address}";
      VAULT_TOKEN = "${constants.vault_root_token_id}";
    };
    unitConfig = {
      StartLimitInterval = 300;
      StartLimitBurst = 15;
    };
    serviceConfig = {
      User = "vagrant";
      Group = "users";
      Restart = "on-failure";
      RestartSec = 1;
      StateDirectory = "carrot-rcc";
    };
    script = ''
      rm -f $STATE_DIRECTORY/carrot-rcc
      cd $STATE_DIRECTORY
      HOME=/home/vagrant carrot-rcc $(find . -name "*.zip")
    '';
  };
}
