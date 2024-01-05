provider: aws
aws:
  credentials:
    accessKey: ${external_dns_iam_access_key}
    secretKey: ${external_dns_iam_secret_key}
  region: ${region}
policy: sync
dryRun: false
interval: 1m
triggerLoopOnEvent: true
txtPrefix: extdns