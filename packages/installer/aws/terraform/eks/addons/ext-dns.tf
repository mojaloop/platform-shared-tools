resource "helm_release" "external-dns" {
  name       = "external-dns"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "external-dns"
  version    = var.helm_external_dns_version
  namespace  = var.external_dns_namespace
  timeout    = 300
  create_namespace = true
  values = [
    templatefile("${path.module}/templates/values-external-dns.yaml.tpl", {
        external_dns_iam_access_key = aws_iam_access_key.route53-external-dns.id
        external_dns_iam_secret_key = aws_iam_access_key.route53-external-dns.secret
        region = var.region
      })
  ]
}

resource "aws_iam_user" "route53-external-dns" {
  name = "${var.name}-cluster-external-dns"
  tags = merge({ Name = "${var.name}-cluster-route53-external-dns" })
}
resource "aws_iam_access_key" "route53-external-dns" {
  user = aws_iam_user.route53-external-dns.name
}
# IAM Policy to allow external-dns user to update the given zone and cert-manager to create validation records
resource "aws_iam_user_policy" "route53-external-dns" {
  name = "${var.name}-cluster-external-dns"
  user = aws_iam_user.route53-external-dns.name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [ 
        "route53:GetChange"
      ],
      "Resource": [ 
        "arn:aws:route53:::change/*" 
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets",
        "route53:ListHostedZonesByName"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF
}