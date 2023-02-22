import startServer from "./server.js"

function processArg(arg: string){
    return;
}

(async function main(args){
    for(let arg of args){
	processArg(arg);
    }
    startServer();
})(process.argv)
