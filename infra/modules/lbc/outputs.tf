output "role_arn" {
  description = "ARN del rol IAM del controlador, asumido vía Pod Identity."
  value       = aws_iam_role.this.arn
}

output "policy_arn" {
  description = "ARN de la policy IAM adjunta al rol del controlador."
  value       = aws_iam_policy.this.arn
}
