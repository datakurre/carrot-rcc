{ nixpkgs }:

builtins.getAttr builtins.currentSystem (
  import ((import ./nix/sources.nix).node2nix + "/release.nix") {
    systems = [ builtins.currentSystem ];
    inherit nixpkgs;
}).package
