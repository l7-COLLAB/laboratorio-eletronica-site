"use strict";
(() => {
  const key = 'laboratorio-eletronica:trilha:v1';
  const title = stage => stage.id + ' · ' + (catalogo.modules.find(m=>m.id===stage.id)?.name ?? 'Desafio integrador '+Number(stage.id.slice(1)));
  function refresh() {
    const p = readLocal(key, {});
    p.passed = TrailProgress.recoverPassed(etapas,p.passed,p.attempts);
    const day = (()=>{const d=new Date();return Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000;})();
    const canOpen = i=>TrailProgress.canOpen(etapas,i);
    const saved = Learning.resume(p.resume,etapas,canOpen);
    const next = etapas[saved?.index ?? TrailProgress.nextRecommended(etapas,p.passed)];
    const count = TrailProgress.completedCount(etapas,p.passed);
    get('home-saudacao').textContent = get('boas-vindas').textContent;
    get('home-aula').textContent = next ? title(next) : 'Trilha guiada concluída';
    get('home-objetivo').textContent = next ? next.goal : 'Continue com as revisões e os projetos práticos.';
    get('home-percentual').textContent = count+' de 24 etapas concluídas · '+Math.round(count/24*100)+'%';
    get('home-barra').value=count;
    get('home-meta').textContent = 'Meta diária: '+([10,15,20].includes(p.minutes)?p.minutes:15)+' minutos.';
    const due=etapas.filter(s=>p.reviews?.[s.id]?.round<3 && p.reviews[s.id].due<=day);
    get('home-revisoes').textContent=due.length+' revisão(ões) pendente(s).';
    const reinforce=etapas.filter(s=>Learning.state(s,p,day)==='Precisa revisar');
    get('home-reforco').replaceChildren(...(reinforce.length?reinforce.slice(0,3).map(s=>{
      const li=element('li');const a=element('button',title(s),'button');a.type='button';a.dataset.studyStage=s.id;li.append(a);return li;
    }):[element('li','Nenhuma dificuldade registrada no momento.')]));
    get('habilidades-lista').replaceChildren(...etapas.map(s=>{
      const row=element('div','','skill-row');row.append(element('span',title(s)),element('small',Learning.state(s,p,day)));return row;
    }));
    const rows=Learning.history(p.history);
    get('tentativas-lista').replaceChildren(...(rows.length?rows.slice().reverse().map(r=>element('li',r.id+' · '+new Date(r.at).toLocaleString('pt-BR')+' · '+(3-r.wrong.length)+'/3'+(r.wrong.length?' · Rever questões '+r.wrong.map(i=>i+1).join(', '):''))):[element('li','Ainda não há novas tentativas nesta versão.')]));
    get('home-continuar').textContent=next?'Continuar estudando':'Abrir revisões';
  }
  get('home-continuar').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('study:resume')));
  const toggle=document.querySelector('.menu-toggle');
  toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));document.querySelector('.menu').classList.toggle('expanded',open);
  });
  document.querySelector('.menu').addEventListener('click',event=>{if(event.target.closest('a')){document.querySelector('.menu').classList.remove('expanded');toggle.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelector('.menu').classList.remove('expanded');toggle.setAttribute('aria-expanded','false');}});
  for(const mode of ['percurso','lista']) get('ver-'+mode).addEventListener('click',()=>{
    get('mapa-trilha').classList.toggle('path-mode',mode==='percurso');
    get('ver-percurso').setAttribute('aria-pressed',String(mode==='percurso'));get('ver-lista').setAttribute('aria-pressed',String(mode==='lista'));
  });
  get('biblioteca-lista').replaceChildren(...catalogo.modules.map(m=>{
    const section=element('section','','library-group');const heading=element('h2',m.id+' · '+m.name);section.append(heading,renderStudyResources('modules',m.id));return section;
  }));
  window.addEventListener('study:updated',refresh);
  window.addEventListener('cloud:applied',refresh);
  window.addEventListener('study:view',refresh);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  refresh();
})();
