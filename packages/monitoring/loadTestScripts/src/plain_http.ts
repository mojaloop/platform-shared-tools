import {createServer} from "http";


createServer(function (req: any, res: any) {
    console.log(`Got request - method: ${req.method} url: ${req.url} - from: ${req.socket.remoteAddress}:${req.socket.remotePort}`);
    if (req.url.startsWith("/parties/")){
        return respondGetParty(req,  res);
    }

    res.writeHead(404, {"Content-Type": "text/plain"});
    res.end();

}).listen(10050, "127.0.0.1");
console.log("Server running at http://127.0.0.1:10050/");

function respondGetParty(req: any, res: any){
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World!");
}
