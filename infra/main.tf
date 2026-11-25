module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
  azs          = var.azs
}

module "eks" {
  source = "./modules/eks"

  project_name       = var.project_name
  kubernetes_version = var.kubernetes_version
  private_subnet_ids = module.vpc.private_subnet_ids

  node_instance_type = var.node_instance_type
  node_min_size      = var.node_min_size
  node_desired_size  = var.node_desired_size
  node_max_size      = var.node_max_size
}

module "docdb" {
  source = "./modules/docdb"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id

  private_subnet_ids     = module.vpc.private_subnet_ids
  node_security_group_id = module.eks.cluster_security_group_id

  master_username = var.master_username
  master_password = var.master_password
}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name   = var.project_name
  cluster_name   = module.eks.cluster_name
  retention_days = var.log_retention_days
}

module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  github_repo  = var.github_repo
  cluster_name = module.eks.cluster_name

  cluster_oidc_issuer_url = module.eks.oidc_issuer_url
}
