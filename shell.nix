{ pkgs ? import ./nix { nixpkgs = sources."nixpkgs-21.05"; }
, sources ? import ./nix/sources.nix
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    entr
    gnumake
    node2nix
    nodejs-14_x
    poetry
    poetry2nix.cli
    (buildFHSUserEnv {
      name = "rcc";
      targetPkgs = pkgs: (with pkgs; [
        rcc
        micromamba
      ]);
      runScript = "rcc";
      profile = ''
        export LD_LIBRARY_PATH="${pkgs.dbus-glib}/lib:${pkgs.libGL}/lib"
      '';
    })
  ];
  shellHook = ''
    export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
  '';
}
