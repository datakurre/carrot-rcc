# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "datakurre/carrot-rcc"

  config.vm.provision "rebuild", type: "shell",
    inline: "sudo nixos-rebuild switch --max-jobs 1"

  config.vm.graceful_halt_timeout = 120

  ## Forward Camunda
  # config.vm.network "forwarded_port", guest: 8080, host: 8080 # camunda

  config.vm.provider "virtualbox" do |vb, override|
    vb.gui = true
    vb.memory = 6144
    vb.cpus = 2
    override.vm.provision "remount", type: "shell",
      inline: "sudo mount -t vboxsf vagrant /vagrant -o umask=0022,gid=1000,uid=1000"
  end

  config.vm.provider :libvirt do |libvirt, override|
    libvirt.video_type = "qxl"
    libvirt.graphics_type = "spice"
    libvirt.graphics_port = 5634
    libvirt.memory = 4096
    libvirt.cpus = 2
    libvirt.keymap = "fi"

    override.vm.synced_folder "./", "/vagrant",
      type: "9p", disabled: false,
      accessmode: "squash", owner: "1000"
  end
end
