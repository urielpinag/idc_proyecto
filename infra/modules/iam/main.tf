locals {
  name = var.project_name

  tags = {
    Project = var.project_name
  }

  # Issuer de GitHub Actions y de EKS sin esquema para usarlos en condiciones sub/aud.
  github_issuer = "token.actions.githubusercontent.com"
  eks_issuer    = trimsuffix(trimprefix(var.cluster_oidc_issuer_url, "https://"), "/")
}

# --- Thumbprints raíz de las CA que firman los tokens -------------------------

data "tls_certificate" "github" {
  url = "https://${local.github_issuer}"
}

data "tls_certificate" "eks" {
  url = "https://${local.eks_issuer}"
}

# --- Proveedores OIDC ---------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://${local.github_issuer}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]

  tags = merge(local.tags, {
    Name = "${local.name}-github-oidc"
  })
}

resource "aws_iam_openid_connect_provider" "eks" {
  url             = "https://${local.eks_issuer}"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]

  tags = merge(local.tags, {
    Name = "${local.name}-eks-oidc"
  })
}

# --- Rol de despliegue para GitHub Actions ------------------------------------

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_region" "current" {}

resource "aws_iam_role" "deploy" {
  name = "${local.name}-ci-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.github_issuer}:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "${local.github_issuer}:sub" = [
            "repo:${var.github_repo}:environment:dev",
            "repo:${var.github_repo}:environment:prod",
          ]
        }
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "deploy" {
  name = "${local.name}-ci-deploy"
  role = aws_iam_role.deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "eks:DescribeCluster",
        "eks:ListClusters",
      ]
      Resource = "arn:${data.aws_partition.current.partition}:eks:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cluster/${var.cluster_name}"
    }]
  })
}

# --- Acceso del rol al cluster EKS (kubectl apply) ----------------------------

resource "aws_eks_access_entry" "deploy" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.deploy.arn
  type          = "STANDARD"

  tags = local.tags
}

resource "aws_eks_access_policy_association" "deploy_admin" {
  cluster_name  = var.cluster_name
  principal_arn = aws_iam_role.deploy.arn
  policy_arn    = "arn:${data.aws_partition.current.partition}:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.deploy]
}
