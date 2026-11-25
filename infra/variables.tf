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

variable "kubernetes_version" {
  description = "Versión de Kubernetes del cluster. null usa la versión por defecto de AWS."
  type        = string
  default     = null
}

variable "node_instance_type" {
  description = "Tipo de instancia de los nodos del node group."
  type        = string
  default     = "t3.medium"
}

variable "node_min_size" {
  description = "Número mínimo de nodos del node group."
  type        = number
  default     = 1
}

variable "node_desired_size" {
  description = "Número deseado de nodos del node group."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Número máximo de nodos del node group."
  type        = number
  default     = 3
}

variable "master_username" {
  description = "Usuario maestro del cluster DocumentDB. Se inyecta desde secretos del entorno."
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Contraseña del usuario maestro del cluster DocumentDB. Se inyecta desde secretos del entorno."
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "Días de retención de los log groups de CloudWatch."
  type        = number
  default     = 30
}

variable "github_repo" {
  description = "Repositorio GitHub (owner/nombre) autorizado a desplegar vía OIDC."
  type        = string
  default     = "urielpinag/idc_proyecto"
}
