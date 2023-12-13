
resource "helm_release" "argocd" {
  name       = "argo-cd"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "argo-cd"
  version    = "4.7.2"
  namespace  = "argocd"
  wait       = false
  create_namespace = true
  depends_on = [ helm_release.longhorn, helm_release.nginx-ext-ingress-controller ]
  values     = [templatefile("templates/values-argocd.yaml.tpl", {
    ingress_ext_name = "nginx-ext"
    host = "argocd.${var.environment}.${var.name}.${var.domain}"
  })
  ]
}