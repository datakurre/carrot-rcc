{ stdenv, jre_minimal, jdk17_headless, maven
, buildMavenRepositoryFromLockFile, gitignoreSource
}:

let

  mavenRepository = buildMavenRepositoryFromLockFile {
    file = ./mvn2nix-lock.json;
  };

  jar = stdenv.mkDerivation rec {
    pname = "camunda-app";
    version = "0.1.0-SNAPSHOT";
    name = "${pname}-${version}.jar";
    src = gitignoreSource ./.;

    buildInputs = [ jdk17_headless maven ];
    buildPhase = ''
      find . -print0|xargs -0 touch
      echo "mvn package --offline -Dmaven.repo.local=${mavenRepository}"
      mvn package --offline -Dmaven.repo.local=${mavenRepository}
    '';

    installPhase = ''
      cp ./target/camunda-*.jar $out
      jar i $out
    '';
  };

  jre = jre_minimal.override {
    jdk = jdk17_headless;
    modules = [
      # jdeps -q --ignore-missing-deps --multi-release 17 --print-module-deps foobar.jar
      "java.base"
      "java.compiler"
      "java.desktop"
      "java.instrument"
      "java.management"
      "java.naming"
      "java.prefs"
      "java.rmi"
      "java.scripting"
      "java.security.jgss"
      "java.security.sasl"
      "java.sql"
      "jdk.attach"
      "jdk.jdi"
      "jdk.jfr"
      "jdk.unsupported"
    ];
  };

in

stdenv.mkDerivation {
  name = "camunda-platform-7.16";
  phases = [ "installPhase" "fixupPhase" ];
  installPhase = ''
    source $stdenv/setup
    mkdir -p $out/bin
    cat > $out/bin/camunda << EOF
    #!/usr/bin/env sh
    export LD_LIBRARY_PATH=${jre}/lib
    exec ${jre}/bin/java \$JVM_OPTS -jar ${jar} "\$@"
    EOF
    chmod u+x $out/bin/camunda
  '';
}
