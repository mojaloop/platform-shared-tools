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



import process from "process";
import {MojaloopVNextInstallOperatorController} from "./operator_controller";

const DEFAULT_CONFIG_MODE = process.env["DEFAULT_CONFIG_MODE"] || false;

export class Service {
    static operator: MojaloopVNextInstallOperatorController;

    static async start():Promise<void>{

        // use default config, to use outside the cluster
        const useDefaultConfigMode = !!DEFAULT_CONFIG_MODE;
        this.operator = new MojaloopVNextInstallOperatorController(useDefaultConfigMode);
        await this.operator.init();
    }

    static async stop():Promise<void>{
        await this.operator.destroy();
    }
}



/**
 * process termination and cleanup
 */

async function _handle_int_and_term_signals(signal: NodeJS.Signals): Promise<void> {
    console.info(`Service - ${signal} received - cleaning up...`);
    let clean_exit = false;
    setTimeout(() => {
        clean_exit || process.exit(99);
    }, 5000);

    // call graceful stop routine
    await Service.stop();

    clean_exit = true;
    process.exit();
}

//catches ctrl+c event
process.on("SIGINT", _handle_int_and_term_signals);
//catches program termination event
process.on("SIGTERM", _handle_int_and_term_signals);

//do something when app is closing
process.on("exit", async () => {
    console.info("Microservice - exiting...");
});
process.on("uncaughtException", (err: Error) => {
    console.error(err);
    console.log("UncaughtException - EXITING...");
    process.exit(999);
});
