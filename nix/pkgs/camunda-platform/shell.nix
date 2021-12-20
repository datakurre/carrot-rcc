{ pkgs ? import ../.. {}
}:

pkgs.mkShell {
  buildInputs = with pkgs; [
    jdk17_headless
    (maven.override { jdk = jdk17_headless; })
    mvn2nix
  ];
}
