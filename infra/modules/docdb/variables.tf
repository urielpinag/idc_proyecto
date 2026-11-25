variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC donde se crea el security group de DocumentDB."
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs de las subnets privadas donde se despliega el subnet group de DocumentDB."
  type        = list(string)
}

variable "node_security_group_id" {
  description = "ID del security group de los nodos EKS, única fuente autorizada a conectar al puerto 27017."
  type        = string
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

variable "instance_class" {
  description = "Clase de la instancia de DocumentDB."
  type        = string
  default     = "db.t3.medium"
}

variable "backup_retention_period" {
  description = "Días de retención de backups automáticos del cluster."
  type        = number
  default     = 1
}
