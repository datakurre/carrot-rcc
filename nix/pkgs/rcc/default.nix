{ callPackage, buildFHSUserEnv, buildGoPackage, go-bindata, rake, zip, micromamba
, which, cacert, dbus-glib, libGL }:

let rcc = callPackage ./rcc.nix {
  inherit buildGoPackage go-bindata rake zip;
};

in buildFHSUserEnv {
  name = "rcc";
  targetPkgs = pkgs: (with pkgs; [
    micromamba
    rcc
  ]);
  runScript = "rcc";
  # these are not easily available at Conda
  profile = ''
    export LD_LIBRARY_PATH="${dbus-glib}/lib:${libGL}/lib"
  '';
}
