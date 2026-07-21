variable "digitalocean_token"{
    type        = string
    sensitive   = true
    default     = null
}

variable "region" {
    description = "VPC Region"
    type        = string
    default     = "tor1"
}

variable "apex_domain" {
    description =   "Base SLD.TLS upon which all other domains are built (e.g. mysite.com)"
    type        =   string
}

variable "admin_email" {
    description = "Email address of the system administrator for domain and SSL cert info"
    type        =   string
}

variable "ssh_access_key_fingerprints" {
    type        =   list(string)
    description =   "Existing DO SSH key fingerprints for access"
    default     =   []
}

variable "client_image_id"{
    type        =   string
    description =   "DigitalOcean base image for the web client droplet"
    default     =   "ubuntu-24-04-x64"
}

variable "server_image_id" {
    type        =   string
    description =   "DigitalOcean base image for the server droplet"
    default     =   "ubuntu-24-04-x64"
}
