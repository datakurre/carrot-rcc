{ nixpkgs }:

(import ((import ./nix/sources.nix).mvn2nix) {
  inherit nixpkgs;
})
