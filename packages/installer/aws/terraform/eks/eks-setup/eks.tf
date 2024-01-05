module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.20.0"

  cluster_name                   = "${var.name}-${var.environment}-cluster"
  cluster_version                = var.k8s_version
  cluster_endpoint_public_access = true
  create_cloudwatch_log_group = false
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent    = true
      before_compute = true
      configuration_values = jsonencode({
        env = {
          # Reference docs https://docs.aws.amazon.com/eks/latest/userguide/cni-increase-ip-addresses.html
          ENABLE_PREFIX_DELEGATION = "true"
          WARM_PREFIX_TARGET       = "1"
        }
      })
    }
  }

  vpc_id                   = aws_vpc.eks.id
  subnet_ids               = aws_subnet.private[*].id
  control_plane_subnet_ids = flatten([aws_subnet.public[*].id, aws_subnet.private[*].id])

  #EKS Managed Node Group(s)
  eks_managed_node_group_defaults = {
    instance_types       = ["t2.medium", "t2.large"]
    bootstrap_extra_args = "--container-runtime containerd --kubelet-extra-args '--max-pods=110'"
    disk_size = var.disk_size
  }

  eks_managed_node_groups = {
    "${var.name}-${var.environment}-ng-1" = {
      min_size       = var.node_gp_one_min_size
      max_size       = var.node_gp_one_max_size
      desired_size   = var.node_gp_one_desire_size
      instance_types = ["${var.node_gp_one_instance_type}"]
      capacity_type  = var.node_gp_capacity_type
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = var.disk_size
            volume_type           = "gp3"
            iops                  = 3000
            throughput            = 150
            encrypted             = true
            delete_on_termination = true
          }
        }
      }
    },
    "${var.name}-${var.environment}-ng-2" = {
      min_size       = var.node_gp_two_min_size
      max_size       = var.node_gp_two_max_size
      desired_size   = var.node_gp_two_desire_size
      instance_types = ["${var.node_gp_two_instance_type}"]
      capacity_type  = var.node_gp_capacity_type
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = var.disk_size
            volume_type           = "gp3"
            iops                  = 3000
            throughput            = 150
            encrypted             = true
            delete_on_termination = true
          }
        }
      }
    },
    "${var.name}-${var.environment}-ng-3" = {
      min_size       = var.node_gp_three_min_size
      max_size       = var.node_gp_three_max_size
      desired_size   = var.node_gp_three_desire_size
      instance_types = ["${var.node_gp_three_instance_type}"]
      capacity_type  = var.node_gp_capacity_type
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = var.disk_size
            volume_type           = "gp3"
            iops                  = 3000
            throughput            = 150
            encrypted             = true
            delete_on_termination = true
          }
        }
      }
    }
  }

  tags = {
    Environment = "${var.environment}"
    Terraform   = "true"
  }
}

data "aws_eks_cluster_auth" "cluster" {
  depends_on = [module.eks]
  name       = module.eks.cluster_name
}

locals {
  depends_on = [data.aws_eks_cluster_auth.cluster]
  kubeconfig = templatefile("templates/kubeconfig.tpl", {
    cluster_name           = module.eks.cluster_name
    cluster_endpoint       = module.eks.cluster_endpoint
    cluster_ca_certificate = module.eks.cluster_certificate_authority_data
    cluster_token          = data.aws_eks_cluster_auth.cluster.token
  })
}

resource "local_file" "kubeconfig" {
  content  = local.kubeconfig
  filename = "../kubeconfig"
}