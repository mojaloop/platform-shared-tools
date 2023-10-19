module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.1"

  name = var.vpc_name
  cidr = "10.0.0.0/16"

  azs = var.availability_zone_names
  private_subnets = ["10.0.0.0/19", "10.0.32.0/19"]
  public_subnets  = ["10.0.64.0/19", "10.0.96.0/19"]

  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = 1
    # TODO : take out the mojaloop cost_center tags 
    "mojaloop/cost_center" = "vnext"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = 1
    # TODO : take out the mojaloop cost_center tags 
    "mojaloop/cost_center" = "vnext"
  }
  
  tags = var.cluster_tags

}
