resource "kubernetes_annotations" "disable-default-storageclass" {
  api_version = "storage.k8s.io/v1"
  kind        = "StorageClass"
  force       = "true"

  metadata {
    name = "gp2"
  }
  annotations = {
    "storageclass.kubernetes.io/is-default-class" = "false"
  }
}

resource "helm_release" "longhorn" {
  name       = "longhorn"
  repository = "https://charts.longhorn.io"
  chart      = "longhorn"
  version    = "1.4.2"
  namespace  = "longhorn-system"
  wait       = false
  create_namespace = true
  depends_on = [ kubectl_manifest.longhorn_init ]
  values = [
    "${file("./templates/values-longhorn.yaml")}"
  ]
}

resource "kubectl_manifest" "longhorn_system" {
  depends_on = [  kubernetes_annotations.disable-default-storageclass ]
  yaml_body= <<YAML
apiVersion: v1
kind: Namespace
metadata:
  labels:
    kubernetes.io/metadata.name: longhorn-system
    name: longhorn-system
  name: longhorn-system
spec:
  finalizers:
  - kubernetes
YAML
}
resource "kubectl_manifest" "longhorn_init" {
  depends_on = [ kubectl_manifest.longhorn_system ]
  yaml_body = <<YAML
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: longhorn-amazonlinux-init
  namespace: longhorn-system
  labels:
    app: longhorn-amazonlinux-init
  annotations:
    command: &cmd yum install iscsi-initiator-utils -y && sudo systemctl enable iscsid && sudo systemctl start iscsid
spec:
  selector:
    matchLabels:
      app: longhorn-amazonlinux-init
  template:
    metadata:
      labels:
        app: longhorn-amazonlinux-init
    spec:
      hostNetwork: true
      initContainers:
      - name: init-node
        command:
          - nsenter
          - --mount=/proc/1/ns/mnt
          - --
          - sh
          - -c
          - *cmd
        image: alpine:3.7
        securityContext:
          privileged: true
      hostPID: true
      containers:
      - name: wait
        image: k8s.gcr.io/pause:3.1
      hostPID: true
      hostNetwork: true
      tolerations:
      - effect: NoSchedule
        key: node-role.kubernetes.io/master
  updateStrategy:
    type: RollingUpdate
YAML
}