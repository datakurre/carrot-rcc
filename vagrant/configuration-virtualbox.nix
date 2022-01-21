{ config, pkgs, ... }:

{
  imports = let nixpkgs = (import ../nix/sources.nix).nixpkgs; in [
    "${nixpkgs}/nixos/modules/virtualisation/vagrant-virtualbox-image.nix"
    "${nixpkgs}/nixos/modules/installer/cd-dvd/channel.nix"
    ./configuration.nix
  ];

  swapDevices = [{
    device = "/var/swap";
    size = 4096;
  }];

  services.xserver.videoDrivers = [ "virtualbox" "vmware" "cirrus" "vesa" ];
  users.extraUsers.vagrant.extraGroups = [ "vboxsf" ];
  virtualisation.virtualbox.guest.enable = true;
  virtualisation.virtualbox.guest.x11 = true;

  nixpkgs.pkgs = import ../nix {};
}
