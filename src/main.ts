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

  em questao do proprio codigo, ele começa executando com um parse da configuraçao, para registrar as rotas,
  e verbos, assim como uma serie de açoes padrão. depois disso, registra os hooks determinados nos modulos.
  apos isso ele inicia os binds e as mudanças dinamicas de configuraçao. 
*/ 
//TODO: montar isso aqui com um esquema de uniao de tipos, para criar um
//objeto incrimental

//TODO: trocar isso aqui de lugar, isso aqui inicia o servidor mas nao é a funçao main
type body = string;
type headers = Map<string, string>;

import http from "http";

const server = http.createServer();

function serverBind(port: number){
    server.on("request", async function(request, response){
	let body = "";
	//STUB
	let reqObj = {body: ""};
	request.on("data", function(data){
	    body += data.toString();
	});
	request.on("close", function(){
	    reqObj.body = body;
	});
	request.once("end", function(){
	    routeHandler(request, response);
	});
    });
    server.listen(port);
}

serverBind(3030);

//STUB
declare function routeHandler(arg1: {}, arg2: {}):void;
