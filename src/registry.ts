import {Site} from "./server.js";

const siteRegistry: Map<string, Site> = new Map();

export function registerSite(site: Site){
    const k = typeof site.name === "string" ? site.name : site.name.toString();
    siteRegistry.set(k, site);
}

export function retrieveSite(sitename: string): Site | null{
    return siteRegistry.get(sitename) || null;
}
