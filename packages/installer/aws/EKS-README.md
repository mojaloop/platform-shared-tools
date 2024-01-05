# EKS - AWS managed kubernetes installation of Mojaloop vNext (beta)

## Description 
This section contains tooling to make it easy and quick to create an EKS (AWS managed kubernetes) cluster and then to deploy Mojaloop vNext (beta) into that cluster. This tooling is designed to give Mojaloop deployers and operators a head-start on a scalable , secure cost efficient in-cloud deployment of Mojaloop vNext. 

## Status (Nov 2023) 
It is important to note that these tools like Mojaloop vNext itself are of beta status , which means that there is much that has been done in design and deployment to enable scalability, low cost of ownership and security BUT there is still signifciant amount left to do. 

# purpose and use 
The EKS installation of Mojaloop vNext is designed to enable:-
-  Mojaloop deployers and HUB operators to easily and quickly deploy Mojaloop vNext for production use. Now again it is not there yet as it is only beta.
- Enable Mojaloop deployers and operators to quickly spin up and down multiple environments such as dev/test , pre-prod etc 
- Provide an easily accesible starting point from which Mojaloop deployers and Hub operators can further customise the cluster and vNext deployment    

# pre-requisites / starting point 
- use must have an AWS account and AWS credentials with mfa enabled (typically from authenticator on a smartphone)
- from the deployment machine the deploying user needs to have ~/home/.aws/credentials file setup
- docker installed 
- git installed 
- bash shell available 
- assuming some sort of Unix or Linux as the client machine as the idea of $HOME/.aws/credentials on the host machine must make sense.  (Has been tested on Ubuntu, MacOS and other Linux) 

# overview 
![alt text](../images/eks-deploy-pic.jpg)


# Install instructions 
```bash
login as non root user e.g.  mluser                                    # login as  a non-root user e.g. mluser
git clone --branch TODO  https://github.com/mojaloop/platform-shared-tools.git    # clone vNext repo 
edit ./packages/installer/aws/terraform/env.hcl                       # adjust the settings for your cluster 
cd ./platform-shared-tools/packages/installer/aws/docker              # move to Dockerfile directory 
./build.sh                                                            # build the dockerfile 
./run-aws-container.sh -p myprofile                                   # execute dockerfile with aws profile 
aws-mfa                                                               # authenticate to AWS 
eks-cluster.sh --apply                                                # apply terraform build/config the cluster
eks-vnext.sh -m install_ml                                            # configure and deploy vNext 
kubectl get all -A                                                    # list all deployed components
```

# To clean up and remove Mojaloop vNext and EKS cluster
```bash
login as same non root user e.g.  mluser                              # login as  a non-root 
./run-aws-container.sh -p myprofile                                   # execute dockerfile with aws profile 
aws-mfa                                                               # authenticate to AWS 
eks-vnext.sh -m delete_ml                                             # undeploy/delete vNext app 
eks-cluster.sh --destroy                                              # terraform destory of the cluster
```


# Customising the installation 
modifying the 

# running the TTK 

# desription of the resources 

# Technical details 

# Terraform details 
the terraform is from Thitsaworks (see )

# what needs to be done for security 

# what needs to be done for scalability 

# what needs to be done for operations
kubernetes operator for vNext


# Accessing Mojaloop from a laptop 
The mini-loop scripts add the required host names to the 127.0.0.1 entry in the /etc/hosts of the "install system" i.e. the system where Mojaloop is deployed.  To access Mojaloop from beyond this system it is necessary to:- 
1. ensure that http / port 80 is accessible on the install system.  For instance if mini-loop has installed Mojaloop onto a VM in the cloud then it will be necessary to ensure that the cloud network security rules allow inbound traffic on port 80 to that VM.
2. add the hosts listed below to an entry for the external/public ip address of that install system in the /etc/hosts file of the laptop you are using. 

 For example if Mojaloop vNext is installed on a cloud VM with a public IP of 192.168.56.100  Then add an entry to your laptop's /etc/hosts similar to ...
```
192.168.56.100  vnextadmin.local elasticsearch.local kibana.local mongoexpress.local kafkaconsole.local fspiop.local bluebank.local greenbank.local
```
You should now be able to browse or curl to Mojaloop vNext admin url using  http://vnextadmin you can also access the deloyed instances of the Mojaloop testing toolkit at http://bluebank.local and http://greenbank.local or access the mongo and kafka consoles.

Note: see [below](#modify-hosts-file-on-windows-10) for intructions on updating the hosts file on your windows 10 laptop 


## Notes for EKS deployment of vNext
- list of notes here 

## known issues with EKS deployment of vNext (beta)   
6. the endpoint testing is not implemented yet and so it is possible for the install to "look ok" but to not function correctly. Normally if you get messages from the scripts that indicate everyting was ok, then it probably is , but testing endpoints and other checks before giving the all-good messages needs improving. In particular look for "warnings" that the pods haven't all started in their alloted time this is a good indication something is wrong.  Also kubectl get pods -A will show if all pods are in "running" state or not.

## modify hosts file on windows 10
1. open Notepad
2. Right click on Notepad and then Run as Administrator.
3. allow this app to make changes to your device? type Yes.
4. In Notepad, choose File then Open C:\Windows\System32\drivers\etc\hosts or click the address bar at the top and paste in the path and choose Enter.  If you don’t see the host file in the /etc directory then select All files from the File name: drop-down list, then click on the hosts file.
5. Add the IP from your VM or system and then add a host from the list of required hosts (see example below)
6. flush your DNS cache. Click the Windows button and search command prompt, in the command prompt:-
```
    ipconfig /flushdns
```

Note you can only have one host per line so on windows 10 your hosts file should look something like: 
```
192.168.56.100 vnextadmin.local 
192.168.56.100 elasticsearch.local 
192.168.56.100 kibana.local 
192.168.56.100 mongoexpress.local 
192.168.56.100 kafkaconsole.local 
192.168.56.100 fspiop.local 
192.168.56.100 bluebank.local 
192.168.56.100 greenbank.local 
```

## FAQ
1. Q: I think it installed ok , how to I test ?  
A: see the section on accessing Mojaloop from a laptop and try accessing the http://vnextadmin.local or the URL for the domain-name you installed with. 

2. Q: what about windows ?
A: The best way to run on a windows laptop is to provision an Ubuntu 22 virtual machine using one of the popular Hypervisors available today (HyperV, VirtualBox, UTM etc) 

3. Q: why are you not using help charts for deployent 
A: We have chosen to use helm charts for the infrastructure layer , kafka , mongo etc but we were seeking to keep the deployment as simple as possible and accessible as possible for deployers, operators and even those who just want to try Mojaloop or even students and others that want to use Mojaloop as an exmple of a well comprised modern web application. To this end there is not an immediate benefit to packaging as helm and further the final target for deployment for the application is as a Kubernetes Operator.  Indeed the kubernetes Operator for vNext has been outlined by the vNext team and BizHub (an Australian web company) have been advancing the operator in parallel to the work you see in this installer directory.


