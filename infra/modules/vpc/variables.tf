variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
}

variable "vpc_cidr" {
  description = "Bloque CIDR de la VPC."
  type        = string
}

variable "azs" {
  description = "Zonas de disponibilidad donde se reparten las subnets."
  type        = list(string)
}
