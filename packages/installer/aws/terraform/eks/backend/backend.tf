terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = "~> 3.74"
  }
}
locals {
  prevent_unencrypted_uploads = var.prevent_unencrypted_uploads && var.enable_server_side_encryption ? true : false
  backend_name                = "${var.name}-${var.environment}-vnext"
  terraform_backend_config_file = format(
    "%s/%s",
    var.terraform_backend_config_file_path,
    var.terraform_backend_config_file_name
  )
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket_policy" "ensure_AES256" {
  count      = local.prevent_unencrypted_uploads ? 1 : 0
  depends_on = [aws_s3_bucket_public_access_block.default]
  bucket     = aws_s3_bucket.default.id
  policy     = <<POLICY
{
    "Version": "2012-10-17",
    "Id": "TerraformStateBucketPolicyUploads",
    "Statement": [
    {
      "Sid": "DenyIncorrectEncryptionHeader", 
      "Effect": "Deny",
      "Principal": { "AWS": "*"},
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${local.backend_name}-state/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
    ]
  }
  POLICY
}

resource "aws_s3_bucket_policy" "prevent_unencrypted_uploads" {
  count      = local.prevent_unencrypted_uploads ? 1 : 0
  depends_on = [aws_s3_bucket_public_access_block.default, aws_s3_bucket_policy.ensure_AES256]

  bucket = aws_s3_bucket.default.id
  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Id": "TerraformStateBucketPolicyUploads",
    "Statement": [
    {
      "Sid": "DenyUnEncryptedObjectUploads", 
      "Effect": "Deny",
      "Principal": { "AWS": "*"},
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${local.backend_name}-state/*",
      "Condition": {
        "Null": {
          "s3:x-amz-server-side-encryption": "true"
        }
      }
    }
    ]
  }
  POLICY
}

resource "aws_s3_bucket" "default" {
  bucket = "${local.backend_name}-state"
  //acl           = var.acl
  //region        = var.region
  force_destroy = true
  //policy        = local.policy

  versioning {
    enabled    = true
    mfa_delete = var.mfa_delete
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    
  }
}

resource "aws_s3_bucket_public_access_block" "default" {
  bucket                  = aws_s3_bucket.default.id
  block_public_acls       = var.block_public_acls
  ignore_public_acls      = var.ignore_public_acls
  block_public_policy     = var.block_public_policy
  restrict_public_buckets = var.restrict_public_buckets
}

resource "aws_dynamodb_table" "with_server_side_encryption" {
  count          = var.enable_server_side_encryption ? 1 : 0
  name           = "${local.backend_name}-lock"
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity

  # https://www.terraform.io/docs/backends/types/s3.html#dynamodb_table
  hash_key = "LockID"

  server_side_encryption {
    enabled = true
  }

  lifecycle {
    ignore_changes = [
      read_capacity,
      write_capacity,
    ]
  }

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name   = "${var.name}-encrypted"
  }
}

resource "aws_dynamodb_table" "without_server_side_encryption" {
  count          = var.enable_server_side_encryption ? 0 : 1
  name           = "${local.backend_name}-lock"
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity

  # https://www.terraform.io/docs/backends/types/s3.html#dynamodb_table
  hash_key = "LockID"

  lifecycle {
    ignore_changes = [
      read_capacity,
      write_capacity,
    ]
  }

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name   = "${var.name}-unencrypted"
  }
}

data "template_file" "terraform_backend_config" {
  template = file("${path.module}/templates/backend.hcl.tpl")

  vars = {
    region = var.region
    bucket = aws_s3_bucket.default.id

    dynamodb_table = element(
      coalescelist(
        aws_dynamodb_table.with_server_side_encryption.*.name,
        aws_dynamodb_table.without_server_side_encryption.*.name
      ),
      0
    )

    encrypt  = var.enable_server_side_encryption ? "true" : "false"
    role_arn = var.role_arn
    profile  = var.profile
  }
}

resource "local_file" "terraform_backend_config" {
  count    = var.terraform_backend_config_file_path != "" ? 1 : 0
  content  = data.template_file.terraform_backend_config.rendered
  filename = local.terraform_backend_config_file
}