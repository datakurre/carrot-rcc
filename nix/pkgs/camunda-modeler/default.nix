{ stdenv, libXScrnSaver, makeWrapper, fetchurl, wrapGAppsHook, glib, gtk3, unzip, atomEnv, libuuid, at-spi2-atk, at-spi2-core, nodePackages, autoPatchelfHook, gcc-unwrapped, libdrm, mesa, libxkbcommon, adoptopenjdk-jre-hotspot-bin-11, libxshmfence, lib, libappindicator-gtk3, libglvnd }:

let

  sources = import ../../../nix/sources.nix;

  mkElectron = import "${sources."nixpkgs"}/pkgs/development/tools/electron/generic.nix" { inherit stdenv libXScrnSaver makeWrapper fetchurl wrapGAppsHook glib gtk3 unzip atomEnv libuuid at-spi2-atk at-spi2-core libdrm mesa libxkbcommon libxshmfence lib libappindicator-gtk3 libglvnd; };
  electron = mkElectron "17.1.0" {
    x86_64-linux = "1s18zrmqiiks9nq27nw2s65wcl0rqhxc6b343wg6qdk9b65c4vhh";
  };

  camunda-modeler-plugins = fetchurl {
    url = "https://github.com/camunda/camunda-modeler-plugins/archive/3659fb8dac82098fd8de98d50d03f0d33eea7556.tar.gz";
    sha256 = "0l64a7zq7z1vx2bjbrff9xn1g1c798zxf41pjnjggjwm55kfqvh0";
  };

  camunda-modeler-property-info-plugin = fetchurl {
    url = "https://github.com/umb/camunda-modeler-property-info-plugin/archive/b50e34e99ef87f5cac30a074acbd2aae29fe53b2.tar.gz";
    sha256 = "0ac6klmd788fams5ikrl47dr2adhxzbmay778chnrp7zgh1h9w5d";
  };

  camunda-modeler-linter-plugin = fetchurl {
    url = "https://github.com/camunda/camunda-modeler-linter-plugin/archive/c506ee6b250871c9b7785e9a1ff9fa9fe4334c85.tar.gz";
    sha256 = "080x1yjic2lhs5mqsbw3n2vxsgyadjgrflqjx20grq1vv3vjf5s1";
  };

  camunda-modeler-robot-plugin = fetchurl {
    url = "https://github.com/datakurre/camunda-modeler-robot-plugin/archive/287307f1c4951e937281a0f00d5857e01257b7c0.tar.gz";
    sha256 = "sha256-Msa1ZD6PPvKZQh3A/3m5kczCAGmmSCAV+r6NdgmGKak=";
  };

  camunda-modeler-tooltip-plugin = fetchurl {
    url = "https://github.com/viadee/camunda-modeler-tooltip-plugin/archive/d33ad3d35451e42806fcea525dd30a5857d32511.tar.gz";
    sha256 = "0s4j9rfqyys428havqhc9r2kdfbn3qi269rrxhh0jcq9v9rklld9";
  };

  bpmn-js-token-simulation-plugin = fetchurl {
    url = "https://github.com/bpmn-io/bpmn-js-token-simulation-plugin/archive/ba7b6c0f4edf0872229da58a20ef96590d9a99a8.tar.gz";
    sha256 = "0gns9pvy393jasvdwhyjgm79wpnmkbycp0hpm1pylif5qgb0df8a";
  };

  dmn-testing-plugin = fetchurl {
    url = "https://github.com/bpmn-io/dmn-testing-plugin/archive/ca25586d607e3bd04357ee1546424f859591e0b8.tar.gz";
    sha256 = "4a48bfeeac46baaa5731ae2472c564d6c154bf5ca7716b059d0ce1b47ecaa26d";
  };

  excel-import-plugin = fetchurl {
    url = "https://github.com/pinussilvestrus/camunda-modeler-excel-import-plugin/archive/19e3975a10a382caa80bcf62fcca28b4f0acb404.tar.gz";
    sha256 = "0cdj39bxakxri8fxfhbqf57b1ylsxrigil22w84kabf2a116931p";
  };

  asar = stdenv.mkDerivation rec {
    name = "camunda-modeler-${version}-asar";
    version = "5.4.1";
    src = fetchurl {
      url = "https://github.com/camunda/camunda-modeler/releases/download/v${version}/camunda-modeler-${version}-linux-x64.tar.gz";
      sha256 = "sha256-cdPGVeNmXGfq16Kcv8rCREApBWt7NDdwMD2uHwH7gOY=";
    };
    nativeBuildInputs = [ nodePackages.asar autoPatchelfHook gcc-unwrapped ];
    installPhase = ''
      asar extract ./resources/app.asar $out
    '';
  };

in

stdenv.mkDerivation rec {
  name = "camunda-modeler-${version}";
  version = "5.4.1";
  src = asar;
  unpackPhase = "";
  nativeBuildInputs = [ electron makeWrapper nodePackages.asar autoPatchelfHook gcc-unwrapped ];
  installPhase = ''
    mkdir -p $out/var/lib/camunda/resources/plugins $out/bin

    cp -a $src build
    chmod u+w -R build
    substituteInPlace build/lib/index.js \
      --replace "let resourcesPaths = [" \
                "let resourcesPaths = [\"$out/var/lib/camunda/resources\","
    asar pack build $out/var/lib/camunda/app.asar

    cd $out/var/lib/camunda/resources/plugins

    tar xzvf ${dmn-testing-plugin}
    tar xzvf ${camunda-modeler-robot-plugin}
    tar xzvf ${bpmn-js-token-simulation-plugin}
#   tar xzvf ${camunda-modeler-linter-plugin}

#   # Fix camunda/camunda-modeler-linter-plugin to allow inclusive gateways
#   substituteInPlace camunda-modeler-linter-plugin-*/dist/client.js \
#     --replace '"no-inclusive-gateway": "error",' "" \
#     --replace '"camunda/avoid-lanes": "warn",' ""

    tar xzvf ${camunda-modeler-tooltip-plugin}
    tar xzvf ${camunda-modeler-property-info-plugin}
    tar xzvf ${camunda-modeler-plugins}
    tar xzvf ${excel-import-plugin}
    mv camunda-modeler-plugins*/camunda-transaction-boundaries-plugin .
    rm -r camunda-modeler-plugins*

    makeWrapper ${electron}/bin/electron $out/bin/camunda-modeler \
      --add-flags "$out/var/lib/camunda/app.asar" \
      --prefix PATH : "${adoptopenjdk-jre-hotspot-bin-11}/bin"
  '';
}
