import fs from "node:fs/promises";
import path from "node:path";
import {Site, Verb, Route} from "./server.js";
import loadHandler from "./handler.js";
import findServer from "./findServer.js";

type Config = {
    port: number,
    sites: SiteConfig[],
}

type SiteConfig = {
    name: string,
    verbs: VerbConfig[],
}

type VerbConfig = {
    verb: string,
    routes: RouteConfig[],
}

type RouteConfig = {
    name: string,
    handler: string,
}

//TODO make this map the config types
//This will be usefull for extending basic config options
const topLevelConfigProps: string[] = ["port"];
const siteLevelConfigProps: string[] = [];
const verbLevelConfigProps: string[] = [];
const routeLevelConfigProps: string[] = ["handler"];
//not implemented yet

export async function translateSiteConfig(siteConfig: SiteConfig): Promise<Site>{
    const verbs = [];
    for(let verb of siteConfig.verbs){
	verbs.push(await translateVerbConfig(verb));
    }
    return {name: siteConfig.name,
	    verbs: verbs};
}

async function translateVerbConfig(verbConfig: VerbConfig): Promise<Verb>{
    const routes: Route[] = [];
    for(let route of verbConfig.routes){
	routes.push(await translateRouteConfig(route));
    }
    return {verb: verbConfig.verb,
	    routes: routes};
}

async function translateRouteConfig(routeConfig: RouteConfig): Promise<Route>{
    return {name: translateWildcard(routeConfig.name),
	    handler: await loadHandler(routeConfig.handler)};
}

function translateWildcard(str: string): string | RegExp {
    const wildcards = ["*", "?", "^", "$", ".", "!", "[", "]"];
    str = str.replace(/\*/g, ".");
    for(let char of wildcards){
	if(str.indexOf(char) !== -1)
	    return new RegExp(str);
    }
    return str;
}

export async function loadConfig(): Promise<Config>{ 
    try{
	const serverDir = findServer();
	if(!serverDir) return makeConfig({});
	const fileContents = await fs.readFile(path.resolve(serverDir, "config.json"));
	const contestingConfig: {[k: string]: any} = JSON.parse(fileContents.toString());

	let configObj: {[k: string]: any} = {}
	let sites: {[k: string]: any}[] = [];

	for(let prop in contestingConfig){
	    if(topLevelConfigProps.indexOf(prop) !== -1){
		configObj[prop] = contestingConfig[prop];
		continue;
	    }
	    const currentSiteName = prop;
	    const contestingSiteObj = contestingConfig[prop];
	    const siteConfig: {[k: string]: any} = {}
	    const verbs = [];
	    for(let prop in contestingSiteObj){
		if(siteLevelConfigProps.indexOf(prop) !== -1){
		    siteConfig[prop]  = contestingSiteObj[prop];
		}
		const currentVerb = prop;


		const contestingVerbObj = contestingSiteObj[prop];
		const verbConfig: {[k: string]: any} = {};
		const routes = [];
		for(let prop in contestingVerbObj){
		    if(verbLevelConfigProps.indexOf(prop) !== -1){
			verbConfig[prop]  = contestingVerbObj[prop];
		    }
		    const currentRoute = prop;
		    const contestingRouteObj = contestingVerbObj[prop];
		    const routeConfig: {[k: string]: any} = {}
		    for(let prop in contestingRouteObj){
			if(routeLevelConfigProps.indexOf(prop) !== -1){
			    routeConfig[prop] = contestingRouteObj[prop];
			}
		    }
		    routes.push({name: currentRoute, ...routeConfig});
		}
		verbs.push({verb: currentVerb, routes: routes, ...verbConfig});
	    }
	    sites.push({name: currentSiteName, verbs: verbs, ...siteConfig});
	}
	configObj.sites = sites;
	
	return makeConfig(configObj);
	
    } catch(e){
	console.error("Failed to read configuration file");
	if(typeof e === "object" &&
	    e !== null &&
	    "message" in e) console.log(e.message);
	process.exit(1);
    }
}

function getValidElements<T>(arr: any[], validator: (e: any) => T | null): T[]{
    const validElements: T[] = [];
    for(let element of arr){
	if(validator(element))
	    validElements.push(element);
    }
    return validElements;
}

function validateSite(site: any): SiteConfig | null {
    if("name" in site && "verbs" in site){
	const validVerbs: VerbConfig[] = getValidElements(site.verbs, validateVerb);
	//implement name validator later
	return {name: site.name,
		verbs: validVerbs};
    }
    return null;
}

function validateVerb(verb: any): VerbConfig | null {
    if("verb" in verb && "routes" in verb){
	const validRoutes: RouteConfig[] = getValidElements(verb.routes, validateRoute);
	return {verb: verb.verb,
		routes: validRoutes};
    }
    return null;
}

function validateRoute(route: any): RouteConfig | null {
    if("name" in route && "handler" in route){
	return {name: route.name,
		handler: route.handler};
    }
    return null;
}

function makeConfig(obj: {[k:string]: any}): Config{
    //validar que o objeto json carregado definitivamente tem
    //as propriedades minimas esperadas do tipo
    let configObj: Config;
    let port = obj.port;
    if(obj.sites && obj.sites instanceof Array){
	const validSites = getValidElements(obj.sites, validateSite);
	return {port: port || 8080, sites: validSites};
    }
    return {port: 8080, sites: []};
}
