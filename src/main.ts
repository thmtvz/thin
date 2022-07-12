/*
  ->receber conexoes
  ->recebe mensagens http
  ->processa o pedido
  ->mapeia e recebe os recussos internos
  ->constroi resposta
  ->manda a resposta
  ->gera log

  tudo no servidor tem a forma de um recurso.
  um recurso pode ser uma funçao, um arquivo, um objeto convertivel para string ou um subprocesso.

  tudo funciona baseado na configuraçao(arquivo)

  uma vez lida a configuraçao, ela é mantida na memoria para o controlador de recurso \
  que pode ser modificado durante o runtime
  

  a configuraçao pode ser escrita como base, e tambem modificada pelo proprio programa(escrita pelo usuario e de forma programatica.), com a capacidade de
  modificar ela durante o runtime

  cada passo do processamento conta com um ou mais hooks para controle fino

  importar modulos dinamicamente

  funcionamento concebido até agora: recebe um pedido, aguarda o pedido ser concluido, quando concluido passa para o dispatch de rotas, que acionam o dado recurso. Durante esse processo, sao executados hooks e sao gerados logs. 
*/ 
import http from "http";

const server = http.createServer();

let totalRequests = 0;

const mod: ((arg0: any) => any)[] = [];
let loaded = await import("./teste.js");
mod.push(loaded.default);

server.on("request", async function(request, response){
    const uri = new URL((request.url || ""), "http://localhost:3000/");
    if(uri.pathname == "/info"){
	response.end(`<h1>Total de pedidos:</h1>\n<p>${totalRequests}</p>`);
	totalRequests++;
	return;
    } else if(uri.pathname === "/mod"){
	response.end(`${mod[0]("jonas")}`);
	console.log(mod);
	return;
    } else if(uri.pathname.slice(0,6) === "/load/"){
	const modname = uri.pathname.slice(5);
	try{
	    var modul = await import("./" + modname + ".js");
	    var l = mod.push(modul.default);
	} catch (e) {
	    console.log(e);
	    response.end("<h1>error</h1>");
	    return;
	}
	response.end(mod[l - 1]("jonas"));
	return;
    }
    console.log("===PEDIDO RECEBIDO===");
    console.log(request);
    response.end("<h1>oi</h1>");
    console.log("===PEDIDO ENVIADO===");
    totalRequests++;
    request.once("close", function(){
	console.log("complete");
	console.log(request.complete);
	return;
    });
});

server.listen(3030);
