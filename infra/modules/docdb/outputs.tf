output "cluster_id" {
  description = "Identificador del cluster DocumentDB."
  value       = aws_docdb_cluster.this.id
}

output "endpoint" {
  description = "Endpoint de conexión del cluster DocumentDB."
  value       = aws_docdb_cluster.this.endpoint
}

output "port" {
  description = "Puerto de conexión del cluster DocumentDB."
  value       = aws_docdb_cluster.this.port
}

output "security_group_id" {
  description = "ID del security group que controla el acceso a DocumentDB."
  value       = aws_security_group.this.id
}
