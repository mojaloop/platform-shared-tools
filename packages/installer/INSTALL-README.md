# Installation utilities for Mojaloop vNext Nov 2023 (beta) release 

This directory contains Installation utilities for deploying Mojaloop vNext. 

Currently the installation options are :-

1. **mini-loop installation mode (mini-loop subdirectory):** 
For showcasing, development, testing, workshops, integration testing, performance testing, learning, and more, mini-Loop mode is designed to support the adoption and usage of Mojaloop vNext. However, it is crucial to note that mini-loop mode is **not intended for production use.**

2. **EKS Managed Kubernetes Mode (aws subdirectory)** 
In this mode, simple command-line utilities facilitate the swift deployment of an EKS-managed Kubernetes cluster and the deployment of Mojaloop vNext within it. This mode is designed for those seeking a head start in deploying a more production-ready cluster using Terraform. Although currently in beta quality, leveraging the scripts and the deployed cluster in this mode establishes a foundation for a Hub operator, enabling them to initiate a fully-featured, scalable, and robust deployment of Mojaloop. Additionally, it allows for the initiation of security posture restriction and monitoring across the entire deployment, both inside and outside. The scripts, Terraform, and EKS architecture utilized in this mode are still undergoing testing and refinement and they are of beta quality. 
 
3. **Mojaloop vNext on Raspberry pi-4** This is pre-configured Ubuntu 22.04 image with a running mini-loop type deployment. The idea here is to bring small memory super low cost dev test and lab environments to the Mojaloop environment. 

For instructions on using these tools please see the further readme documents in the corresponding subdirectory of the vNext installer directory. 