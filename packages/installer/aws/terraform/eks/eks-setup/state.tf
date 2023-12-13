locals {
  backend_name = "${var.name}-${var.environment}-vnext"
}
terraform {
  backend "s3" {
    key    = "eks.tfstate"
    bucket = "${local.backend_name}-state"
  }
}

resource "aws_s3_object" "kubeconfig" {
  depends_on             = [local_file.kubeconfig]
  bucket                 = "${local.backend_name}-state"
  key                    = "kubeconfig"
  acl                    = "private" # or can be "public-read"
  source                 = "../kubeconfig"
  server_side_encryption = "AES256"
}