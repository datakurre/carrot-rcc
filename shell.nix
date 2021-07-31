{ pkgs ? import ./nix { nixpkgs = sources."nixpkgs-21.05"; }
, unstable ? import ./nix { nixpkgs = sources."nixpkgs-unstable"; }
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
    unstable.micromamba
    (buildFHSUserEnv {
      name = "rcc";
      targetPkgs = pkgs: (with pkgs; [
        rcc
        firefox
        geckodriver
        unstable.micromamba
        libGL
      ]);
      runScript = "rcc";
    })
  ];
  shellHook = ''
    export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
  '';
}
