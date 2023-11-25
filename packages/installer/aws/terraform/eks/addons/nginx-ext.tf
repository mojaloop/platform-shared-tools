resource "helm_release" "nginx-ext-ingress-controller" {
  name       = "nginx-ext"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = "4.6.1"
  namespace  = "nginx-ext"
  wait       = false
  create_namespace = true
  values = [
    templatefile("${path.module}/templates/values-nginx.yaml.tpl", {
        internal_lb = false
        ingress-class-name = "nginx-ext"
      })
  ]
}