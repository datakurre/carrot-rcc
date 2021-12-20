{ config, pkgs, lib, ... }:

{
  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs; in [
    "${nixpkgs}/nixos/modules/profiles/qemu-guest.nix"
    "${nixpkgs}/nixos/modules/installer/cd-dvd/channel.nix"
    ./configuration.nix
  ];

  options = with lib; {
    libvirt = {
      baseImageSize = mkOption {
        type = with types; either (enum [ "auto" ]) int;
        default = "auto";
        example = 50 * 1024;
        description = ''
          The size of the libvirt base image in MiB.
        '';
      };
      baseImageFreeSpace = mkOption {
        type = with types; int;
        default = 30 * 1024;
        description = ''
          Free space in the libvirt base image in MiB.
        '';
      };
      vmDerivationName = mkOption {
        type = types.str;
        default = "nixos-qcow2-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}";
        description = ''
          The name of the derivation for the libvirt appliance.
        '';
      };
      vmName = mkOption {
        type = types.str;
        default = "NixOS ${config.system.nixos.label} (${pkgs.stdenv.hostPlatform.system})";
        description = ''
          The name of the libvirt appliance.
        '';
      };
      vmFileName = mkOption {
        type = types.str;
        default = "nixos-${config.system.nixos.label}-${pkgs.stdenv.hostPlatform.system}.qcow2";
        description = ''
          The file name of the libvirt appliance.
        '';
      };
    };
  };

  config = let nixpkgs = (import ../nix/sources.nix).nixpkgs;
           cfg = config.libvirt; in {
    system.build.qcow2 = import "${nixpkgs}/nixos/lib/make-disk-image.nix" {
      name = cfg.vmDerivationName;
      diskSize = cfg.baseImageSize;
      additionalSpace = "${toString cfg.baseImageFreeSpace}M";
      format = "qcow2-compressed";
      postVM = ''
        mkdir -p $out
        fn="$out/${cfg.vmFileName}"
        mv $diskImage $fn
        mkdir -p $out/nix-support
        echo "file qcow2 $fn" >> $out/nix-support/hydra-build-products
      '';
      inherit (pkgs) lib;
      inherit pkgs config;
    };

    # generate the box v1 format which is much easier to generate
    # https://www.vagrantup.com/docs/boxes/format.html
    system.build.vagrantLibvirt = pkgs.runCommand
      "libvirt-vagrant.box"
      {}
      ''
        mkdir workdir
        cd workdir

        # 1. create that metadata.json file
        echo '{"format":"qcow2","provider":"libvirt","virtual_size":4096}' > metadata.json

        # 2. create a default Vagrantfile config
        cat <<VAGRANTFILE > Vagrantfile
          Vagrant.configure("2") do |config|
          config.vm.base_mac = "0800275F0936"
        end
        VAGRANTFILE

        # 3. move the qcow2 to the fixed location
        cp ${config.system.build.qcow2}/*.qcow2 box.img

        # 4. generate qcow2 manifest file
        touch box.mf
        for fname in *; do
          checksum=$(sha256sum $fname | cut -d' ' -f 1)
          echo "SHA256($fname)= $checksum" >> box.mf
        done

        # 5. compress everything back together
        tar --owner=0 --group=0 --sort=name --numeric-owner -czf $out .
      '';

    boot.growPartition = true;
    boot.loader.grub.device = "/dev/sda";

    fileSystems = {
      "/" = {
        device = "/dev/disk/by-label/nixos";
        autoResize = true;
        fsType = "ext4";
      };
    };

    swapDevices = [{
      device = "/var/swap";
       size = 4096;
    }];

    nixpkgs.pkgs = import ../nix {};

    sound.enable = false;

    services.xserver.videoDrivers = [ "qxl" "cirrus" "vesa" ];
    services.qemuGuest.enable = true;
    services.spice-vdagentd.enable = true;

    documentation.man.enable = false;
    documentation.nixos.enable = false;
  };
}
