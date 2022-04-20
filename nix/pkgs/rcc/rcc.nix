{ buildGoPackage, go-bindata, rake, zip, micromamba }:

buildGoPackage rec {
  name = "rcc-${version}";
  version = "v11.10.3";
  goPackagePath = "github.com/robocorp/rcc";
  src = (import ./nix/sources.nix).rcc;
  nativeBuildInputs = [ go-bindata rake zip ];
  propagatedBuildInputs = [ micromamba ];
  goDeps = ./deps.nix;
  postPatch = ''
    source $stdenv/setup
    substituteInPlace Rakefile --replace "\$HOME/go/bin/" ""
    rake assets
  '';
}
