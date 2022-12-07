import setup from "./serverSetup.js";
import loadConfig from "./config.js";

(async function main(){
    const config = loadConfig("thinConfig.json");
    setup(config);
})()
