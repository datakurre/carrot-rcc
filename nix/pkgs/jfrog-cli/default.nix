{ buildGoPackage }:

buildGoPackage rec {
  name = "jfrog-cli-${version}";
  version = "1.39.1";
  goPackagePath = "github.com/jfrog/jfrog-cli";
  src = (import ./nix/sources.nix).jfrog-cli;
  goDeps = ./deps.nix;
  postPatch = "rm -r testdata";
}
