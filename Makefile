SHELL := /usr/bin/env bash
export PATH := node_modules/.bin:$(PATH)

NIX_OPTIONS ?= --accept-flake-config

.PHONY: all
all: format

.PHONY: format
format:
	npm run prettier:format

package-lock.json: package.json
	npm install --package-lock-only

.PHONY: shell
shell:
	nix-shell default.nix

.PHONY: test
test: node_modules
	npm run test

.PHONY: watch
watch:
	tsc -w

###

.PHONY: nix-%
nix-%:
	nix develop $(NIX_OPTIONS) --command $(MAKE) $*

node_modules:
	nix build $(NIX_OPTIONS) --json .#node_modules_dev|jq -r .[0].outputs.out|xargs -Ix cp -a x/node_modules node_modules
	chmod u+w -R node_modules
	touch node_modules

include release-container.mk
