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

module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  github_repo  = var.github_repo
  cluster_name = module.eks.cluster_name

  cluster_oidc_issuer_url = module.eks.oidc_issuer_url
}
