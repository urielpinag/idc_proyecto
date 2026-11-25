variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
}

variable "kubernetes_version" {
  description = "Versión de Kubernetes del cluster. null usa la versión por defecto de AWS."
  type        = string
  default     = null
}

variable "private_subnet_ids" {
  description = "IDs de las subnets privadas donde se despliega el cluster y los nodos."
  type        = list(string)
}

variable "node_instance_type" {
  description = "Tipo de instancia de los nodos del node group gestionado."
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
