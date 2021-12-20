{ nixpkgs }:

import ((import ./nix/sources.nix).poetry2nix + "/default.nix") {
  pkgs = import nixpkgs {};
  poetry = (import nixpkgs {}).poetry;
}
