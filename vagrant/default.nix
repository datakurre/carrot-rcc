{ pkgs ? import ../nix {}}:

let

  configVirtualbox = pkgs.writeText "configuration.nix"
    ''
      { config, pkgs, ... }:

      let repo = fetchTarball https://github.com/datakurre/carrot-rcc/archive/refs/heads/main.tar.gz; in

      {
        imports = [ "''${repo}/vagrant/configuration-virtualbox.nix" ];
      }
    '';

  configLibvirt = pkgs.writeText "configuration.nix"
    ''
      { config, pkgs, ... }:

      let repo = fetchTarball https://github.com/datakurre/carrot-rcc/archive/refs/heads/main.tar.gz; in

      {
        imports = [ "''${repo}/vagrant/configuration-libvirt.nix" ];
      }
    '';

in

{
  virtualbox = (import "${pkgs.path}/nixos/lib/eval-config.nix" {
    inherit pkgs;
    modules = [
      ./configuration-virtualbox.nix
      ({config, pkgs, ...}: {
        virtualbox = {
           vmDerivationName = "nixos-ova-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}";
           vmFileName = "carrot-rcc-nixos-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}.ova";
           vmName = "Vasara (NixOS ${config.system.nixos.label} ${pkgs.stdenv.hostPlatform.system})";
           memorySize = 4 * 1024;
           params = { usbehci = "off"; };
        };
        boot.postBootCommands = ''
          # Provide a mount point for nixos-install.
          mkdir -p /mnt

          # Provide a configuration to allow users to run nixos-rebuild.
          if ! [ -e /etc/nixos/configuration.nix ]; then
            cp ${configVirtualbox} /etc/nixos/configuration.nix
          fi
        '';
      })
    ];
  }).config.system.build.vagrantVirtualbox;

  libvirt = (import "${pkgs.path}/nixos/lib/eval-config.nix" {
    inherit pkgs;
    modules = [
      ./configuration-libvirt.nix
      ({config, pkgs, ...}: {
        libvirt = {
           vmDerivationName = "nixos-qcow2-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}";
           vmFileName = "carrot-rcc-nixos-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}.qcow2";
           vmName = "Vasara (NixOS ${config.system.nixos.label} ${pkgs.stdenv.hostPlatform.system})";
        };
        boot.postBootCommands = ''
          # Provide a mount point for nixos-install.
          mkdir -p /mnt

          # Provide a configuration to allow users to run nixos-rebuild.
          if ! [ -e /etc/nixos/configuration.nix ]; then
            cp ${configLibvirt} /etc/nixos/configuration.nix
          fi
        '';
      })
    ];
  }).config.system.build.vagrantLibvirt;
}
