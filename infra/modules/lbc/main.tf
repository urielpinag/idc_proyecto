locals {
  name = var.project_name

  tags = {
    Project = var.project_name
  }
}

data "aws_partition" "current" {}

# Rol del AWS Load Balancer Controller, asumible por el agente de Pod Identity.
resource "aws_iam_role" "this" {
  name = "${local.name}-lbc-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "pods.eks.amazonaws.com"
        }
        Action = [
          "sts:AssumeRole",
          "sts:TagSession",
        ]
      },
    ]
  })

  tags = local.tags
}

resource "aws_iam_policy" "this" {
  name        = "${local.name}-lbc-policy"
  description = "Permisos del AWS Load Balancer Controller (policy oficial v3.7.0)."
  policy      = file("${path.module}/iam_policy.json")

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "this" {
  role       = aws_iam_role.this.name
  policy_arn = aws_iam_policy.this.arn
}

resource "aws_eks_pod_identity_association" "this" {
  cluster_name    = var.cluster_name
  namespace       = "kube-system"
  service_account = "aws-load-balancer-controller"
  role_arn        = aws_iam_role.this.arn

  tags = local.tags
}
