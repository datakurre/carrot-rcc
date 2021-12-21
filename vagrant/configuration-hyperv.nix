{ config, pkgs, ... }:

{
  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs; in [
    "${nixpkgs}/nixos/modules/virtualisation/hyperv-image.nix"
    "${nixpkgs}/nixos/modules/installer/cd-dvd/channel.nix"
    ./configuration.nix

  ];

  # generate the box v1 format which is much easier to generate
  # https://www.vagrantup.com/docs/boxes/format.html
  system.build.vagrantHyperV = pkgs.runCommand
    "hyperv-vagrant.box"
    {}
    ''
      mkdir workdir
      cd workdir

      # 1. create that metadata.json file
      echo '{"format":"vhdx","provider":"hyperv","virtual_size":8192}' > metadata.json

      # 2. create a default Vagrantfile config
      cat <<VAGRANTFILE > Vagrantfile
        Vagrant.configure("2") do |config|
        config.vm.base_mac = "0800275F0936"
      end
      VAGRANTFILE

      # 3. move the vhdx to the fixed location
      cp ${config.system.build.hypervImage}/*.vhdx box.img

      # 4. generate vhdx manifest file
      touch box.mf
      for fname in *; do
        checksum=$(sha256sum $fname | cut -d' ' -f 1)
        echo "SHA256($fname)= $checksum" >> box.mf
      done

      # 5. compress everything back together
      tar --owner=0 --group=0 --sort=name --numeric-owner -czf $out .
    '';

  swapDevices = [{
    device = "/var/swap";
    size = 4096;
  }];

  nixpkgs.pkgs = import ../nix {};

  services.xserver.videoDrivers = [ "virtualbox" "vmware" "cirrus" "vesa" ];
  users.extraUsers.vagrant.extraGroups = [ "vboxsf" ];
  virtualisation.hypervGuest.enable = true;
}
