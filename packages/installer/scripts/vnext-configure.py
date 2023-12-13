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


def modify_yaml_for_dns_domain_name(p,domain_name,do_tls=False,verbose=False):
    if verbose: 
        print(f" --domain_name {domain_name}")
        print(f" --tls {do_tls}")
    prev_line_is_tls = False 

    # modify ingress hostname in values file to use DNS name     
    print(f"      <mojaloop-configure.py> : Modify values to use dns domain name {domain_name}" )
    # for vf in p.glob('**/*values.yaml') :
    # first the ingress.yaml files 
    for vf in p.glob('**/*yaml') :
        print(f"file is {vf}")
        with FileInput(files=[str(vf)], inplace=True) as f:
            for line in f:
                # changes for the *ingress.yaml files and the helm values.yaml  
                line = line.rstrip()

                # dns changes 
                line = re.sub(r"#external-dns.alpha.kubernetes.io/hostname:(\s+)(\w+).*$", f"external-dns.alpha.kubernetes.io/hostname:\\1\\2.{domain_name}", line)
                line = re.sub(r"(\s+)- host: (\w+).local", f"\\1- host: \\2.{domain_name}", line)
                
                # substitutions for dns in helm values.yaml 
                line = re.sub(r"(\s+)hostname: (\S+).local", f"\\1hostname: \\2.{domain_name}", line)   # dns 
                line = re.sub(r"#annotations.*$", "annotations", line)                                  # dns and tls 

                # tls_specific substitutions 
                if do_tls: 
                    line = re.sub(r"#cert-manager.io/issuer:", "cert-manager.io/issuer:", line)
                    line = re.sub(r"#tls:", "tls:", line)
                    line = re.sub(r"#(\s+)- hosts:", "  - hosts:", line)
                    line = re.sub(r"#(\s+)- (\S+).local", f"      - \\2.{domain_name}", line)
                    line = re.sub(r"#(\s+)secretName: quickstart-example-tls", "    secretName: quickstart-example-tls", line)

                    if prev_line_is_tls:    
                        prev_line_is_tls = False
                        line = re.sub(r"enabled: false", "enabled: true", line) 
                    if  "tls:" in line : 
                        prev_line_is_tls = True

                    # substitutions for tls in values.yaml 
                    line = re.sub(r"#(\s+)- secretName: quickstart-example-tls.*$", "\\1- secretName: quickstart-example-tls", line)
                    line = re.sub(r"#(\s+)hosts:.*$", "\\1hosts:", line)
                    line = re.sub(r"#(\s+)-(\w+).local.*$", f"\\1- \\2.{domain_name}", line)


 

                print(line)


def parse_args(args=sys.argv[1:]):
    parser = argparse.ArgumentParser(description='Automate modifications across mojaloop helm charts')
    parser.add_argument("-d", "--directory", required=True, help="directory for helm charts")
    parser.add_argument("-v", "--verbose", required=False, action="store_true", help="print more verbose messages ")
    parser.add_argument("-t", "--tls", required=False, action="store_true", help="configure yaml files for TLS ")
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
            modify_yaml_for_dns_domain_name(p,args.domain_name,args.tls,args.verbose)
    if args.verbose :
        print(f"     <vnext_configure.py>  : end ")

if __name__ == "__main__":
    main(sys.argv[1:])
