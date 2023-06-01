import path from "node:path";
import fs from "node:fs";

const knownPaths = [
    "./server",
    "../server",
    "/etc/thin/",
];

var serverLocation: string | null = "";

function runFindServer(): string | null {
    for(let p of knownPaths){
	try{
	    fs.readdirSync(p);
	    return path.resolve(p);
	} catch (e) {
	    continue;
	}
    }
    return null;
}

export default function findServer(): string | null {
    if(serverLocation !== "") return serverLocation;
    return serverLocation = runFindServer();
}
