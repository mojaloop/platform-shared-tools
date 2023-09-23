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

import * as k8s from "@kubernetes/client-node";

// Configure the operator to deploy your custom custom-resources
// and the destination namespace for your pods
export const RESOURCE_GROUP = "vnext.mojaloop.io";
export const RESOURCE_VERSION = "v1";
export const RESOURCE_KIND = "MojaloopVNextInstall";
export const RESOURCE_PLURAL = "vnext-installs";
export const NAMESPACE = "mojaloop-vnext";

export interface MojaloopVNextInstallConfigOverride{
    kafka_url: string;
    mongo_url: string;
}

export interface MojaloopVNextInstallServiceDefinition{
    svcName: string;
    bcName: string;
    image: string;
    layer: "cross-cutting" | "apps";
    size: number;
}

// This value specifies the amount of pods that your deployment will have
export interface MojaloopVNextInstallSpec {
    configOverride: MojaloopVNextInstallConfigOverride;
    services: MojaloopVNextInstallServiceDefinition[];
}

export interface MojaloopVNextInstallStatus {
    pods: string[];
    lastChangedBy: string;
}

export interface MojaloopVNextInstall {
    apiVersion: string;
    kind: string;
    metadata: k8s.V1ObjectMeta;
    spec?: MojaloopVNextInstallSpec;
    status?: MojaloopVNextInstallStatus;
}
