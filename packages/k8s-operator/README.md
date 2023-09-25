# Mojaloop vNext Kubernetes Operator

TBD


### Project structure:

- src - Source code related to the operator service
- k8s-custom-resources - Custom resource definition, editor role and sample install resource
- k8s-operator-resources - Operator specific resources
- k8s-vnext-install-resources - resources required by the operator to install the services for both cross-cutting and applications


## make sure correct node version is used
Requires nvm installed - https://github.com/nvm-sh/nvm#installing-and-updating

```bash
#in the k8s-operator directory
nvm use
```

## install

```bash
npm install
```

## Build

```bash
npm run build
```

## Prepare Kubernetes resources
Create vnext install custom resources and required operator resources

```bash
# custom resource definition, editor role and workload namespaces
kubectl apply -f k8s-required-resources/mojaloopvnextinstall-crd.yaml
kubectl apply -f k8s-required-resources/mojaloopvnextinstall-editor-role.yaml
kubectl apply -f k8s-required-resources/workload-namespaces.yaml

# operator namespace, service account and binding for service account
kubectl apply -f k8s-operator-resources/operator-namespace.yaml
kubectl apply -f k8s-operator-resources/operator-sa.yaml
kubectl apply -f k8s-operator-resources/operator-clusterrolebinding.yaml
```

# Run the operator controller service

## Run as normal operator inside the cluster
This method will run the operator controller as a container inside the cluster - this is the intended method for normal operation.

```bash
# this will create the deployment and start running the operator
kubectl apply -f k8s-operator-resources/operator-deployment.yaml
```

## Run locally in dev mode
This will load k8s cluster configs from the default kubectl user config, use to test/debug outside the cluster.

**Note:** Make sure the operator is not running inside the container as a container.

Anywhere in the repo structure:
```bash
# anywhere in the repo structure
npm -w packages/k8s-operator run start:dev

# or in the in "packages/k8s-operator" directory
npm run start:dev
```

# Trigger vNext installation / upgrade

### Prepare the configuration

1. Create a copy of the file `k8s-install-samples/mojaloopvnextinstall-sample.yaml`
2. Configure the correct values inside the "spec.configOverride" section of the new file
3. Configure the correct versions for the images in the "spec.services" section of the new file

### Apply the new configuration
```bash
kubectl apply -f k8s-install-samples/mojaloopvnextinstall-sample_copy.yaml
```

This will trigger the reconciliation cycle of the operator and the new/updated settings will be applied-


# Helper commands
```bash
# list the resources:
kubectl get vnext-installs -n mojaloop-vnext

# Describe the resources:
kubectl describe vnext-installs mojaloop-vnext-install-sample -n mojaloop-vnext
```
