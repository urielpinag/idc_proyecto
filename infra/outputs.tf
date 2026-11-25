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
