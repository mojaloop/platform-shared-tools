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

import {IHistogram, IMetrics} from "@mojaloop/platform-shared-lib-observability-types-lib";
import {FastifyReply, FastifyRequest} from "fastify";
import * as http from "http";
import {ILogger} from "@mojaloop/logging-bc-public-types-lib";
import {MY_FSPID} from "../index";

export abstract class BaseRoute {
    protected readonly _metrics: IMetrics;
    protected _histogram: IHistogram;
    protected readonly _loggger: ILogger;

    constructor(metrics: IMetrics, logger:ILogger) {
        this._metrics = metrics;
        this._loggger = logger.createChild(this.constructor.name);
    }

    protected propagateTracingHeaders(request:FastifyRequest, callbackRequest:http.ClientRequest){
        // propagate standard tracing headers
        if(request.headers["traceparent"]) callbackRequest.setHeader("traceparent", request.headers["traceparent"]);
        if(request.headers["tracestate"]) callbackRequest.setHeader("tracestate", request.headers["tracestate"]);
        if(request.headers["baggage"]) callbackRequest.setHeader("baggage", request.headers["baggage"]);

        //pass test headers
        for (const key in request.headers) {
            if (key.toUpperCase().startsWith("TEST-") || key.toUpperCase().startsWith("TRACING-")) {
                callbackRequest.setHeader(key, request.headers[key] as string);
            }
        }
    }

    protected _checkRequestDestinationOrRespondError(request:FastifyRequest, reply:FastifyReply):void{
        if(request.headers["fspiop-destination"] !== MY_FSPID) {
            this._loggger.warn(`Got request wrong FSPIOP destination: "${request.headers["fspiop-destination"]}", I'm: ${MY_FSPID}  - request method: ${request.method} - path: ${request.routerPath}`);
            reply.status(400).send({error: "Wrong FSPIOP destination"});
            return;
        }
    }
}
