{ pkgs ? import ./nix { nixpkgs = sources."nixpkgs-21.05"; }
, sources ? import ./nix/sources.nix
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    entr
    gnumake
    niv
    node2nix
    nodejs-14_x
    poetry
    poetry2nix.cli
#   rccFHSUserEnv
  ];
  shellHook = ''
    export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt
  '';
}
