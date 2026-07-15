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
    image           =   "ubuntu-24-04-x64"
    droplet_agent   = true
    ssh_keys       =   var.ssh_access_key_fingerprints
 #                       EOF
}

resource "digitalocean_record" "dns" {
    domain  = var.apex_domain
    type    =   "A"
    name    =   "client.staging"
    value   =   digitalocean_droplet.web_server.ipv4_address
    ttl     =   300
}

resource "digitalocean_project_resources" "project_membership" {
    project     =   data.digitalocean_project.project.id
    resources = [
        digitalocean_droplet.web_server.urn
    ]
}

output "droplet_public_ip" {
    description =   "Public IP of the (static asset) web server"
    value       =   digitalocean_droplet.web_server.ipv4_address
}