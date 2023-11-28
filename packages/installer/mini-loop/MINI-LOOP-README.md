# mini-loop - rapid single node install of Mojaloop vNext (beta)

## Description 
mini-loop deployment of vNext (beta) is a simple, scripted/automated installer for Mojaloop vNext. For details on the Mojaloop vNext please refer to the Mojaloop reference architecture available from (http://mojaloop.io). The mini-loop vNext install mode is for  showcasing Mojaloop, development, testing, workshops, integration testing, performance testing, learning, and more. mini-Loop mode is designed to support the adoption and usage of Mojaloop vNext. However, it is crucial to note that mini-loop mode is **not intended for production use.**" 

The goal is to make it realistic, easy, quick, scriptable and cost effective to deploy Mojaloop vNext in a variety of local or cloud environments. 
- realistic: running a full kubernetes stack , so you can do real-world tests
- easy : you only need to run 1 or 2 simple shell scripts
- quick : With a sufficiently configured linux instance and internet connection it should be possible to deploy and configure Mojaloop vNext in approx 10-15 mins or less.
- scriptable: the scripts are easily callable from other scripts or from CI/CD tools
- cost effective : uses minimal resources, everything you need to test Mojaloop vNext and nothing you don't need

Example environments include:-
- an x86_64 or ARM64 laptop or server running ubuntu 22 
- an x86_64 or ARM64 laptop or server running ubuntu 22 as a guest VM (say using virtualbox , prarallels, UTM, qemu or similar) 
- an appropriately sized (see below) x86_64 or ARM64 ubuntu 22 cloud instance running in any of the major cloud vendors 

**BIG TIP** using mini-loop mode Mojaloop vNext will deploy easily and productively into an ARM64 VM instance of the Oracle Cloud Infrastructure (OCI) cloud "always free tier". The ARM64 instances in OCI free-tier offer 4vCPUs and **24GB ram, with no time limit**.
 
# Installation instructions 
Assuming you have an x86_64 or ARM64 environment running Ubuntu release 22 and are logged in as a non-root user (e.g. mluser)
```bash
login as mluser                                                       # login as  a non-root user e.g. mluser
git clone --branch TODO  https://github.com/mojaloop/platform-shared-tools.git    # clone vNext repo 
cd ./platform-shared-tools/packages/installer/mini-loop               # cd to mini-loop dir
sudo ./mini-loop-k8s.sh -m install -k k3s -v 1.28                     # install and configure k3s v1.28
source $HOME/.bashrc                                                  # or logout/log in again to set env
sudo ./ttk-interim-fix.sh                                             # ** do this on ARM64 ONLY ** 
./mini-loop-vNext.sh -m install_ml                                    # configure and deploy vNext 
```

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

## Detailed prerequisites 
- a running x86_64 or ARM64 ubuntu 22 environment (later ubuntu releases are likely fine but so far not tested )
- root user or sudo access (for k3s installation )
- non-root user (with bash shell)
- git installed (usually installed by default on Ubuntu 22) 
- min 4-6GB ram min available  (8GB is ideal )
- min 30GB storage available (50GB plus is preferred)
- broadband internet connection from the ubuntu OS (for downloading helm charts and container images )

## Notes for mini-loop deployment of vNext
- Mojaloop vNext code is developed to be deployable in a robust, highly available and highly secure fashion *BUT* once again the mini-loop deployment focusses on simplicity and hence is not deploying Mojaloop in a highly secure, highly available fashion.  The mini-loop deployment of Mojaloop is *NOT* intended for production purposes rather it enables:
  - trial: users new, expert and in-between to quickly run and access Mojaloop vNext and its various features
  - test : enables the Mojaloop community do realistic testing of Mojaloop across a broad range of settings 
           From DFSPs working on integrating with Mojaloop to the Mojaloop vNext team where mini-loop is being used to enhance the quality of the Mojalop switch.
  - education: a powerful education "on-ramp" especially when used in conjunction with the testing toolkit and the Mojaloop tutorial.
  - demonstrations: an excellent platform for a range of Mojaloop demonstrations. This is due to the cost-effect and light-weight yet realistic (e.g. uses kubernetes) nature of the Mojaloop vNext deployment 
  - simplicity: anyone can read the simple bash scripts and understand how kubernetes is being installed and Mojaloop vNext is being configured and deployed
- the mini-loop scripts output messages to help guide your deployment , please pay attention to these messages
- .log and .err files are written to /tmp by default (but this is configurable) 
- each of the scripts has a -h flag to show parameters and give examples of how to use and customise
- The the scripts are intended to provide a starting point, for further customisation. For instance it should be easy for the user to add extra nodes to the kubernetes cluster or as mentioned above to modify the mojaloop configuration etc.
- mini-loop deployment of Mojaloop vNext has been well tested on  ARM64 on OCI VM and also on Ubuntu 22 OS running in UTM on M1 Mac. Note you DO NOT need to use cpu virtualisation to run Mojaloop vNext on M1 mac.  

## known issues with mini-loop vNext Nov 2023 release 
1. Mojaloop vNext itself as of Nov 2023 is of Beta quality and should be used and regarded as such. The mini-loop deployment scripts for vNext are similarly of Beta quality there are many places where they can and should be tidied, made more robust and simplified. 
2. mini-loop deployment of Mojaloop vNext has only been tested properly with ubuntu 22 later versions should be fine but are yet untested
3. k3s is the only v1.27 and v1.28 kubernetes engine currently tested and known to work with ARM64 and X86_64 on Ubuntu 22 , Microk8s could be made to work but extra configuration work is still needed and has not been undertaken.  
4. The format of the logfiles is a bit of a mess at the moment, it is intended to tidy these up so that mini-loop scripts can be used very (cost) effectively in CI/CD pipelines across multiple configurations of Mojaloop and its environment such as kubernetes releases etc. 
5. the  -d option allows the user to configure the DNS domain name for their Mojaloop services. It is not as currently implemented , though all of the code is done so as to be able to automatically (from the script) edit the ingress.yaml's  prior to deployment. 
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
