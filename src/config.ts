import fs from "node:fs/promises";
import path from "node:path";

//port
//sites

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

//sort of grammar 🤷🤷
const topLevelConfigProps: string[] = ["port"];
const siteLevelConfigProps: string[] = [];
const verbLevelConfigProps: string[] = [];
const routeLevelConfigProps: string[] = ["handler"];

async function loadConfig(filename: string): Promise<Config>{ //Returns config
    try{
	const fileContents = await fs.readFile(filename);
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
	
	//agora a missao é transformar isso aqui em um objeto que o typechecker aceita
	let result =  makeConfig(configObj);
	console.log(result);
	return result
	
    } catch(e){
	console.error("Failed to read configuration file");
	if(typeof e === "object" &&
	    e !== null &&
	    "message" in e) console.log(e.message);
	process.exit(1);
    }
}

function makeConfig(obj: {[k: string]: any}): Config{
    let configObj: Config;
    let port = obj.port;
    const sites: SiteConfig[] = [];
    if(obj.sites && obj.sites instanceof Array){
	for(let site of obj.sites){
	    if("name" in site &&
		"verbs" in site){
		const verbs: VerbConfig[] = [];
		if(site.verbs instanceof Array)
		    for(let verb of site.verbs){
			if("verb" in verb &&
			    "routes" in verb){
			    const routes: RouteConfig[] = [];
			    for(let route of verb.routes){
				if("name" in route &&
				    "handler" in route)
				    routes.push({name: route.name, handler: route.handler});
			    }
			    verbs.push({verb: verb.verb, routes: routes});
			}
		    }
		sites.push({name: site.name, verbs: verbs});
	    }
	}
    }
    return {port: port || 8080, sites: sites};
}

loadConfig("./src/thinConfig.json");
