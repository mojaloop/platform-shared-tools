variable "name" {
  description = "name of your infra"
  type = string
}
variable "environment" {
  description = "name for your environment"
  type= string
}
variable "region" {
  description = "AWS region"
  type        = string
}
variable "domain" {
  description = "domain for whole cluster"
  type = string
}
variable "profile" {
  description = "AWS profile name as set in the shared credentials file"
  type        = string
  default     = ""
}

variable "role_arn" {
  description = "The role to be assumed"
  type        = string
  default     = ""
}

variable "terraform_backend_config_file_path" {
  description = "Path to store the terraform backend config"
  type        = string
  default     = "."
}

variable "terraform_backend_config_file_name" {
  description = "Filename for the terraform backend config"
  type        = string
  default     = "backend.hcl"
}

variable "acl" {
  description = "The canned ACL to apply to the S3 bucket"
  type        = string
  default     = "private"
}

variable "read_capacity" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}

variable "force_destroy" {
  description = "force destroy s3 bucket"
  type        = bool
  default     = false
}

variable "mfa_delete" {
  description = "A boolean that indicates that versions of S3 objects can only be deleted with MFA. ( Terraform cannot apply changes of this value; https://github.com/terraform-providers/terraform-provider-aws/issues/629 )"
  type        = bool
  default     = false
}

variable "prevent_unencrypted_uploads" {
  description = "Prevent uploads of unencrypted objects to S3"
  type        = bool
  default     = true
}

variable "enable_server_side_encryption" {
  description = "Enable DynamoDB server-side encryption"
  type        = bool
  default     = true
}

variable "block_public_acls" {
  description = "Whether Amazon S3 should block public ACLs for this bucket"
  type        = bool
  default     = true
}

variable "ignore_public_acls" {
  description = "Whether Amazon S3 should ignore public ACLs for this bucket"
  type        = bool
  default     = true
}

variable "block_public_policy" {
  description = "Whether Amazon S3 should block public bucket policies for this bucket"
  type        = bool
  default     = true
}

variable "restrict_public_buckets" {
  description = "Whether Amazon S3 should restrict public bucket policies for this bucket"
  type        = bool
  default     = true
}

variable "terraform_version" {
  description = "The minimum required terraform version"
  type        = string
  default     = "0.12.2"
}

variable "terraform_state_file" {
  description = "The path to the state file inside the bucket"
  type        = string
  default     = "terraform.tfstate"
}

