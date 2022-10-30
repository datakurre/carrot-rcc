{ buildGoPackage, go-bindata, rake, zip, micromamba }:

buildGoPackage rec {
  name = "rcc-${version}";
  version = "v11.29.0";
  goPackagePath = "github.com/robocorp/rcc";
  src = (import ./nix/sources.nix).rcc;
  nativeBuildInputs = [ go-bindata rake zip ];
  propagatedBuildInputs = [ micromamba ];
  goDeps = ./deps.nix;
  postPatch = ''
    source $stdenv/setup
    substituteInPlace Rakefile --replace "\$HOME/go/bin/" ""
    # Fix issue where rcc holotree variables did unset bash prompt
    substituteInPlace conda/activate.go \
      --replace 'if !ok {' 'if !ok && key != "PS1" {'
    rake assets
  '';
}
