/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Interledger Foundation
- Pedro Sousa Barreto <pedrosousabarreto@gmail.com>
*****/

"use strict";

import {FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest} from "fastify";
import {ClientRequest, RequestOptions} from "http";
import console from "console";
import {BaseRoute} from "./base_route";
import {IMetrics} from "@mojaloop/platform-shared-lib-observability-types-lib";
import {
    FSPIOP_HOST,
    FSPIOP_PORT, MY_FSPID,
    TRACING_REQ_START_TS_HEADER_NANE, TRACING_RESP_START_TS_HEADER_NANE
} from "../index";
import { ILogger } from "@mojaloop/logging-bc-public-types-lib";

export class LookupsSimulatorRoutes extends BaseRoute{

    constructor(metrics: IMetrics, logger:ILogger) {
        super(metrics, logger);

        this._histogram = metrics.getHistogram("Simulator_lookups", "Simulator_lookups", ["leg", "success"]);
    }

    public async bindRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void>{
        fastify.get("/MSISDN/:partyId", this._handleGet.bind(this));
        fastify.put("/MSISDN/:partyId", this.handlePut.bind(this));
    }

    private async handlePut(request:FastifyRequest, reply:FastifyReply): Promise<void> {
        this._checkRequestDestinationOrRespondError(request, reply);

        const now = Date.now();
        const reOriginalTimestamp = request.headers[TRACING_REQ_START_TS_HEADER_NANE] as string || "0";
        const totalDurationMs = now - parseInt(reOriginalTimestamp);
        this._histogram.observe({leg:"total", success: "true"}, totalDurationMs/1000);

        const responseTimestamp = request.headers[TRACING_RESP_START_TS_HEADER_NANE] as string || "0";
        const responseDurationMs = now - parseInt(responseTimestamp);
        this._histogram.observe({leg:"response", success: "true"}, responseDurationMs/1000);

        this._loggger.isDebugEnabled() && this._loggger.debug(`${new Date().toISOString()} - Got request - ${request.method} /parties/${(request.params as any).partyId} - response: ${responseDurationMs} ms - total: ${totalDurationMs} ms`);

        return reply.status(202).send(null);
    }

    private async _handleGet(request:FastifyRequest, reply:FastifyReply): Promise<void> {
        this._checkRequestDestinationOrRespondError(request, reply);

        const reOriginalTimestamp:string = request.headers[TRACING_REQ_START_TS_HEADER_NANE] as string || "0";
        const durationMs = Date.now() - parseInt(reOriginalTimestamp);
        this._histogram.observe({leg:"request", success: "true"}, durationMs/1000);

        this._loggger.isDebugEnabled() && this._loggger.debug(`${new Date().toISOString()} - Got request - GET /parties - request: ${durationMs} ms`);

        process.nextTick(() => {
            try {
                const reqSource = request.headers["fspiop-source"] as string;
                const reqDestination = request.headers["fspiop-destination"] as string;
                const partyId = (request.params as any).partyId;
                const now = new Date();

                const options: RequestOptions = {
                    host: FSPIOP_HOST,
                    port: FSPIOP_PORT,
                    method: "PUT",
                    path: `/parties/MSISDN/${partyId}`
                };

                const putRequest = new ClientRequest(options);
                putRequest.setHeader("Content-Type", "application/vnd.interoperability.parties+json;version=1.0");
                putRequest.setHeader("Date", new Date().toISOString());
                putRequest.setHeader("FSPIOP-Source", reqDestination);
                putRequest.setHeader("FSPIOP-Destination", reqSource);
                putRequest.setHeader("FSPIOP-HTTP-Method", "PUT");

                // add response-timestamp header
                putRequest.setHeader(TRACING_RESP_START_TS_HEADER_NANE, now.valueOf());

                // propagate standard tracing headers
                this.propagateTracingHeaders(request, putRequest);

                putRequest.write(JSON.stringify({
                    "party": {
                        "partyIdInfo": {
                            "partyIdType": "MSISDN",
                            "partyIdentifier": partyId,
                            "fspId": "test1"
                        },
                        "name": `PedroBarreto_${partyId}`,
                        "merchantClassificationCode": "7889",
                        "personalInfo": {
                            "complexName": {
                                "lastName": "Barreto",
                                "middleName": "S",
                                "firstName": "Pedro"
                            },
                            "dateOfBirth": "1976-11-24"
                        }
                    }
                }));
                putRequest.end();
            }catch (err){
                console.log(err, "error sending PUT to switch");
            }
        });

        return reply.status(202).send(null);
    }
}
