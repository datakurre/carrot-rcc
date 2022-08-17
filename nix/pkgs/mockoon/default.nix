{ appimageTools, fetchurl }:

appimageTools.wrapType2 rec {
  name = "mockoon-${version}";
  version = "1.20.0";
  src = fetchurl {
    url = "https://github.com/mockoon/mockoon/releases/download/v${version}/mockoon-${version}.AppImage";
    sha256 = "sha256-t5yispXEy8EPpKgsZxCzrjZfM2ZvunNxqQI6/2RNG8s=";
  };
  extraPkgs = pkgs: with pkgs; [ ];
}
