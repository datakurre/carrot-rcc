{
  description = "Camunda RCC Executor";

  nixConfig = {
    extra-trusted-public-keys =
      "vasara-bpm.cachix.org-1:T18iQZQvYDy/6VdGmttnkkq7rYi3JP0S1RjjdnXNu/4=";
    extra-substituters = "https://vasara-bpm.cachix.org";
  };

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.05";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/master";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
    vasara-bpm = {
      url = "gitlab:vasara-bpm/pkgs";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = { self, ... }@inputs:
    inputs.flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs-unstable = import inputs.nixpkgs { inherit system; };
        pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              nodejs-16_x = final.nodejs; # for npmlock2nix.v2
              npmlock2nix =
                pkgs.callPackage inputs.npmlock2nix { inherit pkgs; };
            })
          ];
        };
        gitignoreSource = inputs.gitignore.lib.gitignoreSource;
        packagesSource = builtins.filterSource (path: type:
          (baseNameOf path) == "package.json" || (baseNameOf path)
          == "package-lock.json") ./.;
        package-name =
          (builtins.fromJSON (builtins.readFile ./package.json)).name;
        call-name = "carrot-rcc";
      in {

        apps.default = {
          type = "app";
          program = self.packages.${system}.default + "/bin/${call-name}";
        };

        packages.node_modules_dev =
          pkgs.npmlock2nix.v2.node_modules { src = packagesSource; };

        packages.node_modules = pkgs.npmlock2nix.v2.node_modules {
          src = packagesSource;
          postBuild = ''
            npm prune --omit=dev
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation rec {
          name = call-name;
          # For now, we whitelist source files to prevent vagrant updates causing rebuild
          src = builtins.filterSource (path: type:
            (baseNameOf path) == "carrot_rcc.ts" || (baseNameOf path)
            == "carrot_rcc_lib.ts" || (baseNameOf path) == "Camunda.ts"
            || (baseNameOf path) == "rollup.config.js" || (baseNameOf path)
            == "node-run-packages.nix" || (baseNameOf path) == "package.json"
            || (baseNameOf path) == "package-lock.json") ./.;
          buildPhase = ''
            source $stdenv/setup;
            cp -a ${
              self.packages.${system}.node_modules_dev
            }/node_modules node_modules
            node_modules/.bin/rollup -c rollup.config.js
          '';
          installPhase = ''
            source $stdenv/setup;
            mkdir -p $out/bin
            install ${call-name} $out/bin/${call-name}
          '';
          postFixup = ''
            wrapProgram $out/bin/carrot-rcc \
              --prefix PATH : ${pkgs.lib.makeBinPath propagatedBuildInputs}
          '';
          buildInputs = [ pkgs.makeWrapper ];
          propagatedBuildInputs = [ pkgs.nodejs ];
        };

        packages.image = pkgs.dockerTools.streamLayeredImage {
          name = "vasara-bpm/carrot-rcc/${call-name}";
          tag = "latest";
          created = "now";
          maxLayers = 120;
          contents = [
            (pkgs.buildEnv {
              name = "image-contents";
              paths = [
                pkgs.bashInteractive
                pkgs.coreutils
                pkgs.curl
                pkgs.dejavu_fonts
                pkgs.dockerTools.caCertificates
                (pkgs.dockerTools.fakeNss.override {
                  extraPasswdLines = [
                    "container:x:65:65:Container user:/var/empty:/bin/sh"
                  ];
                  extraGroupLines = [
                    "container:!:65:"
                  ];
                })
                pkgs.findutils
                pkgs.micromamba
                pkgs.gitMinimal
                pkgs.tini
                (pkgs.stdenv.mkDerivation {
                  name = "fonts.conf";
                  src = (pkgs.makeFontsConf {
                    fontDirectories = [ pkgs.dejavu_fonts ];
                  });
                  phases = [ "installPhase" ];
                  installPhase = ''
                    mkdir -p $out/etc/fonts
                    cp -a $src $out/etc/fonts/fonts.conf
                  '';
                })
                inputs.vasara-bpm.packages.${system}.rcc
                self.packages.${system}.default
                # extra paths to bloat image, but seen required in LD_LIBRARY_PATH
                pkgs.alsaLib
                pkgs.dbus-glib
                pkgs.libGL
              ];
              pathsToLink = [ "/etc" "/sbin" "/bin" ];
            })
          ];
          extraCommands = ''
            mkdir -p usr/bin && ln -s /sbin/env usr/bin/env
            mkdir -p tmp && chmod a+rxwt tmp
            mkdir -p lib64 && ln -s ${pkgs.glibc}/lib/ld-linux-x86-64.so.2 lib64
          '';
          config = {
            Entrypoint = [
              "${pkgs.tini}/bin/tini"
              "--"
              "${self.packages.${system}.default}/bin/${call-name}"
            ];
            Env = [
              "TMPDIR=/tmp"
              "HOME=/tmp"
              "LD_LIBRARY_PATH=${pkgs.dbus-glib}/lib:${pkgs.libGL}/lib:${pkgs.alsaLib}/lib"
            ];
            Labels = { };
            User = "nobody";  # also container:65:65 supported
          };
        };

        devShells.default = pkgs.mkShell {
          buildInputs =
            [ pkgs-unstable.cachix pkgs.entr pkgs.openssl pkgs.nodejs pkgs.jq ];
        };

        devShells.with-podman =
          inputs.vasara-bpm.devShells.${system}.podman.overrideAttrs (old: {
            buildInputs = old.buildInputs
              ++ self.devShells.${system}.default.buildInputs;
          });

        formatter = pkgs.nixfmt;
      });
}
