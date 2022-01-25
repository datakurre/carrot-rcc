{ appimageTools, fetchurl }:

appimageTools.wrapType2 rec {
  name = "mockoon-${version}";
  version = "1.17.0";
  src = fetchurl {
    url = "https://github.com/mockoon/mockoon/releases/download/v${version}/mockoon-${version}.AppImage";
    sha256 = "1v0w81m1g1h64b7qbv4wbz739vlgp6nqb83wxm0n806429rzi1fl";
  };
  extraPkgs = pkgs: with pkgs; [ ];
}
