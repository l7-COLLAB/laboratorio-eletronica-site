"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const Core=require("./progresso-sync-core.js");

const key="laboratorio-eletronica:trilha:v1";
const progress=(passed=[])=>JSON.stringify({passed,reviews:{},attempts:{},drafts:{},minutes:15,lastGoal:null});
function remoteState(initial=progress(["M03"])) {
 const stored=new Map([[key,{key,value:initial,revision:1,updated_at:"2026-11-15T12:08:58Z"}]]);
 const calls={login:0,push:0};
 return {stored,calls,async fetch(url,options={}) {
   const path=new URL(url).pathname;
   if(path==="/auth/login") {
     const input=JSON.parse(options.body);
     calls.login++;
     if(input.username!=="fixture"||input.password!=="test-password") return Response.json({error:"Usuário ou senha incorretos."},{status:401});
     return Response.json({token:"x".repeat(43)});
   }
   if(path==="/auth/logout") return Response.json({ok:true});
   if(options.headers?.Authorization!=="Bearer "+"x".repeat(43)) return Response.json({error:"Sessão expirada"},{status:401});
   if(path==="/state" && !options.method) return Response.json({entries:[...stored.values()]});
   if(path==="/state" && options.method==="PUT"){
     calls.push++;
     const input=JSON.parse(options.body),old=stored.get(input.key);
     if((old?.revision??0)!==input.revision) return Response.json({current:old},{status:409});
     const entry={key:input.key,value:input.value,revision:input.revision+1,updated_at:new Date().toISOString()};
     stored.set(entry.key,entry);
     return Response.json({entry});
   }
   return Response.json({error:"not found"},{status:404});
 }};
}
function launch(server,{hash="",local={},token=""}={}) {
 const map=new Map(Object.entries(local));
 if(token)map.set("laboratorio-eletronica:nuvem:codigo:v1",token);
 const elements=new Map(),listeners=new Map(),windowListeners=new Map();
 const makeNode=id=>{
   const events={};
   return {
     id,hidden:false,textContent:"",value:"",handlers:events,
     addEventListener(type,handler){events[type]=handler},
     append(){},replaceChildren(){},
     querySelector(selector){
       if(selector==="[name=\"username\"]")return {value:"fixture"};
       if(selector==="[name=\"password\"]")return {value:"test-password"};
       if(selector==="[name=\"confirm\"]")return {value:"test-password"};
       if(selector==="button[type=\"submit\"]")return {disabled:false};
       return {value:"",focus(){}};
     }, reset(){},
   };
 };
 const get=id=>{
   if(!elements.has(id))elements.set(id,makeNode(id));
   return elements.get(id);
 };
 const location={hash};
 const win={
   history:{replaceState(_state,_title,fragment){location.hash=fragment}},
   addEventListener(type,handler){windowListeners.set(type,handler)},
   dispatchEvent(event){windowListeners.get(event.type)?.(event)}
 };
 const document={
   addEventListener(type,handler){listeners.set(type,handler)},
   getElementById:get
 };
 const context={
   window:win,document,location,
   localStorage:{
     getItem:k=>map.get(k)??null,
     setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)
   },
   crypto:webcrypto,URLSearchParams,Response,AbortSignal,
   noteCategories:[],noteKey:category=>category,CalcHistory:{
     KEY:"laboratorio-eletronica:calculadora:v1",merge:(a,b)=>({...a,...b})
   },
   StudyProgressSync:Core,
   CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},
   fetch:server.fetch.bind(server),
   get,element:(_tag,text)=>({textContent:text||"",append(){},addEventListener(){},replaceChildren(){},setAttribute(){}}),
   setTimeout:()=>0,clearTimeout(){},console,
 };
 vm.runInNewContext(fs.readFileSync("nuvem.js","utf8"),context);
 listeners.get("DOMContentLoaded")();
 return {context,window:win,local:map,get,async login() {
   const form=get("nuvem-login");await form.handlers.submit({preventDefault(){},currentTarget:form});
 },async logout(){await get("nuvem-sair").handlers.click()}, };
}
test("convite antigo nunca esconde login; primeiro acesso só abre se solicitado",()=>{
 const server=remoteState(),app=launch(server,{hash:"#configurar="+"a".repeat(43)});
 assert.equal(app.get("nuvem-login").hidden,false);
 assert.equal(app.get("nuvem-criar").hidden,true);
 assert.equal(app.get("nuvem-mostrar-criar").hidden,false);
 app.get("nuvem-mostrar-criar").handlers.click();
 assert.equal(app.get("nuvem-criar").hidden,false);
 app.get("nuvem-voltar-login").handlers.click();
 assert.equal(app.get("nuvem-login").hidden,false);
});
test("login após instalar no iPhone recupera o M03 da nuvem",async()=>{
 const server=remoteState(),app=launch(server);
 assert.equal(app.get("nuvem-login").hidden,false);
 await app.login();
 assert.equal(server.calls.login,1);
 assert.deepEqual(JSON.parse(app.local.get(key)).passed,["M03"]);
 assert.equal(app.get("nuvem-conectado").hidden,false);
 assert.equal(app.get("nuvem-acesso").hidden,true);
 assert.equal(app.get("nuvem-status").textContent,"Tudo sincronizado com a nuvem.");
});
test("Safari + tela inicial conservam os dois módulos ao entrar com a mesma conta",async()=>{
 const server=remoteState();
 const app=launch(server,{local:{[key]:progress(["M04"])}});
 await app.login();
 const saved=JSON.parse(server.stored.get(key).value);
 assert.deepEqual(new Set(saved.passed),new Set(["M03","M04"]));
 assert.ok(server.calls.push>=1);
 assert.deepEqual(new Set(JSON.parse(app.local.get(key)).passed),new Set(["M03","M04"]));
});
test("sair da conta mostra login novamente sem apagar progresso local ou remoto",async()=>{
 const server=remoteState();
 const app=launch(server);
 await app.login();
 await app.logout();
 assert.equal(app.get("nuvem-login").hidden,false);
 assert.equal(app.get("nuvem-criar").hidden,true);
 assert.equal(app.get("nuvem-acesso").hidden,false);
 assert.equal(app.local.has("laboratorio-eletronica:nuvem:codigo:v1"),false);
 assert.deepEqual(JSON.parse(app.local.get(key)).passed,["M03"]);
 assert.deepEqual(JSON.parse(server.stored.get(key).value).passed,["M03"]);
});
