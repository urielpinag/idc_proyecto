variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
}

variable "cluster_name" {
  description = "Nombre del cluster EKS donde corre el controlador."
  type        = string
}

variable "vpc_id" {
  description = "ID de la VPC sobre la que el controlador gestiona ALB/NLB."
  type        = string
}

variable "aws_region" {
  description = "Región de AWS donde se despliega el controlador."
  type        = string
}
