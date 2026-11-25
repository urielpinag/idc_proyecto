variable "project_name" {
  description = "Nombre del proyecto usado en tags de recursos."
  type        = string
}

variable "cluster_name" {
  description = "Nombre del cluster EKS usado en los nombres de los log groups."
  type        = string
}

variable "retention_days" {
  description = "Días de retención de los log groups de CloudWatch."
  type        = number
  default     = 30
}
