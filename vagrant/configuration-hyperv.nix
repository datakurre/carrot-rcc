{ config, pkgs, ... }:

{
  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs; in [
    "${nixpkgs}/nixos/modules/virtualisation/vagrant-guest.nix"
    "${nixpkgs}/nixos/modules/virtualisation/hyperv-image.nix"
    "${nixpkgs}/nixos/modules/installer/cd-dvd/channel.nix"
    ./configuration.nix
  ];

  # generate the box v1 format which is much easier to generate
  # https://www.vagrantup.com/docs/boxes/format.html
  system.build.vagrantHyperV = pkgs.runCommand
    "hyperv-vagrant.box"
    { vmXml = ./configuration-hyperv.xml; }
    ''
      mkdir workdir
      cd workdir

      # 1. create that metadata.json file
      echo '{"provider": "hyperv"}' > metadata.json

      # 2. create a default Vagrantfile config
      cat <<VAGRANTFILE > Vagrantfile
      Vagrant.configure("2") do |config|
        config.vm.base_mac = "0800275F0936"
      end
      VAGRANTFILE

      # 3. move the vhdx to the fixed location
      mkdir -p "Virtual Hard Disks"
      cp ${config.system.build.hypervImage}/*.vhdx "Virtual Hard Disks/disk.vhd"
      mkdir -p "Virtual Machines"
      cp $vmXml "Virtual Machines/vm.XML"

      # 4. generate vhdx manifest file
      touch box.mf
      for fname in *; do
        if [ ! -d "$fname" ]; then
          checksum=$(sha256sum "$fname" | cut -d' ' -f 1)
          echo "SHA256($fname)= $checksum" >> box.mf
        fi
      done

      # 5. compress everything back together
      tar --owner=0 --group=0 --sort=name --numeric-owner -czf $out .
    '';

  swapDevices = [{
    device = "/var/swap";
    size = 4096;
  }];

  services.xserver.videoDrivers = [ "virtualbox" "vmware" "cirrus" "vesa" ];
  users.extraUsers.vagrant.extraGroups = [ "vboxsf" ];
  virtualisation.hypervGuest.enable = true;

  nixpkgs.pkgs = import ../nix {};
}
