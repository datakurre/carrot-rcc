SHELL := /usr/bin/env bash
export PATH := node_modules/.bin:$(PATH)

.PHONY: all
all: format

env: poetry.lock
	nix-build -E "with import ./nix {}; poetry2nix.mkPoetryEnv { projectDir = ./.; }" -o env

.PHONY: format
format:
	npm run prettier:format

default.nix: package-lock.json
	rm -rf node_modules
	nix-shell --run "node2nix --nodejs-14 -l nix/package-lock.json"

package-lock.json: package.json
	npm install --package-lock-only

nix/node-dev-composition.nix: package-lock.json
	rm -rf node_modules
	node2nix --development --nodejs-14 -l package-lock.json --output nix/node-dev-packages.nix --node-env nix/node-dev-env.nix --composition nix/node-dev-composition.nix

nix/node-run-composition.nix: package-lock.json
	rm -rf node_modules
	node2nix --nodejs-14 -l package-lock.json --output nix/node-run-packages.nix --node-env nix/node-run-env.nix --composition nix/node-run-composition.nix

.PHONY: shell
shell:
	nix-shell default.nix

.PHONY: watch
watch:
	tsc -w

###

.PHONY: nix-%
nix-%:
	nix-shell $(NIX_OPTIONS) --run "$(MAKE) $*"

node_modules: package.json
	npm ci
	touch node_modules
