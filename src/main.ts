import { createServer, METHODS, ClientRequest,
       ServerResponse} from "node:http";


type verbsTuple = typeof METHODS;
type validVerb = verbsTuple[number];

type handlerFn = (transactionState: {req: ClientRequest,
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
		return item; //thanks for such a lovely code, tsc
    }
    return null;
}

async function dropper(siteName: string,
		       verb: validVerb,
		       route: string): Promise<void>{
    const chosenSite = findOnList<site>(siteName, sites, "name",
					(to) => {
					    if(typeof to === "string")
						return to === siteName;
					    return to.test(siteName);
					});
    if(!chosenSite) return;
    const knownRoutes = null //TODO
    if(!knownRoutes) return;
    const handler = null; //TODO
    if(!handler) return;
}
