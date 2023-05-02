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

type StringKeyObj = {[k:string]:any};

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
	const fileContents = (await fs.readFile(path.resolve(serverDir, "config.json"))).toString();
	return parseConfig(JSON.parse(fileContents));
    } catch(e){
	console.error("Failed to read configuration file");
	if(typeof e === "object" &&
	    e !== null &&
	    "message" in e) console.error(e.message);
	process.exit(1);
    }
}

function makeLevelParseFunction(levelName: string,
				nextLevelName: string,
				levelIdentifier: string,
				levelProps: string[],
				nextLevel: (obj: StringKeyObj) => any):
(obj: StringKeyObj) => StringKeyObj{
    return function(obj){
	const newObj: StringKeyObj = {[levelName + "s"]: []};
	const levelArr = newObj[levelName + "s"];
	for(let prop in obj){
	    if(levelProps.indexOf(prop) !== -1){
		newObj[prop] = obj[prop];
		continue;
	    }
	    levelArr.push({[levelIdentifier]: prop,
			   [`${nextLevelName}s`]: (nextLevel(obj[prop])[`${nextLevelName}s`])});
	}
	return newObj;
    }
}

//TODO review this
const parseRoute = function(obj: StringKeyObj): any{
    const newObj: StringKeyObj = {["routes"]: []};
    for(let prop in obj){
	if(verbLevelConfigProps.indexOf(prop) !== -1){
	    newObj[prop] = obj[prop];
	    continue;
	}
	newObj["routes"].push({name: prop,
			       handler: obj[prop]["handler"]});
    }
    return newObj;
}

const parseVerb = makeLevelParseFunction("verb", "route", "verb", siteLevelConfigProps, parseRoute);
const parseSite = makeLevelParseFunction("site", "verb", "name", topLevelConfigProps, parseVerb);

async function parseConfig(loadedObj: {[k: string]: any}): Promise<Config>{
    const configObj = makeConfig(parseSite(loadedObj));
    return configObj;
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
    let configObj: Config;
    let port = obj.port;
    if(obj.sites && obj.sites instanceof Array){
	const validSites = getValidElements(obj.sites, validateSite);
	return {port: port || 8080, sites: validSites};
    }
    return {port: 8080, sites: []};
}
