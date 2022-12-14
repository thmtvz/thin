import { createServer, METHODS, IncomingMessage,
       ServerResponse} from "node:http";

type verbsTuple = typeof METHODS;
type validVerb = verbsTuple[number];

type handlerFn = (transactionState: {req: IncomingMessage,
				     res: ServerResponse},
		  serverState: {},
		  modules: {}) => void

type route = {
    name: string | RegExp,
    handler: handlerFn,
}

type verb = {
    verb: validVerb;
    routes: route[],
}

type site = {
    name: string | RegExp,
    verbs: verb[];
}

const server = createServer();

const sites: site[] = [];

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
		return item; //thanks for such a lovely code, ts
    }
    return null;
}

function dropper(siteName: string,
		       verb: validVerb,
		       route: string): handlerFn | null{
    const chosenSite = findOnList<site>(siteName, sites, "name", compareTo(siteName));
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
	let extendedRequest: IncomingMessage & {body?: string} = request;
	extendedRequest.body = Buffer.concat(buf).toString();
	let handle = dropper(hostname, verb, pathname);
	if(handle !== null)
	    handle({req: extendedRequest, res: response}, {}, {});
    });
}

function setup(config: Config){
    server.on("request", serverHandler);
    server.listen(8080);
}
