locals {
  name = var.project_name

  tags = {
    Project = var.project_name
  }
}

resource "aws_docdb_subnet_group" "this" {
  name       = "${local.name}-docdb"
  subnet_ids = var.private_subnet_ids

  tags = local.tags
}

resource "aws_security_group" "this" {
  name        = "${local.name}-docdb"
  description = "Acceso a DocumentDB solo desde los nodos EKS"
  vpc_id      = var.vpc_id

  tags = merge(local.tags, { Name = "${local.name}-docdb" })
}

resource "aws_vpc_security_group_ingress_rule" "from_nodes" {
  security_group_id            = aws_security_group.this.id
  description                  = "MongoDB desde los nodos EKS"
  from_port                    = 27017
  to_port                      = 27017
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.node_security_group_id

  tags = local.tags
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  description       = "Salida completa: DocumentDB necesita respuestas y replica interna"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"

  tags = local.tags
}

resource "aws_docdb_cluster" "this" {
  cluster_identifier          = "${local.name}-docdb"
  engine                      = "docdb"
  engine_version              = "5.0.0"
  allow_major_version_upgrade = true
  master_username             = var.master_username
  master_password             = var.master_password
  db_subnet_group_name        = aws_docdb_subnet_group.this.name
  vpc_security_group_ids      = [aws_security_group.this.id]
  backup_retention_period     = var.backup_retention_period
  skip_final_snapshot         = true
  deletion_protection         = false
  apply_immediately           = true

  tags = local.tags
}

resource "aws_docdb_cluster_instance" "this" {
  identifier         = "${local.name}-docdb-1"
  cluster_identifier = aws_docdb_cluster.this.id
  instance_class     = var.instance_class

  tags = local.tags
}
