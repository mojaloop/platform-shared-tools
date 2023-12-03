variable "name" {
  description = "name of your infra"
  type        = string
}
variable "environment" {
  description = "name for environment"
  type        = string
}
variable "region" {
  description = "region of aws"
  type        = string
}

variable "enable_dns_hostname" {
  description = "VPC enable DNS hostname"
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access" {
  description = "Cluster Endpoint can access public or not"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "VPC enable DNS support"
  type        = bool
  default     = true
}

variable "availability_zones_count" {
  description = "The number of AZs."
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC. Default value is a valid CIDR, but not acceptable by AWS and should be overridden"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr_bits" {
  description = "The number of subnet bits for the CIDR. For example, specifying a value 8 for this parameter will create a CIDR with a mask of /24."
  type        = number
  default     = 8
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default = {
    "Project"     = "TerraformEKS"
    "Environment" = "Development"
  }
}
variable "k8s_version" {
  description = "K8s version"
  type        = string
  default     = "1.26"
}
variable "node_gp_count" {
  description = "Number of node group"
  type        = number
  default     = 1
}
variable "node_gp_one_min_size" {
  description = "number of minimal instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_one_max_size" {
  description = "number of max instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_one_desire_size" {
  description = "number of desired instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_one_instance_type" {
  description = "Instance type in node group"
  type        = string
  default     = "t2.medium"
}

// node group 2
variable "node_gp_two_min_size" {
  description = "number of minimal instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_two_max_size" {
  description = "number of max instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_two_desire_size" {
  description = "number of desired instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_two_instance_type" {
  description = "Instance type in node group"
  type        = string
  default     = "t2.medium"
}

//node group 3

variable "node_gp_three_min_size" {
  description = "number of minimal instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_three_max_size" {
  description = "number of max instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_three_desire_size" {
  description = "number of desired instance for node group"
  type        = number
  default     = 1
}
variable "node_gp_three_instance_type" {
  description = "Instance type in node group"
  type        = string
  default     = "t2.medium"
}


variable "node_gp_capacity_type" {
  description = "Instance capacity type in node group"
  type        = string
  default     = "ON_DEMAND"
}
variable "disk_size" {
  description = "worker node disk size"
  type        = number
  default     = 20
}
