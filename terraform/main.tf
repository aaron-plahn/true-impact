data "digitalocean_project" "project" {
    name    =   "true-impact-staging"
}


resource "digitalocean_vpc" "vpc" {
    name        =   "vpc"
    region      =   var.region
    ip_range    =   "10.10.10.0/24"
}

resource "digitalocean_droplet" "web_server" {
    name            =   "web-server"
    size            =   "s-1vcpu-512mb-10gb"
    region          =   var.region
    vpc_uuid        = digitalocean_vpc.vpc.id
    image           =   var.client_image_id
    droplet_agent   = true
    ssh_keys        =   var.ssh_access_key_fingerprints
}

resource "digitalocean_droplet" "backend_server"{
    name            =   "backend"
    size            =   "s-1vcpu-512mb-10gb"
    region          =   var.region
    vpc_uuid        =   digitalocean_vpc.vpc.id
    image           =   var.server_image_id
    droplet_agent   =   true
    ssh_keys        =   var.ssh_access_key_fingerprints
}

resource "digitalocean_record" "client_dns_record" {
    domain  = var.apex_domain
    type    =   "A"
    name    =   "client.staging"
    value   =   digitalocean_droplet.web_server.ipv4_address
    ttl     =   300
}


resource "digitalocean_record" "server_dns_record" {
    domain  = var.apex_domain
    type    =   "A"
    name    =   "server.staging"
    value   =   digitalocean_droplet.backend_server.ipv4_address
    ttl     =   300
}

resource "digitalocean_project_resources" "project_membership" {
    project     =   data.digitalocean_project.project.id
    resources = [
        digitalocean_droplet.web_server.urn,
        digitalocean_droplet.backend_server.urn
    ]
}

output "client_public_ip" {
    description =   "Public IP of the (static asset) web server"
    value       =   digitalocean_droplet.web_server.ipv4_address
}

output "server_public_ip" {
    description =   "Public IP of the (backend) server"
    value       =   digitalocean_droplet.backend_server.ipv4_address
}