import * as fastify from "fastify";
import * as http from "http";
import {Server, IncomingMessage, ServerResponse, ClientRequest, RequestOptions} from "http";
import * as console from "console";
import * as repl from "repl";

const server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify.fastify({});

const FSPIOP_HOST = "10.233.36.48";
const FSPIOP_PORT = 4000;


const MY_FSPID = "test1";
const REQUESTER_FSPID = "test1";


server.addContentTypeParser("*", { parseAs: "string" },(req, body, done)=> {
    done(null, req);
});

server.setNotFoundHandler((error, request:any) => {
    console.log(`Got NOT FOUND: ${request.raw.req.method} - ${request.raw.req.url}`);
    return 404;
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
server.put("/parties/MSISDN/:partyid", async (request:any, reply) => {
    const reOriginalTimestamp = request.headers["test-request-timestamp"] || 0;
    const durationMs = Date.now() - parseInt(reOriginalTimestamp);

    console.log(`Got request - PUT /parties/MSISDN/${request.params.partyid} - durationMs: ${durationMs}`);

    return 202;
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
server.get("/parties/MSISDN/:partyid", async (request:any, reply) => {
    console.log(`Got request - GET /parties/MSISDN/${request.params.partyid}`);

    setImmediate(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const allrespHeaders = reply.getHeaders();
        const options: RequestOptions = {
            host: FSPIOP_HOST,
            port: FSPIOP_PORT,
            method: "PUT",
            path: `/parties/MSISDN/${request.params.partyid}`
        };

        const putRequest = new ClientRequest(options);
        putRequest.setHeader("Content-Type", "application/vnd.interoperability.parties+json;version=1.0");
        putRequest.setHeader("Date", new Date().toISOString());
        putRequest.setHeader("FSPIOP-Source", MY_FSPID);
        putRequest.setHeader("FSPIOP-Destination", REQUESTER_FSPID);
        putRequest.setHeader("FSPIOP-HTTP-Method", "PUT");

        //pass test headers
        for (const key in request.headers){
            if (key.toUpperCase().startsWith("TEST-")){
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
    });

    return 202;

});

server.listen({host: "192.168.1.94", port: 10050}, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
