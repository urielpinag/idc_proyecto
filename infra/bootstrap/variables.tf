variable "aws_region" {
  description = "Región de AWS donde se alojan el bucket de estado y la tabla de locks de Terraform."
  type        = string
  default     = "us-east-1"
}
