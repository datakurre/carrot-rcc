BOX_NAME ?= datakurre/carrot-rcc
BOX_VERSION ?= 0.7.2

NIX_BUILD ?= nix-build --no-out-link

all:
	vagrant cloud publish -f $(BOX_NAME) $(BOX_VERSION) libvirt $$(HOME= $(NIX_BUILD) -A libvirt)
	vagrant cloud publish -f $(BOX_NAME) $(BOX_VERSION) hyperv $$(HOME= $(NIX_BUILD) -A hyperv)
	vagrant cloud publish -rf $(BOX_NAME) $(BOX_VERSION) virtualbox $$(HOME= $(NIX_BUILD) -A virtualbox)
