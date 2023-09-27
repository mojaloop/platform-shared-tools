#!/usr/bin/env python3

"""

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

def insert_imagepull_always(p,yaml):
    for vf in p.glob('*.yaml') :
        with open(vf) as f:
            data = yaml.load(f)
            print(f"===> Processing file < {vf.parent}/{vf.name} > ")

        # Check if the file contains a Deployment resource
        if 'kind' in data and data['kind'] == 'Deployment':
            # Modify the imagePullPolicy to "Always" if it's missing
            containers = data['spec']['template']['spec']['containers']
            for container in containers:
                if 'imagePullPolicy' not in container:
                    container['imagePullPolicy'] = 'Always'

            # Write the updated YAML back to the file
            with open(vf, "w") as f:
                yaml.dump(data,f)
            # with file_path.open('w') as updated_yaml_file:
            #     yaml.dump(data, updated_yaml_file)

            print(f"Updated < {vf.parent}/{vf.name} > with imagePullPolicy: 'Always'")


##################################################
# main
##################################################
def main(argv) :
    script_path = Path( __file__ ).absolute()
    p = Path("/tmp/ytest") 
    yaml = YAML()
    yaml.allow_duplicate_keys = True
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=6, offset=2)
    yaml.width = 4096

    insert_imagepull_always(p,yaml)


if __name__ == "__main__":
    main(sys.argv[1:])
