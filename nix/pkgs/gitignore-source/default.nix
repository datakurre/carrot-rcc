{ lib }:

(import ((import ./nix/sources.nix).gitignore) {
  inherit lib;
}).gitignoreSource
