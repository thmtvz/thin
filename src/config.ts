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

//Kind of grammar of sort 🤷🤷
const topLevelConfigProps: string[] = ["port"];
const siteLevelConfigProps: string[] = [];
const verbLevelConfigProps: string[] = [];
const routeLevelConfigProps: string[] = ["handler"];

async function loadConfig(filename: string): Promise<Config>{ //Returns config
    try{
	const fileContents = await fs.readFile(filename);
	const contestingConfig: {[k: string]: any} = JSON.parse(fileContents.toString());

	console.log(contestingConfig);

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

    } catch(e){
	console.error("Failed to read configuration file");
	console.error(e)
    }
}
