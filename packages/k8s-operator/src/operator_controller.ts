/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 --------------
 ******/

"use strict";
import * as yaml from "js-yaml";
import { join } from "node:path";
import * as fs from "fs";
import * as k8s from "@kubernetes/client-node";
import {
    MojaloopVNextInstall, MojaloopVNextInstallConfigOverride,
    MojaloopVNextInstallServiceDefinition,
    NAMESPACE,
    RESOURCE_GROUP,
    RESOURCE_KIND,
    RESOURCE_PLURAL,
    RESOURCE_VERSION
} from "./types";



const SCHEDULE_RECONCILE_TIMEOUT_MS = 250;

export class MojaloopVNextInstallOperatorController {
    private readonly _kc: k8s.KubeConfig;
    private _reconcileScheduled = false;
    private _k8sApi: k8s.AppsV1Api;
    private _k8sApiMC: k8s.CustomObjectsApi;
    private _k8sApiPods: k8s.CoreV1Api;
    private _k8sWatch: k8s.Watch;
    //private _watchRequestPromise:Promise<any>;

    constructor(useDefaultConfig = false) {
        this._kc = new k8s.KubeConfig();

        if (useDefaultConfig) {
            // load from provided default kubectl user config, use to test/debug outside the cluster
            this._kc.loadFromDefault();
        } else {
            // try to load from the cluster in which it is running - default for production
            this._kc.loadFromCluster();
        }

        // Creates the different clients for the different parts of the API.
        this._k8sApi = this._kc.makeApiClient(k8s.AppsV1Api);
        this._k8sApiMC = this._kc.makeApiClient(k8s.CustomObjectsApi);
        this._k8sApiPods = this._kc.makeApiClient(k8s.CoreV1Api);

        // This is to listen for events or notifications and act accordingly
        // after all it is the core part of a controller or operator to
        // watch or observe, compare and reconcile
        this._k8sWatch = new k8s.Watch(this._kc);
    }

    public async init():Promise<void>{
        // TODO: check if required "mojaloop-vnext-apps" & "mojaloop-vnext-cross-cutting" namespaces exist, if not create them

        // start install custom resource watch
        await this._watchInstallResource();
    }

    public async destroy():Promise<void>{
        // TODO do tasks to stop the operator
        //this._watchRequestPromise.();
    }

    private _log(message: string|any) {
        console.log(`${new Date().toLocaleString()}: ${message}`);
    }

    private async _watchInstallResource(): Promise<any> {
        //watch my custom resource
        const url = `/apis/${RESOURCE_GROUP}/${RESOURCE_VERSION}/namespaces/${NAMESPACE}/${RESOURCE_PLURAL}`;
        await this._k8sWatch.watch(
            url,
            {},
            this._installResourceOnEvent.bind(this),
            this._installResourceOnDone.bind(this),
        );
        this._log("Watching custom resource started");
    }

    // Helpers to continue watching after an event
    private async _installResourceOnDone(err: any) {
        if(err){
            // delay restart if error, to avoid DDOS'ing
            this._log(`Connection closed with err: ${err}`);
            setTimeout(this._watchInstallResource.bind(this), 1000);
            return;
        }

        this._log("Connection closed");
        await this._watchInstallResource();
    }

    private async _installResourceOnEvent(phase: string, apiObj: any) {
        if(!phase || !apiObj){
            this._log("Received invalid event.");
            return;
        }

        // check kind
        if(apiObj.kind !== RESOURCE_KIND) return;

        this._log("\n");
        this._log(`Received custom resource event in phase ${phase}.`);
        try {
            if (phase === "ADDED" || phase === "MODIFIED") {
                await this._scheduleReconcile(apiObj);
            } else if (phase == "DELETED") {
                await this._deleteResource(apiObj);
            } else {
                this._log(`Unknown event type: ${phase}`);
            }
        } catch (err) {
            this._log(err);
        }
    }


    private async _scheduleReconcile(obj: MojaloopVNextInstall) {
        if (this._reconcileScheduled) return;

        setTimeout(this._reconcileNow.bind(this), SCHEDULE_RECONCILE_TIMEOUT_MS, obj);
        this._reconcileScheduled = true;
    }

    private async _reconcileNow(installObj: MojaloopVNextInstall) {
        const services: MojaloopVNextInstallServiceDefinition[] = installObj.spec?.services || [];
        let deploymentChanged = false;

        try{
            for(const svc of services) {
                this._log(`\tChecking service: ${svc.svcName} from ${svc.bcName} and ${svc.layer} layer...`);
                let deployment: k8s.V1Deployment | null = null;

                // Check if the deployment exists
                try {
                    const response = await this._k8sApi.readNamespacedDeployment(svc.svcName, NAMESPACE);
                    deployment = response.body;
                } catch (err: any) {
                    if (err.statusCode == 404) {
                        this._log("\t\tDeployment not found...");
                    } else {
                        // rethrow so the main catch can handle it
                        throw err;
                    }
                }

                // Create the deployment if it doesn't exist
                if (!deployment) {
                    await this._createDeploymentAndService(svc, installObj);
                    deploymentChanged = true;
                    continue;
                }

                // check if we need to redeploy / update deployment
                deploymentChanged = await this._checkAndUpdateDeployment(deployment, svc, installObj);
            }
        }catch(err:any){
            this._log("An unexpected error occurred:");
            this._log(err);
            this._reconcileScheduled = false;
            return;
        }

        // if nothing changed, don't bother updating the status (it's going to trigger an infinite loop otherwise)
        if(!deploymentChanged) {
            this._reconcileScheduled = false;
            return;
        }


        // TODO: this should be updated with a different watch, maybe a deployment watch with the `deployment=${installObj.metadata.name}` selector (move to separate function )
        // TODO: status object should have deployments instead of pods (or both + services, etc)

        //set the status of our resource to the list of pod names.
        const podNames =  await this._getPodList(`deployment=${installObj.metadata.name}`);

        const status: MojaloopVNextInstall = {
            apiVersion: installObj.apiVersion,
            kind: installObj.kind,
            metadata: {
                name: installObj.metadata.name!,
                resourceVersion: installObj.metadata.resourceVersion
            },
            status: {
                pods: podNames,
                lastChangedBy: "test_code_"+Date.now()
            },
        };
        try {
            await this._k8sApiMC.replaceNamespacedCustomObjectStatus(
                RESOURCE_GROUP,
                RESOURCE_VERSION,
                NAMESPACE,
                RESOURCE_PLURAL,
                installObj.metadata.name!,
                status,
            );
        } catch (err) {
            this._log(err);
        }

        this._reconcileScheduled = false;
    }

    private async _createDeploymentAndService(serviceDefinition: MojaloopVNextInstallServiceDefinition, obj: MojaloopVNextInstall):Promise<void>{
        this._log(`\t - Trying to create deployment '${serviceDefinition.svcName}'...`);

        try {
            //TODO change the k8s-vnext-install-resources resource files to include all related
            // resources for a single service and in here, open the file and checking if it includes
            // multiple resource definitions (deployment, service or ingress)

            // TODO create deployment from cross-cutting and apps layers

            // Read deployment file and create deploy it
            const deploymentFilepath = join(`../k8s-vnext-install-resources/${serviceDefinition.svcName}-deployment.yaml`);
            if(!fs.existsSync(deploymentFilepath)){
                throw new Error(`Could not find deployment file for: ${serviceDefinition.svcName} in ${deploymentFilepath}`);
            }
            const deploymentTemplateStr = fs.readFileSync(deploymentFilepath, "utf-8");
            const deploymentTemplate:any = yaml.load(deploymentTemplateStr);
            const newDeployment:k8s.V1Deployment = deploymentTemplate;

            newDeployment.metadata!.name = serviceDefinition.svcName;
            newDeployment.spec!.replicas = serviceDefinition.size;

            newDeployment.spec!.template!.metadata!.labels!["deployment"] = obj.metadata.name!;

            newDeployment.spec!.selector!.matchLabels!["mojaloop.service"] = serviceDefinition.svcName;

            newDeployment.spec!.template!.metadata!.labels!["mojaloop.layer"] = serviceDefinition.layer;
            newDeployment.spec!.template!.metadata!.labels!["mojaloop.service"] = serviceDefinition.svcName;

            // TODO add other relevant labels

            await this._k8sApi.createNamespacedDeployment(NAMESPACE, newDeployment);

            // Read service file and deploy it
            const serviceFilepath = join(`../k8s-vnext-install-resources/${serviceDefinition.svcName}-service.yaml`);
            if(fs.existsSync(serviceFilepath)) {
                const serviceTemplateStr = fs.readFileSync(serviceFilepath, "utf-8");
                const serviceTemplate:any = yaml.load(serviceTemplateStr);
                const newService:k8s.V1Service = serviceTemplate;

                newService.metadata!.labels!["mojaloop.layer"] = serviceDefinition.layer;
                newService.metadata!.labels!["mojaloop.service"] = serviceDefinition.svcName;

                await this._k8sApiPods.createNamespacedService(NAMESPACE, newService);
            }else{
                this._log(`Could not find service file for: ${serviceDefinition.svcName} in ${serviceFilepath}, assuming not needed`);
            }
        } catch (err: any) {
            this._log(err);
            throw err;
        }
    }

    /**
     * Will check if a specific service deployment needs updating, if so do the update with replaceNamespacedDeployment()
     * (This will throw, no handling done here)
     * @param deployment Existing deployment
     * @param svcDefinition Definition of the service to compare against
     * @param obj MojaloopVNextInstall install instance
     * @return boolean If the deployment was updated
     * @private
     */
    private async _checkAndUpdateDeployment(deployment: k8s.V1Deployment, svcDefinition: MojaloopVNextInstallServiceDefinition, obj: MojaloopVNextInstall):Promise<boolean>{
        let reDeploymentRequired = false;
        const currReplicas = deployment.spec!.replicas;
        const desiredReplicas = svcDefinition.size;

        if (currReplicas !== desiredReplicas) {
            deployment.spec!.replicas = desiredReplicas;
            this._log(`\t\tReplicas changed from ${currReplicas} to ${desiredReplicas}`);
            reDeploymentRequired = true;
        }

        const container = deployment.spec!.template!.spec!.containers.find(
            value => value.name === svcDefinition.svcName
        );
        if (container && container.image !== svcDefinition.image) {
            this._log(`\t\tImage changed from ${container.image} to ${svcDefinition.image}`);
            container.image = svcDefinition.image;
            reDeploymentRequired = true;
        }

        // override configs
        if(container && container.env && obj.spec?.configOverride){
            const configs: MojaloopVNextInstallConfigOverride = obj.spec.configOverride;
            //const configKeyNames = Object.keys(configs);
            // iterate container env vars
            container.env.forEach(envVar => {
                if(Object.hasOwn(configs, envVar.name)){
                    // if the value is different update
                    if(envVar.value !== configs[envVar.name as keyof MojaloopVNextInstallConfigOverride]){
                        envVar.value = configs[envVar.name as keyof MojaloopVNextInstallConfigOverride];
                        this._log(`\t\tEnv var ${envVar.name} value changed`);
                        reDeploymentRequired = true;
                    }
                }
            });
        }

        if (!reDeploymentRequired) {
            this._log("\t\tNo changes detected, ignoring.");
            return false;
        }

        this._log("\t\tChanges detected, replacing deployment...");

        // TODO: must remove resource version before replacing the deployment - CONFIRM this the way to do this!!!
        delete deployment.metadata!.resourceVersion;

        await this._k8sApi.replaceNamespacedDeployment(svcDefinition.svcName, NAMESPACE, deployment);
        this._log("\t\tReplace deployment complete.\n");

        return true;
    }

    // Helper to get the pod list for the given deployment.
    private async _getPodList(podSelector: string): Promise<string[]> {
        try {
            const podList = await this._k8sApiPods.listNamespacedPod(
                NAMESPACE,
                undefined,
                undefined,
                undefined,
                undefined,
                podSelector,
            );
            return podList.body.items.map((pod) => pod.metadata!.name!);
        } catch (err) {
            this._log(err);
        }
        return [];
    }


    // Call the API to destroy the resource, happens when the CRD instance is deleted.
    private async _deleteResource(obj: MojaloopVNextInstall) {
        // TODO this is wrong, it should delete the multiple services as per spec (same as reconcile)
        this._k8sApi.deleteNamespacedDeployment(obj.metadata.name!, NAMESPACE);
        this._log(`Deleted ${obj.metadata.name}`);

    }


}
