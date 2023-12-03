resource "helm_release" "nginx-int-ingress-controller" {
  name       = "nginx-int"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = "4.6.1"
  namespace  = "nginx-int"
  wait       = false
  create_namespace = true
  values = [
    templatefile("${path.module}/templates/values-nginx.yaml.tpl", {
        internal_lb = true
        ingress-class-name = "nginx-int"
      })
  ]
}