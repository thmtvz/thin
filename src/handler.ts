import fs from "node:fs/promises";
import path from "node:path";
import {HandlerFn} from "./server.js";
import findServer from "./findServer.js";

async function getModules(): Promise<string[] | null> {
    const serverDir = findServer();
    if(!serverDir) return null
    try{
	var modules = await fs.readdir(path.resolve(serverDir, "modules"),
				   {withFileTypes: true});
    } catch(e){
	return null;
    }
    const mods: string[] = [];
    for(let moduleName of modules)
	if(moduleName.name.slice(-3) === ".js")
	    mods.push(moduleName.name);
    return mods.map((m) => path.resolve(serverDir, "modules", m));
}

async function moduleImporter(filename: string): Promise<(t: any, s: any, m: any) => void> {
    let mod = await import(filename);
    if(typeof mod.default === "function") return (t,s,m) => {
	mod.default(t,s,m);
    }
    return (t,s,m) => {};
}
export default async function loadHandler(handlerName: string): Promise<HandlerFn>{
    const modules = await getModules();
    if(modules === null) return (a,b,c) => {};
    const modulesBasename = modules.map((m) => path.basename(m));
    if(modulesBasename.indexOf(handlerName + ".js") === -1)
	return (a,b,c) => {}; 
    return await moduleImporter(modules[modulesBasename.indexOf(handlerName + ".js")]);
}
