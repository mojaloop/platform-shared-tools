name= "vnext"
environment = "beta"
region= "eu-west-3"
domain= "mojaloop-vnext.io"
vpc_cidr = "10.0.0.0/16"
enable_dns_hostname = true
enable_dns_support = true
availability_zones_count = 3
subnet_cidr_bits = 8
k8s_version = 1.28

node_gp_one_min_size = 1
node_gp_one_max_size = 2
node_gp_one_desire_size = 1
node_gp_one_instance_type = "t2.large"

node_gp_two_min_size = 1
node_gp_two_max_size = 2
node_gp_two_desire_size = 1
node_gp_two_instance_type = "t2.large"

node_gp_three_min_size = 1
node_gp_three_max_size = 2
node_gp_three_desire_size = 1
node_gp_three_instance_type = "t2.large"

node_gp_capacity_type = "ON_DEMAND"
disk_size = 100

ingress_ext_name = "nginx_ext"
helm_external_dns_version = "6.7.2"