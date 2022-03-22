{ pkgs ? import ./nix {}
, app ? import ./default.nix { inherit pkgs; }
, name ? "artifact"
}:

with pkgs;

let

  env = buildEnv {
    name = "env";
    paths = [
      app
      rcc
      bashInteractive
      coreutils
      findutils
      netcat
      tini
      glibc.bin
    ];
  };

  closure = (writeReferencesToFile env);

in

runCommand name {
  buildInputs = [ makeWrapper ];
} ''
# aliases
mkdir -p usr/local/bin
for filename in ${env}/bin/??*; do
  cat > usr/local/bin/$(basename $filename) << EOF
#!/usr/local/bin/sh
set -e
exec $(basename $filename) "\$@"
EOF
done
rm -f usr/local/bin/sh
chmod a+x usr/local/bin/*

# shell
makeWrapper ${bashInteractive}/bin/sh usr/local/bin/sh \
  --set SHELL /usr/local/bin/sh \
  --prefix PATH : ${app}/bin \
  --prefix PATH : ${rcc}/bin \
  --prefix PATH : ${coreutils}/bin \
  --prefix PATH : ${findutils}/bin \
  --prefix PATH : ${netcat}/bin \
  --prefix PATH : ${tini}/bin \
  --prefix PATH : ${glibc.bin}/bin

# libc dynamic linker needed for running rcc-installed python
mkdir lib64
for file in ${glibc}/lib64/??*; do
  ln -s $file lib64/$(basename $file)
done

# artifact
tar czvhP \
  --hard-dereference \
  --exclude="${env}" \
  --exclude="*ncurses*/ncurses*/ncurses*" \
  --files-from=${closure} \
  usr lib64 > $out || true
''
