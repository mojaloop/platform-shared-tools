#!/usr/bin/env python3

"""
    This script is a part of the mini-loop project which aims to make installing the Mojaloop.io helm charts really easy
    This script vnext-configure.py modifies a local copy of the mojaloop vNext yaml files and 
    helm chart values files (used in the infra layer)  to support user mini-loop 
    configuration options

    author : Tom Daly 
    Date   : June 2023
"""

import fileinput
import sys
import re
import argparse
from pathlib import Path
from shutil import copyfile 
from fileinput import FileInput
import fileinput 
from ruamel.yaml import YAML

data = None
                
def lookup(sk, d, path=[]):
   # lookup the values for key(s) sk return as list the tuple (path to the value, value)
   if isinstance(d, dict):
       for k, v in d.items():       
           if k == sk:
               yield (path + [k], v)
           for res in lookup(sk, v, path + [k]):
               yield res
   elif isinstance(d, list):
       for item in d:
           for res in lookup(sk, item, path + [item]):
               yield res

"""
update_key: recursively 
"""
def update_key(key, value, dictionary):
    for k, v in dictionary.items():
        if k == key:
            dictionary[key]=value
        elif isinstance(v, dict):
            for result in update_key(key, value, v):
                yield result
        elif isinstance(v, list):
            for d in v:
                if isinstance(d, dict):
                    for result in update_key(key, value, d):
                        yield result
 
def allocate_infra_pods(p,yaml):
    infra_charts_list = [
        'kafka',
        'mongodb'
    ]
    non_infra_charts_list = [
        'redpanda-console',
        'mongo-express',
        'redis',
        'elasticsearch'
    ]

    print("==> updating infra values.yaml to allocate pods to node_class=infra ")
    for vf in p.glob('**/*values.yaml') :
        with open(vf) as f:
            data = yaml.load(f)
            print(f"===> Processing file < {vf.parent}/{vf.name} > ")

        for c in infra_charts_list: 
            print(f"looking for infrastructure chart: {c} ")
            for x, value in lookup(c, data):  
                if isinstance(x, list) and len(x)==1 : 
                    #value.setdefault('nodeSelector', {})['node_class'] = 'infra'
                    value.insert(0, 'nodeSelector', {'node_class': 'infra'})
                    print(f" x is: {x} and isinstance: {type(x)} and value is: {value}\n")
        
        for c in non_infra_charts_list: 
            print(f"looking for non infrastructure chart: {c} ")
            for x, value in lookup(c, data):  
                if isinstance(x, list) and len(x)==1 : 
                    value.insert(0, 'nodeSelector', {'node_class': 'non_infra'})
                    print(f" x is: {x} and isinstance: {type(x)} and value is: {value}\n")
        with open(vf, "w") as f:
            yaml.dump(data,f)

def enable_or_disable_logging(p,yaml,verbose=False,deploy_logging=False):
    deploy_logging_str="not deploy"
    logging_file_list = [ 
        "auditing-svc-deployment",
        "auditing-svc-service",
        "auditing-svc-data-persistentvolumeclaim",
        "logging-svc-data-persistentvolumeclaim",
        "logging-svc-deployment"
    ]
    if deploy_logging:
        deploy_logging_str = "deploy"

    print(f"     <vnext_configure.py>  : modify helm values and yaml files to {deploy_logging_str} logging and auditing functions for vNext ")

    # configure the helm chart values.yaml in the k8s infra-helm directory 
    vf = p / "infra" / "infra-helm" / "values.yaml"
    with open(vf) as f:
        if (verbose): 
            print(f"===> Processing file < {vf.parent}/{vf.name} > ")
        data = yaml.load(f)
        data['global']['kibanaEnabled'] = deploy_logging
        data['elasticsearch']['enabled'] = deploy_logging
    with open(vf, "w") as f:
        yaml.dump(data, f)

    #configure the auditing and logging files in the k8s crosscut directory 
    yf = p / "platform-shared-tools" / "packages" / "deployment" / "k8s" / "crosscut"
    for file in logging_file_list :
        if deploy_logging: 
            file=file + ".off" 
            file= yf / file 
            if file.exists():
                new_name = file.with_suffix(".yaml")
                file.rename(new_name)
                if verbose: 
                    print(f"Renamed {file} to {new_name}")
        else: # turn logging off 
            file=file + ".yaml" 
            file= yf / file 
            if file.exists():
                new_name = file.with_suffix(".off")
                file.rename(new_name)
                if verbose: 
                    print(f"Renamed {file} to {new_name}")


def modify_values_for_dns_domain_name(p,domain_name,verbose=False):
    print(f" --domain_name flag NOT IMPLEMENTED FOR VNEXT YET ")
    return 
    # modify ingress hostname in values file to use DNS name     
    # print(f"      <mojaloop-configure.py> : Modify values to use dns domain name {domain_name}" )
    # for vf in p.glob('**/*values.yaml') :
    #     with FileInput(files=[str(vf)], inplace=True) as f:
    #         for line in f:
    #             line = line.rstrip()
    #             line = re.sub(r"(\s+)hostname: (\S+).local", f"\\1hostname: \\2.{domain_name}", line)
    #             line = re.sub(r"(\s+)host: (\S+).local", f"\\1host: \\2.{domain_name}", line)
    #             line = re.sub(r"testing-toolkit.local", f"testing-toolkit.{domain_name}", line)
    #             print(line)


def parse_args(args=sys.argv[1:]):
    parser = argparse.ArgumentParser(description='Automate modifications across mojaloop helm charts')
    parser.add_argument("-d", "--directory", required=True, help="directory for helm charts")
    parser.add_argument("-v", "--verbose", required=False, action="store_true", help="print more verbose messages ")
    parser.add_argument("-l", "--logging", required=False, action="store_true", help="enable logging and auditing  ")
    parser.add_argument("--domain_name", type=str, required=False, default=None, help="e.g. mydomain.com   ")
    parser.add_argument("--allocate", required=False, action="store_true", help="update yaml to allocate infra pods to infra nodes ")

    args = parser.parse_args(args)
    if len(sys.argv[1:])==0:
        parser.print_help()
        parser.exit()
    return args

##################################################
# main
##################################################
def main(argv) :
    args=parse_args()
    script_path = Path( __file__ ).absolute()
    p = Path() / args.directory
    if args.verbose :
        print(f"     <vnext_configure.py>  : start ")
        print(f"     <vnext_configure.py>  : Processing helm charts in directory: [{args.directory}]")

    yaml = YAML()
    yaml.allow_duplicate_keys = True
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=6, offset=2)
    yaml.width = 4096

    if args.allocate:
        print(f" allocate pods to infra node_class nodes -- assumes node pool exists for now ")
        allocate_infra_pods(p,yaml)
    if args.domain_name :
         modify_values_for_dns_domain_name(p,args.domain_name,args.verbose)
    if args.logging :
        enable_or_disable_logging(p,yaml,args.verbose,deploy_logging=True)
    else: 
        enable_or_disable_logging(p,yaml,args.verbose,deploy_logging=False)
    if args.verbose :
        print(f"     <vnext_configure.py>  : end ")

if __name__ == "__main__":
    main(sys.argv[1:])
