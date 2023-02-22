import { createServer, METHODS, IncomingMessage,
	 ServerResponse, Server} from "node:http";
import {loadConfig, translateSiteConfig} from "./config.js";
import {registerSite, retrieveSite} from "./registry.js";

type VerbsTuple = typeof METHODS;
type ValidVerb = VerbsTuple[number];

export type HandlerFn = (transactionState: {req: IncomingMessage,
				     res: ServerResponse},
		  serverState: {},
		  modules: {}) => void

export type Route = {
    name: string | RegExp,
    handler: HandlerFn,
}

export type Verb = {
    verb: ValidVerb;
    routes: Route[],
}

export type Site = {
    name: string | RegExp,
    verbs: Verb[];
}

function findOnList<T extends Object>(name: string,
				      list: T[],
				      property: keyof T,
				      compare: (to: string | RegExp) => boolean): T | null{
    for(let item of list){
	let comparee: any = item[property]; 
	if(typeof comparee === "string" ||
	    (typeof comparee === "object" &&
		comparee !== null &&
		"test" in comparee))
	    if(compare(comparee) === true)
		return item; 
    }
    return null;
}

function dropper(siteName: string,
		       verb: ValidVerb,
		       route: string): HandlerFn | null{
    const chosenSite = retrieveSite(siteName);
    if(!chosenSite) return null;
    const knownRoutes = findOnList(verb, chosenSite.verbs, "verb",
				   (to) => to === verb);
    if(!knownRoutes) return null;
    const handler = findOnList(route, knownRoutes.routes, "name", compareTo(route));
    if(!handler) return null;

    return handler.handler;

    function compareTo(someString: string){
	return function(to: string | RegExp){
	    if(typeof to === "string") return to === someString;
	    return to.test(someString);
	}
    }
}

async function serverHandler(request: IncomingMessage,
			     response: ServerResponse): Promise<void>{
    const { hostname, pathname } = new URL(request.url || "", `http://${request.headers.host || ""}`);
    const verb = request.method || "";

    let buf: Buffer[] = [];

    request.on("data", (d) => buf.push(d));
    request.on("end", () => {
	console.log(hostname, pathname, verb);
	let extendedRequest: IncomingMessage & {body?: Buffer} = request;
	extendedRequest.body = Buffer.concat(buf);

	let handle = dropper(hostname, verb, pathname);
	if(handle !== null)
	    handle({req: extendedRequest, res: response}, {}, {});
    });
}

var server: null | Server = null;

export default async function startServer(){
    let config = await loadConfig();
    for(let site of config.sites){
	registerSite(await translateSiteConfig(site));
    }
    
    initServer(config.port);
}

function initServer(port: number){
    server = createServer();
    server.on("request", serverHandler);
    server.listen(port);
}
