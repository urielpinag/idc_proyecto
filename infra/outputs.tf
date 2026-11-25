output "vpc_id" {
  description = "ID de la VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs de las subnets públicas."
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas."
  value       = module.vpc.private_subnet_ids
}

output "nat_gateway_id" {
  description = "ID del NAT Gateway."
  value       = module.vpc.nat_gateway_id
}

output "cluster_name" {
  description = "Nombre del cluster EKS."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint del API server del cluster EKS."
  value       = module.eks.endpoint
}

output "oidc_issuer_url" {
  description = "URL del issuer OIDC del cluster EKS."
  value       = module.eks.oidc_issuer_url
}

output "cluster_role_arn" {
  description = "ARN del rol IAM del plano de control del cluster."
  value       = module.eks.cluster_role_arn
}

output "node_role_arn" {
  description = "ARN del rol IAM de los nodos."
  value       = module.eks.node_role_arn
}

output "node_group_name" {
  description = "Nombre del node group gestionado."
  value       = module.eks.node_group_name
}
