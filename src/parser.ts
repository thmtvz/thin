//le a config, e traduz tudo em um objeto com as rotas e opçoes
import http from "http";

type keyValue = {
    key: token;
    value: token | token[];
}

type requestObject = {
    headers: string[];
    body: string;
    url: URL;
    req: http.IncomingMessage;
};

type handlerFn = ((arg: requestObject) => requestObject);

type configObject = {
    port: number;
    hosts: host[];
    defaultNoHost: handlerFn;
}

type host = {
    name: string;
    routes: route[];
    defaultNoRoute: handlerFn;
    hostOptions: {};
}

type route = {
    route: string;
    handler: handlerFn;
    routeOptions: {};
}

type token = {
    line: number;
    value: string;
}

import fs from "fs/promises";

const defaults: configObject = {
    port: 80,
    hosts: [],
    defaultNoHost: stubHandler,
}

async function readFile(filename: string){
    try{
	var file = await fs.readFile(filename);
    } catch(e) {
	console.log(e);
	process.exit(1);
    }
    return file.toString();
}

function parse(content: string, configObj: configObject){
    const tokens = tokenize(content.split("\n"));
    for(let i = 0; i < tokens.length; ++i){
	let value = tokens[i].value;
	let lineNum = tokens[i].line;
	switch(value.toLowerCase()){
	    case "port":
		skipIter();
		if(value === ":"){
		    skipIter();
		    let portNum = parseInt(value);
		    if(isNaN(portNum)){
			parseError(`Invalid value for port "${value}"`, lineNum);
		    } else if(portNum < 0 || portNum > 65555){
			parseError(`Invalid value for port: "${value}"`, lineNum)
		    }
		    configObj.port = portNum;
		    break;
		}
	    case "host":
		let routes: route[] = [];
		let name: string;
		let braceCount = 1;
		let block: token[] = [];
		skipIter();
		value !== "{" ? (name = value) && skipIter() : parseError(`Missing name for host`, lineNum);
		value === "{" ? skipIter() : parseError(`Missing block opening`, lineNum);
		while(braceCount > 0){
		    if(value === "{"){
			braceCount++;
		    }
		    else if(value === "}"){
			braceCount--;
			if(braceCount === 0 && block.length === 0) parseError(`Syntax error`, lineNum);
		    }
		    block.push(tokens[i]);
		    skipIter();
		}
		for(let j = 0;j < block.length; ++j){
		    let routeName = block[j].value;
		    let lineNum = block[j].line;
		    
		}
		console.log(block);
	    case "}":
		break;
	    default:
		parseError(`Unrecognized token: "${value}"`, lineNum);
	}
	function skipIter(){
	    ++i;
	    if(i >= tokens.length) return;
	    value = tokens[i].value;
	    lineNum = tokens[i].line;
	    if(i === tokens.length) parseError("Unexpected end of config", lineNum);
	}
    }

    return configObj;
}
/*
  configuraçoes que eu sei que eu quero até agora:
  port
  hosts
  rotas
  handlers pra cada rota
  default pra cada rota faltante
  
  =======
  SINTAXE DA CONFIGURAÇAO
  config valor
  host {
   config valor
   route {
    config valor
   }
  }
  =======
 */
//console.log(parse(await readFile("Config"), defaults));

function tokenize(lines: string[]){
    let tokens: token[] = [];
    for(let line in lines){
	for(let tok of lines[line].split(" ")){
	    tokens.push({line: parseInt(line) + 1, value: tok}); // array indexing is no line count :)
	}
    }
    return tokens;
}

function parseError(message: string, position: number, errno: number = 1){
    console.log(message, "at line", position);
    process.exit(errno);
}

function stubHandler(arg: requestObject){
    return arg;
}

function newParser(content: string, configObj: configObject){
    const tokens = tokenize(content.split("\n"));
    let st: keyValue[] = [];
    for(let i = 0; i < tokens.length - 1; ++i){
	let key = tokens[i];
	let value: token | token[];
	if(tokens[i + 1].value === "{" && ++i){
	    let braceCount = 1;
	    value = [];
	    while(braceCount > 0){
		let current = tokens[i].value;
		value.push(tokens[i]);
		++i;
		if(current === "{"){
		    braceCount++;
		    break;
		} else if(current === "}"){
		    braceCount--;
		    break;
		} else if(i > tokens.length && braceCount > 0){
		    //TODO: implement error function
		    console.log("Parse Error, unmatching braces");
		    process.exit(1);
		}
	    }
	    st.push({key: key, value: value});
	} else {
	    st.push({key: key, value: tokens[++i]});
	}
	
    }
    console.log(st[1]);
    return configObj;
}
console.log(newParser(await readFile("Config"), defaults));
