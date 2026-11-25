variable "aws_region" {
  description = "Región de AWS donde se despliega la infraestructura."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
  default     = "tvhub"
}

variable "vpc_cidr" {
  description = "Bloque CIDR de la VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Zonas de disponibilidad donde se reparten las subnets."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.azs) == 2
    error_message = "Deben declararse exactamente dos zonas de disponibilidad."
  }
}
