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

    rcc = pkgs.callPackage ./pkgs/rcc {};

    micromamba = (import sources."nixpkgs-unstable" {}).micromamba;

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
