(function(){
  'use strict';
  const T = window.DADOS_TEXTOS, U = window.Telas, E = window.Estado;
  const app = document.getElementById('app'), nav = document.getElementById('nav');
  const modal = document.getElementById('modal'), toastEl = document.getElementById('toast');
  let deferredPrompt = null, installDismissed = false, lastRoute = null, toastTimer;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  window.AppPWA = {ocultar: () => installDismissed || standalone()};
  function toast(message) {
    toastEl.textContent = message; toastEl.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>toastEl.classList.remove('on'),3000);
  }
  function updateStorage() {
    const el = document.getElementById('aviso-armazenamento');
    el.textContent = T.progresso.storage; el.hidden = !E.obter().confirmou21 || E.armazenamentoOK();
  }
  function render() {
    const state = E.obter();
    let route = location.hash.slice(1) || 'inicio', content, active = route;
    if (!state.confirmou21) { content = U.gate(); active = ''; }
    else {
      if (state.plano !== 'premium' && /^bonus-/.test(route)) { location.replace('#bonus'); return; }
      switch (route) {
        case 'inicio': content=U.home(); break;
        case 'guia': content=U.guide(); break;
        case 'receitas': content=U.recipeScreen(); break;
        case 'calculadora': content=U.calculator(); break;
        case 'bonus': content=U.bonus(); break;
        case 'progresso': content=U.progress(); active='inicio'; break;
        default:
          if (route.startsWith('receita/')) { content=U.recipe(route.slice(8)); active='receitas'; }
          else if (/^bonus-[123]$/.test(route)) { content=U.bonusDetail(route); active='bonus'; }
          else { location.replace('#inicio'); return; }
      }
    }
    const changed = lastRoute !== route || !state.confirmou21;
    app.innerHTML = '<div class="'+(changed?'view':'')+'">'+content+U.footer()+'</div>';
    app.classList.toggle('sem-nav',!state.confirmou21);
    nav.hidden = !state.confirmou21;
    nav.setAttribute('aria-label',T.nav.aria);
    nav.innerHTML = state.confirmou21 ? U.nav() : '';
    nav.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===active)a.setAttribute('aria-current','page');});
    app.querySelectorAll('[data-recipe-image]').forEach(img=>{
      img.addEventListener('error',()=>img.remove(),{once:true});
      if (img.complete && !img.naturalWidth) img.remove();
    });
    if (changed) { window.scrollTo(0,0); app.focus({preventScroll:true}); }
    lastRoute = route;
    updateStorage();
  }
  function dialog(title,text,onConfirm) {
    const previous = document.activeElement;
    modal.innerHTML = '<h2 id="modal-titulo">'+U.esc(title)+'</h2><p class="mt">'+U.esc(text)+'</p><div class="btns">'+(onConfirm?'<button class="btn block" id="modal-confirm">'+U.esc(T.botoes.confirmar)+'</button>':'')+'<button class="btn ghost block" id="modal-close" autofocus>'+U.esc(onConfirm?T.botoes.cancelar:T.botoes.fechar)+'</button></div>';
    document.getElementById('modal-close').onclick=()=>modal.close();
    if (onConfirm) document.getElementById('modal-confirm').onclick=()=>{modal.close();onConfirm();};
    modal.addEventListener('close',()=>{if(previous?.isConnected)previous.focus();},{once:true});
    modal.showModal();
  }
  async function install() {
    if (deferredPrompt) {
      const event = deferredPrompt; deferredPrompt = null;
      try { await event.prompt(); await event.userChoice; installDismissed = true; render(); }
      catch (_) { dialog(T.pwa.titulo,T.pwa.instrucao+' '+T.pwa.requisito); }
    } else dialog(T.pwa.titulo,T.pwa.instrucao+' '+T.pwa.requisito);
  }
  function exportProgress() {
    try {
      const url = URL.createObjectURL(new Blob([E.exportar()],{type:'application/json;charset=utf-8'}));
      const a = document.createElement('a'); a.href=url;
      a.download=T.progresso.arquivo+'-'+new Date().toISOString().slice(0,10)+'.json';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000);toast(T.progresso.exportado);
    } catch (_) { toast(T.progresso.erroExportar); }
  }
  document.addEventListener('click',event=>{
    const button = event.target.closest('[data-acao]');
    if (!button || !E.obter().confirmou21) return;
    switch(button.dataset.acao) {
      case 'instalar': install();break;
      case 'exportar': exportProgress();break;
      case 'zerar': dialog(T.progresso.confirmarZerar,T.progresso.textoZerar,()=>{E.zerar();render();toast(T.progresso.zerado);});break;
      case 'feita': E.alternar(button.dataset.id);render();toast(T.progresso.salvo);break;
    }
  });
  document.addEventListener('submit',event=>{
    if (event.target.id==='gate-form') {
      event.preventDefault();
      if(document.getElementById('aceite').checked){E.confirmar21();lastRoute=null;render();}
    }
    if(event.target.id==='calc-form' && E.obter().confirmou21) {
      event.preventDefault();
      const data = new FormData(event.target);
      Object.keys(U.calcValues).forEach(k=>U.calcValues[k]=String(data.get(k)));
      const resultEl = document.getElementById('calc-resultado');
      try {
        const result = window.CalculadoraDose.calcularDose({gramas:Number(data.get('gramas')),thca:Number(data.get('thca')),thc:Number(data.get('thc')),eficiencia:Number(data.get('eficiencia'))/100,porcoes:Number(data.get('porcoes')),gordura:data.get('gordura')===''?null:Number(data.get('gordura'))});
        resultEl.innerHTML=U.calcResult(result);
      } catch (_) {resultEl.innerHTML='<p class="aviso erro" role="alert">'+U.esc(T.calculadora.erro)+'</p>';}
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='busca'){U.filter.q=event.target.value;document.getElementById('lista-receitas').innerHTML=U.recipeList();}
  });
  document.addEventListener('change',async event=>{
    const input=event.target;
    if(input.id==='aceite')document.getElementById('gate-submit').disabled=!input.checked;
    if(['categoria','eletrodomestico'].includes(input.id)){U.filter[input.id]=input.value;document.getElementById('lista-receitas').innerHTML=U.recipeList();}
    if(input.id==='import-file' && E.obter().confirmou21 && input.files[0]){
      try {
        if(input.files[0].size>1000000)throw new Error('INVALID_BACKUP');
        const value=E.validarImportacao(await input.files[0].text());
        dialog(T.progresso.confirmarImportacao,T.progresso.textoImportacao,()=>{E.importar(value);lastRoute=null;render();toast(T.progresso.importado);});
      }catch(_){toast(T.progresso.invalido);}
      input.value='';
    }
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;if(E.obter().confirmou21)render();});
  window.addEventListener('appinstalled',()=>{installDismissed=true;deferredPrompt=null;render();});
  matchMedia('(display-mode: standalone)').addEventListener('change',()=>render());
  window.addEventListener('hashchange',render);
  if('serviceWorker' in navigator && ['http:','https:'].includes(location.protocol)){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  render();
})();
