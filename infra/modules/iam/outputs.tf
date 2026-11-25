output "deploy_role_arn" {
  description = "ARN del rol asumible por GitHub Actions vía OIDC."
  value       = aws_iam_role.deploy.arn
}

output "github_oidc_provider_arn" {
  description = "ARN del proveedor OIDC de GitHub Actions."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "eks_oidc_provider_arn" {
  description = "ARN del proveedor OIDC del cluster EKS."
  value       = aws_iam_openid_connect_provider.eks.arn
}
