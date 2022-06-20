import http from "http";

let srv = http.createServer();

function start(): void{
    srv.listen(8080);
}

//start();
