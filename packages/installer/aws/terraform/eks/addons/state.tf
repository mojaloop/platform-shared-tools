locals {
  backend_name = "${var.name}-${var.environment}-vnext"
  region_name = "${var.region}"
}
terraform {
  backend "s3"{
    key = "addons.tfstate"
    bucket = "${local.backend_name}-state"
  }
}
data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "${local.backend_name}-state"
    key    = "eks.tfstate"
    region = "${local.region_name}"
  }
}