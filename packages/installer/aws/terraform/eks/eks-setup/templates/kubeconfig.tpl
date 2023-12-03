"apiVersion": "v1"
"clusters":
- "cluster":
    "certificate-authority-data": ${cluster_ca_certificate}
    "server": ${cluster_endpoint}
  "name": ${cluster_name}
"contexts":
- "context":
    "cluster": ${cluster_name}
    "user": ${cluster_name}
  "name": ${cluster_name}
"current-context": ${cluster_name}
"kind": "Config"
"users":
- "name": ${cluster_name}
  "user":
    "token": ${cluster_token}