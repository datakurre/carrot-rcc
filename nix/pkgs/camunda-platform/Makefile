mvn2nix-lock.json: pom.xml
	mvn2nix -vvv --jdk=$(JAVA_HOME) > mvn2nix-lock.json

###

.PHONY: nix-%
nix-%:
	@echo "run inside nix-shell: $*"
	nix-shell --pure --run "$(MAKE) $*"
