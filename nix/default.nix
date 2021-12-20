# https://github.com/nmattia/niv
{ sources ? import ./sources.nix
, nixpkgs ? sources."nixpkgs-21.11"
}:

let

  overlay = _: pkgs: {
    buildMavenRepositoryFromLockFile = (pkgs.callPackage ./pkgs/mvn2nix { inherit nixpkgs; }).buildMavenRepositoryFromLockFile;
    camunda-modeler = pkgs.callPackage ./pkgs/camunda-modeler {};
    camunda-platform = pkgs.callPackage ./pkgs/camunda-platform {};
    carrot-rcc = import ../. { inherit pkgs; };
    gitignoreSource = pkgs.callPackage ./pkgs/gitignore-source {};
    micromamba = (import sources."nixpkgs-21.11" {}).micromamba;
    mvn2nix = (pkgs.callPackage ./pkgs/mvn2nix { inherit nixpkgs; }).mvn2nix;
    node2nix = pkgs.callPackage ./pkgs/node2nix { inherit nixpkgs; };
    poetry2nix = pkgs.callPackage ./pkgs/poetry2nix { inherit nixpkgs; };
    rcc = pkgs.callPackage ./pkgs/rcc/rcc.nix {};
    rccFHSUserEnv = pkgs.callPackage ./pkgs/rcc {};
  };

  pkgs = import nixpkgs {
    overlays = [ overlay ];
    config = {
      allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [
        "code"
        "font-bh-100dpi"
        "font-bh-lucidatypewriter-100dpi"
        "font-bh-lucidatypewriter-75dpi"
        "vscode"
      ];
    };
  };

in pkgs
