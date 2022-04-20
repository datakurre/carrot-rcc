# https://github.com/nmattia/niv
{ sources ? import ./sources.nix
, nixpkgs ? sources."nixpkgs-21.11"
}:

let

  unstable = import sources."nixpkgs-unstable" {};

  overlay = _: pkgs: {
    buildMavenRepositoryFromLockFile = (pkgs.callPackage ./pkgs/mvn2nix { inherit nixpkgs; }).buildMavenRepositoryFromLockFile;
    camunda-modeler = pkgs.callPackage ./pkgs/camunda-modeler {};
    camunda-platform = pkgs.callPackage ./pkgs/camunda-platform {};
    carrot-rcc = import ../. { inherit pkgs; };
    gitignoreSource = pkgs.callPackage ./pkgs/gitignore-source {};
    micromamba = (import sources."nixpkgs-21.11" { overlays = []; }).micromamba;
    mockoon = pkgs.callPackage ./pkgs/mockoon {};
    mvn2nix = (pkgs.callPackage ./pkgs/mvn2nix { inherit nixpkgs; }).mvn2nix;
    node2nix = pkgs.callPackage ./pkgs/node2nix { inherit nixpkgs; };
    poetry2nix = pkgs.callPackage ./pkgs/poetry2nix { inherit nixpkgs; };
    rcc = pkgs.callPackage ./pkgs/rcc/rcc.nix {};
    rccFHSUserEnv = pkgs.callPackage ./pkgs/rcc {};

    inherit (unstable)
    novnc
#   vscode
    vscodium;

    vscode = pkgs.callPackage ./pkgs/vscode/vscode.nix {};
  };

  pkgs = import nixpkgs {
    overlays = [ overlay ];
    config = {
      permittedInsecurePackages = [
        "electron-12.1.2"  # EOL; camunda-modeler < 5.0.0
      ];
      allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [
        "code"
        "vscode"
        "vscode-extension-ms-vsliveshare-vsliveshare"
      ];
    };
  };

in pkgs
