locals {
  tags = {
    Project = var.project_name
  }

  # Log groups por ambiente para los logs de la aplicación exportados desde los pods.
  environments = ["dev", "prod"]

  application_log_groups = {
    for env in local.environments :
    env => "/aws/eks/${var.cluster_name}/${env}/application"
  }
}

resource "aws_cloudwatch_log_group" "application" {
  for_each = local.application_log_groups

  name              = each.value
  retention_in_days = var.retention_days

  tags = merge(local.tags, {
    Name        = each.value
    Environment = each.key
  })
}

# Container Insights: log group de aplicación compartido por el cluster EKS.
resource "aws_cloudwatch_log_group" "container_insights" {
  name              = "/aws/containerinsights/${var.cluster_name}/application"
  retention_in_days = var.retention_days

  tags = merge(local.tags, {
    Name = "/aws/containerinsights/${var.cluster_name}/application"
  })
}
