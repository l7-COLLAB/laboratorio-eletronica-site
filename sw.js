"use strict";
const CACHE = 'laboratorio-shell-20261115-1';
const FILES = ['index.html','estilos.css','plataforma.css','calculadora.css','teclado-matematico.css','desenho.css','geometria.css','catalogo.js','anotacoes.js','historico-core.js','recursos.js','calculadora-core.js','aprendizagem-core.js','progresso-sync-core.js','nuvem.js','portal.js','trilha-dados.js','trilha-progress-core.js','math-editor-core.js','teclado-matematico.js','desenho.js','geometria.js','pratica-numerica.js','trilha.js','plataforma.js','calculadora.js','manifest.webmanifest','icone.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Activate after the previous version's tabs close, never in the middle of an exercise.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('laboratorio-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Never cache authenticated requests, Worker responses, videos or third-party libraries.
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(self.registration.scope.replace(url.origin,'')))return;
  const name=url.pathname.split('/').pop();
  if(event.request.mode!=='navigate'&&!FILES.includes(name)&&!url.pathname.includes('/materiais/'))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const key=event.request.mode==='navigate'?new URL('index.html',self.registration.scope).href:new URL(url.pathname,self.location.origin).href;
    try {
      const response=await fetch(event.request);
      if(response.ok)await cache.put(key,response.clone());return response;
    } catch(error) { const saved=await cache.match(key);if(saved)return saved;throw error; }
  })());
});
