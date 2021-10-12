{ pkgs ? import ./nix { nixpkgs = sources."nixpkgs-21.05"; }
, unstable ? import ./nix { nixpkgs = sources."nixpkgs-unstable"; }
, sources ? import ./nix/sources.nix
}:

let

  dev_node_modules = (import ./nix/node-dev-composition.nix { inherit pkgs; }).package.override {
    src = builtins.filterSource (path: type:
      (baseNameOf path) == "package.json" ||
      (baseNameOf path) == "package-lock.json" ) ./.;
    preRebuild = ''
      sed -i 's|"bin": "./carrot-rcc",||' package.json
    '';
    postInstall = ''
      mv $out/lib/node_modules/*/node_modules /tmp/_; rm -rf $out; mv /tmp/_ $out
    '';
  };

  run_node_modules = (import ./nix/node-run-composition.nix { inherit pkgs; }).package.override {
    src = builtins.filterSource (path: type:
      (baseNameOf path) == "package.json" ||
      (baseNameOf path) == "package-lock.json" ) ./.;
    preRebuild = ''
      sed -i 's|"bin": "./carrot-rcc",||' package.json
    '';
    postInstall = ''
      mv $out/lib/node_modules/*/node_modules /tmp/_; rm -rf $out; mv /tmp/_ $out
    '';
  };

  rccWrapped  = (pkgs.buildFHSUserEnv {
    name = "rcc";
    targetPkgs = pkgs: (with pkgs; [
      rcc
      firefox
      geckodriver
      unstable.micromamba
      libGL
    ]);
    runScript = "rcc";
  });

in

pkgs.stdenv.mkDerivation rec {
  name = "external-task-client";
  src = pkgs.gitignoreSource ./.;
  buildPhase = ''
    source $stdenv/setup;
    cp -a ${dev_node_modules} node_modules
    node_modules/.bin/rollup -c rollup.config.js
  '';
  installPhase = ''
    source $stdenv/setup;
    mkdir -p $out/bin
    cp -a carrot-rcc $out/bin/carrot-rcc
  '';
  postFixup = ''
    mkdir -p $out/bin
    install carrot-rcc $out/bin/carrot-rcc
    wrapProgram $out/bin/carrot-rcc \
      --prefix PATH : ${pkgs.lib.makeBinPath propagatedBuildInputs}
  '';
  buildInputs = with pkgs; [ makeWrapper bindfs ];
  propagatedBuildInputs = with pkgs; [
    nodejs-14_x
    rccWrapped
  ];
  shellHook = ''
    fusermount -qu node_modules
    mkdir -p node_modules
    bindfs ${dev_node_modules} node_modules -o nonempty
    export PATH=$(pwd)/node_modules/.bin:$PATH
  '';
}
