# Mojaloop vNext Kubernetes Operator

TBD


### Project structure:

- Src directory includes everything related to the operator service
- K8s directory includes all yaml's required to deploy the operator itself
- resources reictory include example resources that the operator will listen to


## install

```bash
npm install
```


## Build

```bash
npm run build
```

## Run this service

Anywhere in the repo structure:
```bash
# anywhere in the repo structure
npm -w packages/k8s-operator-custom-resources-operator run service

# in this directory
npm run service
```


# Helper commands
```bash
# list the resources:
kubectl get vnext-installs -n mojaloop-vnext

# Describe the resources of a:
kubectl describe vnext-installs mojaloop-vnext-install-sample -n mojaloop-vnext

# create sample install - edit the sample file and:
kubectl apply -f k8s-custom-resources/mojaloopvnextinstall-sample.yaml


```
