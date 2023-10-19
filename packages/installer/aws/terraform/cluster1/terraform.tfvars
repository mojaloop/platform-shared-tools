region = "eu-west-3"
cluster_name = "vnext-cluster1a"
vpc_name = "cluster1a-vpc"
k8s_version = "1.27"
availability_zone_names = [ "eu-west-3a" , "eu-west-3c"]
cluster_tags = { 
    Environment = "vnext_dev", 
    "mojaloop/cost_center" = "vnext",
}