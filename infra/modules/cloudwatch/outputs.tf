output "application_log_group_names" {
  description = "Nombres de los log groups de aplicación por ambiente."
  value       = { for env, lg in aws_cloudwatch_log_group.application : env => lg.name }
}

output "application_log_group_arns" {
  description = "ARNs de los log groups de aplicación por ambiente."
  value       = { for env, lg in aws_cloudwatch_log_group.application : env => lg.arn }
}

output "container_insights_log_group_name" {
  description = "Nombre del log group de Container Insights del cluster."
  value       = aws_cloudwatch_log_group.container_insights.name
}

output "container_insights_log_group_arn" {
  description = "ARN del log group de Container Insights del cluster."
  value       = aws_cloudwatch_log_group.container_insights.arn
}
