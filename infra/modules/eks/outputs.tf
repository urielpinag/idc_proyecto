output "cluster_name" {
  description = "Nombre del cluster EKS."
  value       = aws_eks_cluster.this.name
}

output "endpoint" {
  description = "Endpoint del API server del cluster EKS."
  value       = aws_eks_cluster.this.endpoint
}

output "oidc_issuer_url" {
  description = "URL del issuer OIDC del cluster EKS."
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "cluster_role_arn" {
  description = "ARN del rol IAM del plano de control del cluster."
  value       = aws_iam_role.cluster.arn
}

output "node_role_arn" {
  description = "ARN del rol IAM de los nodos."
  value       = aws_iam_role.node.arn
}

output "node_group_name" {
  description = "Nombre del node group gestionado."
  value       = aws_eks_node_group.this.node_group_name
}

output "cluster_security_group_id" {
  description = "ID del security group gestionado por EKS para el plano de control y la comunicación con los nodos."
  value       = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}
