# https://github.com/nmattia/niv
{ sources ? import ./sources.nix
, nixpkgs ? sources."nixpkgs-21.05"
}:

let

  overlay = _: pkgs: {

    gitignoreSource = (import sources.gitignore {
      inherit (pkgs) lib;
    }).gitignoreSource;

    poetry2nix =
      import (sources.poetry2nix + "/default.nix") {
        pkgs = import sources."nixpkgs-21.05" {};
        poetry = (import sources."nixpkgs-21.05" {}).poetry;
    };

    rcc = pkgs.buildGoPackage rec {
      name = "rcc-${version}";
      version = "v9.16.0";
      goPackagePath = "github.com/robocorp/rcc";
      src = sources.rcc;
      nativeBuildInputs = with pkgs; [ go-bindata rake zip ];
      goDeps = ./rcc.nix;
      postPatch = ''
        source $stdenv/setup
        substituteInPlace Rakefile --replace "\$HOME/go/bin/" ""
        rake assets
      '';
    };

    # node2nix with nodejs 14 support
    node2nix = builtins.getAttr builtins.currentSystem(
      import (sources.node2nix + "/release.nix") {
        nixpkgs = sources."nixpkgs-20.09";
        systems = [ builtins.currentSystem ];
    }).package;

  };

  pkgs = import nixpkgs {
    overlays = [ overlay ];
    config = {};
  };

in pkgs
