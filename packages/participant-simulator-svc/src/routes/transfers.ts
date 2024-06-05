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

 * Interledger Foundation
 - Pedro Sousa Barreto <pedrosousabarreto@gmail.com>

 --------------
 ******/

"use strict";

import {FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest} from "fastify";
import {ClientRequest, RequestOptions} from "http";
import console from "console";
import {BaseRoute} from "./base_route";
import {IMetrics} from "@mojaloop/platform-shared-lib-observability-types-lib";
import {
    FSPIOP_HOST, FSPIOP_PORT, MY_FSPID,
    TRACING_REQ_START_TS_HEADER_NANE,
    TRACING_RESP_START_TS_HEADER_NANE
} from "../index";
import {ILogger} from "@mojaloop/logging-bc-public-types-lib";

export class TransferSimulatorRoutes extends BaseRoute{

    constructor(metrics: IMetrics, logger:ILogger) {
        super(metrics, logger);

        this._histogram = metrics.getHistogram("Simulator_transfers", "Simulator_transfers", ["leg", "success"]);
    }

    public async bindRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void>{
        fastify.post("/", this._handlePostTransfer.bind(this));
        fastify.patch("/:transferid", this.handlePutOrPatch.bind(this));
        fastify.put("/:transferid", this.handlePutOrPatch.bind(this));
    }

    private async handlePutOrPatch(request:FastifyRequest, reply:FastifyReply): Promise<void> {
        // we only care about this when we are the destination
        if(request.headers["fspiop-destination"] !== MY_FSPID) return;
        const now = Date.now();

        const reOriginalTimestamp = request.headers[TRACING_REQ_START_TS_HEADER_NANE] as string || "0";
        const totalDurationMs = now - parseInt(reOriginalTimestamp);
        this._histogram.observe({leg:"total", success: "true"}, totalDurationMs/1000);

        const responseTimestamp = request.headers[TRACING_RESP_START_TS_HEADER_NANE] as string || "0";
        const responseDurationMs = now - parseInt(responseTimestamp);
        this._histogram.observe({leg:"response", success: "true"}, responseDurationMs/1000);

        this._loggger.isDebugEnabled() && this._loggger.debug(`${new Date().toISOString()} - Got request - ${request.method} /transfers/${(request.params as any).transferid} - fulfil: ${responseDurationMs} ms - total: ${totalDurationMs} ms`);

        return reply.status(200).send(null);
    }

    private async _handlePostTransfer(request:FastifyRequest, reply:FastifyReply): Promise<void> {
        const reOriginalTimestamp:string = request.headers[TRACING_REQ_START_TS_HEADER_NANE] as string || "0";
        const durationMs = Date.now() - parseInt(reOriginalTimestamp);
        this._histogram.observe({leg:"prepare", success: "true"}, durationMs/1000);

        this._loggger.isDebugEnabled() && this._loggger.debug(`${new Date().toISOString()} - Got request - POST /transfers - request: ${durationMs} ms`);

        try{
            process.nextTick(() => {
                try {
                    const reqSource = request.headers["fspiop-source"] as string;
                    const reqDestination = request.headers["fspiop-destination"] as string;
                    const transferId = (request.body as any).transferId;
                    const now = new Date();

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const options: RequestOptions = {
                        host: FSPIOP_HOST,
                        port: FSPIOP_PORT,
                        method: "PUT",
                        path: `/transfers/${transferId}`
                    };

                    const putRequest = new ClientRequest(options);
                    putRequest.setHeader("Content-Type", "application/vnd.interoperability.transfers+json;version=1.0");
                    putRequest.setHeader("Date", now.toISOString());
                    putRequest.setHeader("FSPIOP-Source", reqDestination);
                    putRequest.setHeader("FSPIOP-Destination", reqSource);

                    // add fulfilment-timestamp header
                    putRequest.setHeader(TRACING_RESP_START_TS_HEADER_NANE, now.valueOf());

                    // propagate standard tracing headers
                    this.propagateTracingHeaders(request, putRequest);

                    putRequest.write(JSON.stringify({
                        "transferState": "COMMITTED",
                        "completedTimestamp": now.toISOString(),
                        "fulfilment": "305s3CMc6PPWVioY-k2rfW20paW56vMGw0QutQV_KiI"
                    }));
                    putRequest.end();
                }catch (err){
                    console.log(err, "error sending PUT to switch");
                }
            });
        }catch(err) {
            console.error(err);
        }
        return reply.status(202).send(null);
    }
}
