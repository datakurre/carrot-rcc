# Required inputs:
CONTAINER_PATH = vasara-bpm/carrot-rcc/carrot-rcc

CONTAINER_DOMAIN := registry.gitlab.com

CONTAINER_NAME = $(CONTAINER_DOMAIN)/$(CONTAINER_PATH)

ifdef CI_PIPELINE_ID
CONTAINER_TAG = $(if $(CI_COMMIT_TAG),$(CI_COMMIT_TAG),$(CI_PIPELINE_ID)-$(CI_COMMIT_SHORT_SHA))
else
CONTAINER_TAG = $(shell git describe --dirty --tags)
endif

CONTAINER_RT_BUILD_NAME := $(CI_PROJECT_ID)
CONTAINER_RT_BUILD_NUMBER := $(CI_PIPELINE_ID)

# Optional: fill in some meta for local builds
CI_COMMIT_TAG ?= $(shell git describe --exact-match --tags 2>/dev/null)
CI_COMMIT_SHA ?= $(shell git rev-parse HEAD)

NIX_OPTIONS ?= --accept-flake-config

# Bash is needed for pipefail
SHELL := bash

container-show:
	# CONTAINER_NAME = $(CONTAINER_NAME)
	# CONTAINER_TAG = $(CONTAINER_TAG)
	#
	# CONTAINER_RT_BUILD_NAME = $(CONTAINER_RT_BUILD_NAME)
	# CONTAINER_RT_BUILD_NUMBER = $(CONTAINER_RT_BUILD_NUMBER)
	#
	# CI_COMMIT_REF_NAME = $(CI_COMMIT_REF_NAME)
	# CI_COMMIT_TAG = $(CI_COMMIT_TAG)

container-show-image:
	@echo $(CONTAINER_NAME):$(CONTAINER_TAG)

.PHONY: .FORCE
Labels.json: .FORCE
	@echo '{' > Labels.json
	@echo '  "fi.jyu.vasara.rev": "$(CI_COMMIT_SHA)",' >> Labels.json
	@echo '  "fi.jyu.vasara.ref_name": "$(CI_COMMIT_REF_NAME)",' >> Labels.json
	@echo '  "fi.jyu.vasara.tag": "$(CI_COMMIT_TAG)",' >> Labels.json
	@echo '  "fi.jyu.vasara.url": "$(CI_PROJECT_URL)",' >> Labels.json
	@echo '  "fi.jyu.vasara.ci_job_id": "$(CI_JOB_ID)",' >> Labels.json
	@echo '  "fi.jyu.vasara.ci_pipeline_id": "$(CI_PIPELINE_ID)"' >> Labels.json
	@echo '}' >> Labels.json

container-dist: Labels.json
	@set -o pipefail
	@echo "# Build the image"
	nix build $(NIX_OPTIONS) --json .#image|jq -r .[0].outputs.out|sh|podman load -q
	git restore Labels.json
	podman tag localhost/$(CONTAINER_PATH):latest $(CONTAINER_NAME):$(CONTAINER_TAG)
	@echo "# Tag every build as latest"
	podman tag $(CONTAINER_NAME):$(CONTAINER_TAG) $(CONTAINER_NAME):latest

container-clean:
	rm -fr result-image.json

container-publish: container-dist
	podman push $(CONTAINER_NAME):$(CONTAINER_TAG)
	podman push $(CONTAINER_NAME):latest
