variable "project_name" {
  description = "Nombre del proyecto usado en tags y nombres de recursos."
  type        = string
}

variable "github_repo" {
  description = "Repositorio GitHub (owner/nombre) autorizado a asumir el rol de despliegue."
  type        = string
  default     = "urielpinag/idc_proyecto"
}

variable "cluster_name" {
  description = "Nombre del cluster EKS donde se concede acceso al rol de despliegue."
  type        = string
}

variable "cluster_oidc_issuer_url" {
  description = "URL del issuer OIDC del cluster EKS (sin https://)."
  type        = string
}
