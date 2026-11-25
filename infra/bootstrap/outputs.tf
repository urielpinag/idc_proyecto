output "state_bucket_name" {
  description = "Nombre del bucket S3 que guarda el estado remoto de Terraform."
  value       = aws_s3_bucket.state.bucket
}

output "lock_table_name" {
  description = "Nombre de la tabla DynamoDB usada para el bloqueo del estado remoto."
  value       = aws_dynamodb_table.locks.name
}

output "aws_region" {
  description = "Región de AWS donde se provisionaron el bucket y la tabla."
  value       = var.aws_region
}
