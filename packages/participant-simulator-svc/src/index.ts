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

import * as console from "console";
import {PrometheusMetrics} from "@mojaloop/platform-shared-lib-observability-client-lib";
import crypto from "crypto";
import {ConsoleLogger, LogLevel} from "@mojaloop/logging-bc-public-types-lib";
import Fastify, { FastifyInstance} from "fastify";
import {TransferSimulatorRoutes} from "./routes/transfers";
import {QuotesSimulatorRoutes} from "./routes/quotes";
import {LookupsSimulatorRoutes} from "./routes/lookups";
import process from "process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require("../package.json");
const BC_NAME = "performance-measurement-bc";
const APP_NAME = "participant-simulator-svc";
const APP_VERSION = packageJSON.version;
const INSTANCE_NAME = `${BC_NAME}_${APP_NAME}`;
const INSTANCE_ID = `${INSTANCE_NAME}__${crypto.randomUUID()}`;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const metricsPlugin = require("fastify-metrics");


const LOGLEVEL: LogLevel = process.env["LOG_LEVEL"] as LogLevel || LogLevel.DEBUG;

const FSPIOP_API_URL = process.env["FSPIOP_API_URL"] || "http://fspiop.local:80";
const LISTEN_PORT = process.env["LISTEN_PORT"] ? parseInt(process.env["LISTEN_PORT"]) : 10050;

export const MY_FSPID = process.env["MY_FSPID"] || "test1";

export const TRACING_REQ_START_TS_HEADER_NANE= process.env["TRACING_REQ_START_TS_HEADER_NANE"] || "tracing-request-start-timestamp";
export const TRACING_RESP_START_TS_HEADER_NANE= process.env["TRACING_RESP_START_TS_HEADER_NANE"] || "tracing-response-start-timestamp";

const parsedFspIopAPIUrl = new URL(FSPIOP_API_URL);
export const FSPIOP_HOST = parsedFspIopAPIUrl.hostname;
export const FSPIOP_PORT = parseInt(parsedFspIopAPIUrl.port || "") || 80;

const consoleLogger = new ConsoleLogger();
consoleLogger.setLogLevel(LOGLEVEL);
/*
* Code starts here
* */

console.log(`\n*** Mojaloop vNext Simulator v${APP_VERSION} ***`);
console.log(`- FSP_ID:\t\t${MY_FSPID}\n- FSPIOP URL:\t\t${FSPIOP_API_URL}\n- Listen port:\t\t${LISTEN_PORT}`);
console.log(`- Instance ID:\t\t${INSTANCE_ID}\n- Metrics at:\t\t/metrics\n`);

// metrics
const labels: Map<string, string> = new Map<string, string>();
labels.set("bc", BC_NAME);
labels.set("app", APP_NAME);
labels.set("version", APP_VERSION);
labels.set("instance_id", INSTANCE_ID);
PrometheusMetrics.Setup({prefix: "", defaultLabels: labels}, consoleLogger);
const metrics = PrometheusMetrics.getInstance();

// instantiate fastify
const server: FastifyInstance = Fastify({ logger: false});

// Hook metrics path
server.register(metricsPlugin, {
    routeMetrics: true,
    defaultMetrics: {enabled: false}, // already collected by our own metrics lib
    endpoint: "/metrics",
    promClient: (metrics as PrometheusMetrics).getPromClient(),
});

server.addContentTypeParser("*", { parseAs: "string" },(req, body, done)=> {
    done(null, req);
});

server.setNotFoundHandler((error, request:any) => {
    console.log(`Got NOT FOUND: ${request.raw.req.method} - ${request.raw.req.url}`);
    return 404;
});

// parse body content for anything that includes a content-type header looking like this
server.addContentTypeParser(/^application\/vnd\.interoperability\..+\+json;version=1\.[0-1]/, { parseAs: "string" }, server.getDefaultJsonParser("ignore", "ignore"));

// Register route handlers
const transfersRoutes = new TransferSimulatorRoutes(metrics, consoleLogger);
server.register(transfersRoutes.bindRoutes.bind(transfersRoutes), { prefix: "/transfers" });

const quotesRoutes = new QuotesSimulatorRoutes(metrics, consoleLogger);
server.register(quotesRoutes.bindRoutes.bind(quotesRoutes), { prefix: "/quotes" });

const lookupsRoutes = new LookupsSimulatorRoutes(metrics, consoleLogger);
server.register(lookupsRoutes.bindRoutes.bind(lookupsRoutes), { prefix: "/parties" });



// start server
server.listen({host: "0.0.0.0", port: LISTEN_PORT}, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }



    consoleLogger.info(`Server listening at ${address}`);
});


async function _handle_int_and_term_signals(signal: NodeJS.Signals): Promise<void> {
    console.info(`Service - ${signal} received - cleaning up...`);
    let clean_exit = false;
    setTimeout(() => {
        clean_exit || process.exit(99);
    }, 5000);

    // call graceful stop routine
    await server.close();

    clean_exit = true;
    process.exit();
}

//catches ctrl+c event
process.on("SIGINT", _handle_int_and_term_signals);
//catches program termination event
process.on("SIGTERM", _handle_int_and_term_signals);

//do something when app is closing
process.on("exit", async () => {
    console.info(`${INSTANCE_ID} pid: ${process.pid} - exiting...`);
});
process.on("uncaughtException", (err: Error) => {
    console.error(err);
    console.log("UncaughtException - EXITING...");
    process.exit(999);
});


// // Handle the response to requester
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-ignore
// server.put("/parties/MSISDN/999/error", async (request, reply) => {
//     console.log("Got request ERROR - PUT /parties/MSISDN/999");
//     return 200;
// });

// Handle the response to requester
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// server.put("/parties/MSISDN/:partyid", async (request:any, reply) => {
//     // const reOriginalTimestamp = request.headers["test-request-timestamp"] || 0;
//     // const durationMs = Date.now() - parseInt(reOriginalTimestamp);
//
//     //console.log(`${new Date().toISOString()} - Got request - PUT /parties/MSISDN/${request.params.partyid} - durationMs: ${durationMs}`);
//
//     return 202;
// });
/*

server.get("/parties/MSISDN/:partyid", async (request:any, reply) => {
    //console.log(`${new Date().toISOString()} - Got request - GET /parties/MSISDN/${request.params.partyid}`);

    process.nextTick(() => {
        try {
            const reqSource = request.headers["fspiop-source"];
            const reqDestination = request.headers["fspiop-destination"];

            const options: RequestOptions = {
                host: FSPIOP_HOST,
                port: FSPIOP_PORT,
                method: "PUT",
                path: `/parties/MSISDN/${request.params.partyid}`
            };

            const putRequest = new ClientRequest(options);
            putRequest.setHeader("Content-Type", "application/vnd.interoperability.parties+json;version=1.0");
            putRequest.setHeader("Date", new Date().toISOString());
            putRequest.setHeader("FSPIOP-Source", reqDestination);
            putRequest.setHeader("FSPIOP-Destination", reqSource);
            putRequest.setHeader("FSPIOP-HTTP-Method", "PUT");

            if(request.headers["traceparent"]) putRequest.setHeader("traceparent", request.headers["traceparent"]);
            if(request.headers["tracestate"]) putRequest.setHeader("tracestate", request.headers["tracestate"]);

            //pass test headers
            for (const key in request.headers) {
                if (key.toUpperCase().startsWith("TEST-")) {
                    putRequest.setHeader(key, request.headers[key]);
                }
            }

            putRequest.write(JSON.stringify({
                "party": {
                    "partyIdInfo": {
                        "partyIdType": "MSISDN",
                        "partyIdentifier": request.params.partyid,
                        "fspId": "test1"
                    },
                    "name": `PedroBarreto_${request.params.partyid}`,
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

    return 202;
});

*/

/*
// eslint-disable-file
// @ts-ignore
server.put("/quotes/:quoteid", async (request:any, reply) => {
    const reOriginalTimestamp = request.headers[TRACING_REQ_START_TS_HEADER_NANE] || 0;
    const durationMs = Date.now() - parseInt(reOriginalTimestamp);

    // console.log(`${new Date().toISOString()} - Got request - PUT /quotes/${request.params.quoteid} - durationMs: ${durationMs}`);
    histo_quotes.observe({leg:"total", success: "true"}, durationMs/1000);
});

// @ts-ignore
server.post("/quotes", async (request:any, reply) => {
    console.log(`${new Date().toISOString()} - Got request - POST /quotes`);

    process.nextTick(() => {
        try {
            const reqSource = request.headers["fspiop-source"];
            const reqDestination = request.headers["fspiop-destination"];
            const quoteId = request.body.quoteId;
            const now = new Date();

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const allrespHeaders = reply.getHeaders();
            const options: RequestOptions = {
                host: FSPIOP_HOST,
                port: FSPIOP_PORT,
                method: "PUT",
                path: `/quotes/${quoteId}`
            };

            const putRequest = new ClientRequest(options);
            putRequest.setHeader("Content-Type", "application/vnd.interoperability.quotes+json;version=1.0");
            putRequest.setHeader("Date", now.toISOString());
            putRequest.setHeader("FSPIOP-Source", reqDestination);
            putRequest.setHeader("FSPIOP-Destination", reqSource);
            // putRequest.setHeader("FSPIOP-HTTP-Method", "PUT");

            if(request.headers["traceparent"]) putRequest.setHeader("traceparent", request.headers["traceparent"]);
            if(request.headers["tracestate"]) putRequest.setHeader("tracestate", request.headers["tracestate"]);

            //pass test headers
            for (const key in request.headers) {
                if (key.toUpperCase().startsWith("TEST-")) {
                    putRequest.setHeader(key, request.headers[key]);
                }
            }

            putRequest.write(JSON.stringify({
                "transferAmount": {
                    "currency": "EUR",
                    "amount": "10"
                },
                "expiration": new Date(now.setFullYear(now.getFullYear()+1)).toISOString(), // 1 year
                "ilpPacket": "AYICUgAAAAAAAAPoFWcuYmx1ZWJhbmsubXNpc2RuLjQ1NoICMGV5SjBjbUZ1YzJGamRHbHZia2xrSWpvaU0yRmpOR0V5T0RFdE5HSmxPUzAwT0dZd0xUbGhZekl0WkRWa1lXUmpaR0V4TW1WaElpd2ljWFZ2ZEdWSlpDSTZJamMzWXpZMk9XWXpMV0k0WkdZdE5ERmhZeTFoWkRObExXVXdOMk5tTkRNM09HSTNPQ0lzSW5CaGVXVmxJanA3SW5CaGNuUjVTV1JKYm1adklqcDdJbkJoY25SNVNXUlVlWEJsSWpvaVRWTkpVMFJPSWl3aWNHRnlkSGxKWkdWdWRHbG1hV1Z5SWpvaU5EVTJJaXdpWm5Od1NXUWlPaUppYkhWbFltRnVheUo5ZlN3aWNHRjVaWElpT25zaWNHRnlkSGxKWkVsdVptOGlPbnNpY0dGeWRIbEpaRlI1Y0dVaU9pSk5VMGxUUkU0aUxDSndZWEowZVVsa1pXNTBhV1pwWlhJaU9pSXhNak1pTENKbWMzQkpaQ0k2SW1keVpXVnVZbUZ1YXlKOWZTd2lZVzF2ZFc1MElqcDdJbU4xY25KbGJtTjVJam9pUlZWU0lpd2lZVzF2ZFc1MElqb2lNVEFpZlN3aWRISmhibk5oWTNScGIyNVVlWEJsSWpwN0luTmpaVzVoY21sdklqb2lSRVZRVDFOSlZDSXNJbWx1YVhScFlYUnZjaUk2SWxCQldVVlNJaXdpYVc1cGRHbGhkRzl5Vkhsd1pTSTZJa0pWVTBsT1JWTlRJbjE5AA",
                "condition": "mmXwcRYg08OOP6L89-iQkMfEjYAnMdhOPr7ME5k4FKU",
                "payeeFspCommission": {
                    "currency": "EUR",
                    "amount": "0.3"
                },
                "payeeReceiveAmount": {
                    "currency": "EUR",
                    "amount": "10"
                },
                "payeeFspFee": {
                    "currency": "EUR",
                    "amount": "0.2"
                },
                "geoCode": {
                    "latitude": "-51",
                    "longitude": "180"
                }
            }));
            putRequest.end();
        }catch (err){
            console.log(err, "error sending PUT to switch");
        }
    });

    return 202;
});
*/

/*
// @ts-ignore
server.patch("/transfers/:transferid", async (request:any, reply) => {
    const now = Date.now();
    const reqDestination = request.headers["fspiop-destination"];

    // we only care about this when we are the destination
    if(reqDestination !== MY_FSPID) return;

    const reOriginalTimestamp = request.headers[TRACING_REQ_START_TS_HEADER_NANE] || 0;
    const totalDurationMs = now - parseInt(reOriginalTimestamp);

    histo_transfers.observe({leg:"total", success: "true"}, totalDurationMs/1000);

    const fulfilmentTimestamp = request.headers["test-fulfilment-timestamp"] || 0;
    const fulfilmentDurationMs = now - parseInt(fulfilmentTimestamp);
    histo_transfers.observe({leg:"filfil", success: "true"}, fulfilmentDurationMs/1000);

    // console.log(`${new Date().toISOString()} - Got request - PATCH /transfers/${request.params.transferid} - fulfil: ${fulfilmentDurationMs} ms - total: ${totalDurationMs} ms - ignored`);
});

// @ts-ignore
server.put("/transfers/:transferid", async (request:any, reply) => {
    const now = Date.now();
    const reqDestination = request.headers["fspiop-destination"];

    // we only care about this when we are the destination
    if(reqDestination !== MY_FSPID) return;

    const reOriginalTimestamp = request.headers[TRACING_REQ_START_TS_HEADER_NANE] || 0;
    const totalDurationMs = now - parseInt(reOriginalTimestamp);

    histo_transfers.observe({leg:"total", success: "true"}, totalDurationMs/1000);

    const fulfilmentTimestamp = request.headers["test-fulfilment-timestamp"] || 0;
    const fulfilmentDurationMs = now - parseInt(fulfilmentTimestamp);
    histo_transfers.observe({leg:"filfil", success: "true"}, fulfilmentDurationMs/1000);

   // console.log(`${new Date().toISOString()} - Got request - PUT /transfers/${request.params.transferid} - fulfil: ${fulfilmentDurationMs} ms - total: ${totalDurationMs} ms`);
});

function propagateTacingHEaders(sourceHeaders, destinationRequest){
    // propagate standard tracing headers
    if(request.headers["traceparent"]) putRequest.setHeader("traceparent", request.headers["traceparent"]);
    if(request.headers["tracestate"]) putRequest.setHeader("tracestate", request.headers["tracestate"]);

    //pass test headers
    for (const key in request.headers) {
        if (key.toUpperCase().startsWith("TEST-") || key.toUpperCase().startsWith("TRACING-")) {
            putRequest.setHeader(key, request.headers[key]);
        }
    }
}


// @ts-ignore
server.post("/transfers", async (request:FastifyRequest, reply:FastifyReply) => {
    const reOriginalTimestamp:string = request.headers. || "0";
    const durationMs = Date.now() - parseInt(reOriginalTimestamp);
    histo_transfers.observe({leg:"prepare", success: "true"}, durationMs/1000);

    //console.log(`${new Date().toISOString()} - Got request - POST /transfers - prepare: ${durationMs} ms`);

    process.nextTick(() => {
        try {
            const reqSource = request.headers["fspiop-source"];
            const reqDestination = request.headers["fspiop-destination"];
            const transferId = request.body.transferId;
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
            putRequest.setHeader(TRACING_FULFILMENT_TS_HEADER_NANE, now.valueOf());

            // propagate standard tracing headers
            if(request.headers["traceparent"]) putRequest.setHeader("traceparent", request.headers["traceparent"]);
            if(request.headers["tracestate"]) putRequest.setHeader("tracestate", request.headers["tracestate"]);

            //pass test headers
            for (const key in request.headers) {
                if (key.toUpperCase().startsWith("TEST-") || key.toUpperCase().startsWith("TRACING-")) {
                    putRequest.setHeader(key, request.headers[key]);
                }
            }

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

    return 202;
});*/
