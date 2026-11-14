(function(root){
  'use strict';
  const T = root.DADOS_TEXTOS;
  const G = root.DADOS_GUIA;
  const B = root.DADOS_BONUS.bonus;
  const C = root.DADOS_CALCULADORA;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toLocaleString(T.idioma, {minimumFractionDigits:1, maximumFractionDigits:1});
  const template = (s, values) => String(s).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const paths = {
    inicio:'<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
    receitas:'<path d="M3 11h18a9 9 0 0 1-18 0M9 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>',
    calculadora:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m6 0h1M8 15h1m6 0h1M8 19h1m6 0h1"/>',
    guia:'<path d="M4 6a3 3 0 0 1 3-3h13v15H7a3 3 0 0 0-3 3V6Zm0 0v15M8 7h8M8 11h6"/>',
    bonus:'<path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C2 8 6-1 12 8Zm0 0c10 0 6-9 0 0Z"/>',
    progresso:'<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="10"/>',
    seta:'<path d="m9 5 7 7-7 7"/>',
    voltar:'<path d="m15 5-7 7 7 7"/>'
  };
  const ico = name => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.receitas) + '</svg>';
  const recipes = () => Array.isArray(root.DADOS_RECEITAS) ? root.DADOS_RECEITAS : [];
  const list = (items, ordered = false) => '<' + (ordered?'ol':'ul') + ' class="lista">' + (items || []).map(s => '<li>' + esc(s) + '</li>').join('') + '</' + (ordered?'ol':'ul') + '>';
  const paras = items => (items || []).map(s => '<p>' + esc(s) + '</p>').join('');
  const title = text => '<h1>' + esc(text) + '</h1>';
  const footer = () => '<footer class="rodape">' + esc(T.avisoLegal) + '</footer>';
  const back = (route = 'inicio') => '<a class="voltar" href="#' + esc(route) + '">' + ico('voltar') + esc(T.botoes.voltar) + '</a>';
  const action = (name, label, cls = '') => '<button type="button" class="btn ' + cls + '" data-acao="' + name + '">' + esc(label) + '</button>';
  const top = () => '<header class="topo"><a class="marca" href="#inicio">' + esc(T.nome) + '</a><span class="plano">' + esc(T.planos[root.Estado.obter().plano]) + '</span></header>';
  const install = () => '<div class="install"' + (root.AppPWA && root.AppPWA.ocultar() ? ' hidden' : '') + '>' + action('instalar',T.pwa.botao,'block ghost') + '</div>';
  function safeURL(value, kind) {
    const s = String(value || '');
    const pattern = kind === 'pdf' ? /^\.\.\/pdf\/[a-z0-9-]+\.pdf$/ : /^img\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g)$/;
    return pattern.test(s) && !s.includes('/../') ? esc(s) : '';
  }
  function pdfLink(path, label) {
    const href = safeURL(path, 'pdf');
    return href ? '<a class="btn ghost block" href="' + href + '" target="_blank" rel="noopener">' + esc(label) + '</a>' : '';
  }
  function table(data) {
    if (!data) return '';
    return '<div class="table-wrap"><table><thead><tr>' + (data.cabecalhos || []).map(s=>'<th scope="col">'+esc(s)+'</th>').join('') + '</tr></thead><tbody>' + (data.linhas || []).map(row=>'<tr>'+row.map((s,i)=>'<td data-label="'+esc((data.cabecalhos || [])[i])+'">'+esc(s)+'</td>').join('')+'</tr>').join('') + '</tbody></table></div>';
  }
  function section(s) {
    return paras(s.paragrafos) + (s.itens && s.itens.length ? list(s.itens) : '') + table(s.tabela);
  }
  function accordion(sections) {
    const content = sections.filter(s => s.paragrafos?.length || s.itens?.length || s.tabela?.linhas?.length);
    return content.length ? '<div class="card faq">' + content.map(s => '<details id="' + esc(s.id) + '"><summary>' + esc(s.titulo) + ico('seta') + '</summary><div>' + guideSection(s) + '</div></details>').join('') + '</div>' : '';
  }
  function gate() {
    return '<section class="gate"><img class="gate-logo" src="icons/icon-192.png" alt="" width="80" height="80"><p class="kicker">' + esc(T.gate.subtitulo) + '</p>' + title(T.gate.titulo) + '<form id="gate-form"><label class="aceite"><input id="aceite" type="checkbox" required><span>' + esc(T.gate.aceite) + '</span></label><div class="btns"><button class="btn block" id="gate-submit" type="submit" disabled>' + esc(T.gate.entrar) + '</button></div></form></section>';
  }
  function home() {
    const cards = ['receitas','calculadora','guia','bonus'].filter(k => k !== 'bonus' || root.Estado.obter().plano === 'premium');
    return top() + install() + '<section class="hero"><p class="kicker">' + esc(T.inicio.kicker) + '</p>' + title(T.inicio.titulo) + '<p class="mt">' + esc(G.introducao) + '</p><p class="mt muted">' + esc(G.subtitulo) + '</p></section><div class="grid">' + cards.map(k => '<a class="card atalho" href="#'+k+'">'+ico(k)+'<span><strong>'+esc(T.inicio[k])+'</strong></span><span class="seta">'+ico('seta')+'</span></a>').join('') + '</div><div class="btns"><a class="btn ghost block" href="#progresso">' + ico('progresso') + esc(T.inicio.progresso) + '</a></div>';
  }
  function guide() {
    const read = root.Estado.obter().lidos, total = G.secoes.length;
    const count = G.secoes.filter(s => read.includes(s.id)).length;
    const summary = template(T.guia.progresso,{lidos:count,total});
    return top() + '<div class="guide-cover"><div class="image-fallback cover-fallback">'+ico('guia')+'<strong>'+esc(G.titulo)+'</strong></div><img src="'+safeURL('img/capas/capa-guia.webp','image')+'" alt="'+esc(G.titulo)+'" data-cover-image></div>' + title(G.titulo) + '<p class="muted mt">' + esc(G.subtitulo) + '</p><div class="card"><p data-guide-progress>'+esc(summary)+'</p><div class="barra" data-guide-bar role="progressbar" aria-label="'+esc(summary)+'" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+count+'"><span style="transform:scaleX('+(total?count/total:0)+')"></span></div></div><nav class="card guide-index" aria-label="'+esc(T.guia.indice)+'"><h2>'+esc(T.guia.indice)+'</h2><ol>'+G.secoes.map((s,i)=>'<li><a href="#cap-'+(i+1)+'">'+esc(s.titulo)+'</a></li>').join('')+'</ol></nav>'+G.secoes.map((s,i)=>'<section class="card chapter" id="cap-'+(i+1)+'"><h2 id="'+esc(s.id)+'"><span class="chapter-number" aria-hidden="true">'+(i+1)+'</span>'+esc(s.titulo)+'</h2>'+guideSection(s)+'<div class="btns"><button type="button" class="btn ghost block" data-acao="lido" data-id="'+esc(s.id)+'" aria-pressed="'+read.includes(s.id)+'">'+esc(read.includes(s.id)?T.guia.lidoOk:T.guia.lido)+'</button></div></section>').join('')+'<div class="btns">'+(G.pdfDisponivel?pdfLink(G.pdf,T.botoes.guiaPdf):'')+'</div>';
  }
  function guideText(value, tag) {
    const text = String(value), keys = ['atencao','dica','conta'];
    const key = keys.find(k => text.startsWith(T.guia[k]+':'));
    return '<'+tag+(key?' class="guide-callout '+key+'"':'')+'>'+(key?'<strong>'+esc(T.guia[key])+':</strong> '+esc(text.slice(T.guia[key].length+1).trim()):esc(text))+'</'+tag+'>';
  }
  function guideSection(s) {
    return (s.paragrafos || []).map(p=>guideText(p,'p')).join('')+(s.itens?.length?'<ul class="lista">'+s.itens.map(p=>guideText(p,'li')).join('')+'</ul>':'')+table(s.tabela);
  }
  const categoryPaths = [
    '<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/>',
    '<path d="M3 12h18v9H3zM3 16c3 3 3-3 6 0s3-3 6 0 3-3 6 0M7 12V8h10v4M12 8V5m0-3v1"/>',
    '<path d="M21 12a4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 1 0 10 10Z"/><path d="M7 8h.01M7 15h.01M12 18h.01M12 11h.01"/>',
    '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 11 8 16 5-5 13-11 8-16Z"/>',
    '<path d="M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm14 1h2a3 3 0 0 1 0 6h-2M7 2v3m6-3v3"/>',
    '<path d="m5 6 2 15h10l2-15H5Zm0 5h14M13 6l2-4h5"/>',
    '<path d="m3 21 8-18c5 1 9 5 10 10L3 21Zm7-15c4 1 7 4 8 8M9 14h.01M13 12h.01"/>',
    '<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4M18 19l-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1"/>',
    '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>'
  ];
  function recipeImage(r, cls) {
    const path = categoryPaths[T.categorias.indexOf(r.categoria)] || paths.receitas;
    const image = safeURL(r.imagem,'image');
    return '<div class="'+cls+'"><div class="image-fallback" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24">'+path+'</svg></div>'+(image?'<img src="'+image+'" alt="'+esc(r.nome)+'" loading="lazy" data-recipe-image>':'')+'</div>';
  }
  const filter = {q:'',categoria:'',eletrodomestico:''};
  const option = (v, label, selected) => '<option value="'+esc(v)+'"'+(selected?' selected':'')+'>'+esc(label)+'</option>';
  function filters() {
    return '<div class="filters"><label class="field">'+esc(T.receitas.busca)+'<input type="search" id="busca" placeholder="'+esc(T.receitas.placeholder)+'" value="'+esc(filter.q)+'"></label><label class="field">'+esc(T.receitas.categoria)+'<select id="categoria">'+option('',T.receitas.todas,!filter.categoria)+T.categorias.map(s=>option(s,s,filter.categoria===s)).join('')+'</select></label><label class="field">'+esc(T.receitas.eletrodomestico)+'<select id="eletrodomestico">'+option('',T.receitas.todos,!filter.eletrodomestico)+T.eletrodomesticos.map(s=>option(s,s,filter.eletrodomestico===s)).join('')+'</select></label></div>';
  }
  const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function recipeCard(r) {
    return '<a class="card recipe-card" href="#receita/'+encodeURIComponent(r.id)+'">'+recipeImage(r,'recipe-thumb')+'<div class="recipe-info"><h2>'+esc(r.nome)+'</h2><p>'+esc(r.categoria)+' · '+esc(r.tempoPreparo)+'</p><span class="pill">'+esc(T.intensidades[r.perfil?.intensidade] || '')+'</span></div></a>';
  }
  function recipeList() {
    if (!recipes().length) return '<div class="vazio">'+ico('receitas')+'<p>'+esc(T.receitas.vazio)+'</p></div>';
    const result = recipes().filter(r => (!filter.categoria || r.categoria === filter.categoria) && (!filter.eletrodomestico || r.eletrodomestico === filter.eletrodomestico) && normalize(r.nome+' '+(r.ingredientes || []).join(' ')).includes(normalize(filter.q)));
    return result.length ? result.map(recipeCard).join('') : '<p class="vazio">'+esc(T.receitas.nenhuma)+'</p>';
  }
  function recipeScreen() { return top()+title(T.nav.receitas)+filters()+'<div class="recipe-download">'+pdfLink('../pdf/receitas-completo.pdf',T.receitas.baixarTodas)+'</div><div id="lista-receitas" aria-live="polite">'+recipeList()+'</div>'; }
  const fact = (label,value) => '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';
  function recipe(id) {
    const r = recipes().find(r=>r.id === id);
    if (!r) return top()+back('receitas')+title(T.receitas.naoEncontrada);
    const d = r.dose || {}, p = r.perfil || {};
    const done = root.Estado.obter().feitas.includes(r.id);
    return top()+back('receitas')+title(r.nome)+'<p class="muted mt">'+esc(r.subtitulo)+'</p>'+recipeImage(r,'foto')+'<dl class="fatos">'+fact(T.receitas.preparo,r.tempoPreparo)+fact(T.receitas.forno,r.tempoForno)+fact(T.receitas.rendimento,r.rendimento)+fact(T.receitas.eletrodomestico,r.eletrodomestico)+'</dl><section class="card"><h2>'+esc(T.receitas.ingredientes)+'</h2>'+list(r.ingredientes)+'</section><section class="card"><h2>'+esc(T.receitas.passos)+'</h2>'+list(r.passos,true)+'</section><section class="card"><h2>'+esc(T.receitas.sabor)+'</h2><p>'+esc(r.dicaSabor)+'</p><h3 class="mt">'+esc(T.receitas.armazenamento)+'</h3><p>'+esc(r.armazenamento)+'</p></section><section class="card"><h2>'+esc(T.receitas.dose)+'</h2><p class="dose-num">'+fmt(d.mgPorPorcao)+'</p><p>'+esc(T.receitas.unidadeDose)+'</p><p class="muted mt">'+fmt(d.mgTotais)+' '+esc(T.receitas.total)+'</p><p class="mt peq">'+esc(T.receitas.referencia)+'</p><p class="muted peq">'+esc(template(T.receitas.referenciaValores,{thca:fmt(d.thcaPct),thc:fmt(d.thcPct),eficiencia:Number(d.eficiencia).toLocaleString(T.idioma,{minimumFractionDigits:2})}))+'</p><p class="conta mt">'+esc(d.conta)+'</p></section><section class="card"><h2>'+esc(T.receitas.perfil)+'</h2><dl class="fatos">'+fact(T.receitas.intensidade,T.intensidades[p.intensidade])+fact(T.receitas.inicio,p.inicio)+fact(T.receitas.duracao,p.duracao)+fact(T.receitas.quandoCombina,p.quandoCombina)+'</dl></section><aside class="aviso"><strong>'+esc(T.receitas.seguranca)+'</strong><p>'+esc(r.dicaSeguranca)+'</p></aside><div class="btns">'+pdfLink(r.pdf,T.botoes.pdf)+'<button class="btn block" data-acao="feita" data-id="'+esc(r.id)+'" aria-pressed="'+done+'">'+esc(done?T.botoes.desmarcar:T.botoes.feita)+'</button></div>';
  }
  const calcValues = {gramas:'',thca:C.thcaPadrao,thc:C.thcPadrao,eficiencia:C.eficienciaPadrao,porcoes:'',gordura:''};
  const calcUnits = {gramas:'g',thca:'%',thc:'%',eficiencia:'%',porcoes:'',gordura:'g'};
  function calcField(k) {
    const min = ['gramas','gordura'].includes(k)?'0.000001':k==='porcoes'?'1':'0';
    const max = k==='eficiencia'?' max="100"':'';
    const unit = calcUnits[k];
    return '<label class="field" for="calc-'+k+'">'+esc(T.calculadora[k])+'<span class="inp"><input id="calc-'+k+'" name="'+k+'" type="number" inputmode="'+(k==='porcoes'?'numeric':'decimal')+'" min="'+min+'"'+max+' step="'+(k==='porcoes'?'1':'any')+'" value="'+esc(calcValues[k])+'"'+(k==='gordura'?'':' required')+'>'+(unit?'<em>'+unit+'</em>':'')+'</span></label>';
  }
  function calcStep(n, keys) {
    return '<fieldset class="passo"><legend><span class="n">'+n+'</span>'+esc(T.calculadora['passo'+n])+'</legend><p class="muted">'+esc(T.calculadora['passo'+n+'Ajuda'])+'</p><div class="form-grid">'+keys.map(calcField).join('')+'</div></fieldset>';
  }
  function calculator() {
    return top()+title(T.calculadora.titulo)+'<p class="muted mt">'+esc(T.calculadora.intro)+'</p><form id="calc-form">'+calcStep(1,['gramas','thca','thc'])+calcStep(2,['porcoes','gordura'])+calcStep(3,['eficiencia'])+'<div class="btns"><button type="submit" class="btn block">'+esc(T.botoes.calcular)+'</button>'+action('exemplo',T.calculadora.exemplo,'block ghost')+'</div><p class="muted peq mt">'+esc(T.calculadora.exemploNota)+'</p></form><div id="calc-resultado" aria-live="polite"></div>';
  }
  function calcResult(result) {
    const lvl = result.intensidade, pct = Math.min(100, result.mgPorPorcao/15*100);
    return '<section class="card resultado"><h2>'+esc(T.calculadora.resultado)+'</h2><p class="dose-num">'+fmt(result.mgPorPorcao)+' <small>mg</small></p><p>'+esc(T.calculadora.porPorcao)+'</p><p><span class="pill nivel-'+lvl+'">'+esc(T.intensidades[lvl])+'</span></p><div class="medidor" role="img" aria-label="'+esc(T.calculadora.escala)+'"><span style="left:'+pct.toFixed(1)+'%"></span></div><p class="escala"><span>0</span><span>5</span><span>10</span><span>15+ mg</span></p><p class="leitura">'+esc(T.calculadora.leitura[lvl])+'</p>'+(result.alerta?'<p class="aviso erro" role="alert">'+esc(T.calculadora.alerta)+'</p>':'')+'<dl class="fatos">'+fact(T.calculadora.total,fmt(result.mgTotais))+(result.mgPorGrama==null?'':fact(T.calculadora.por100g,fmt(result.mgPorGrama*100)))+'</dl><h3 class="mt">'+esc(T.calculadora.conta)+'</h3>'+list(result.passos.map(p=>template(T.calculadora.passos[p.chave],p.valores)),true)+'<p class="aviso">'+esc(T.calculadora.estimativa)+'</p></section>';
  }
  function bonus() {
    const premium = root.Estado.obter().plano==='premium';
    return top()+install()+title(T.bonus.titulo)+(premium?B.map(b=>'<section class="card"><h2>'+esc(b.titulo)+'</h2><p class="muted">'+esc(b.resumo)+'</p><div class="btns"><a class="btn block" href="#'+b.id+'">'+esc(T.botoes.ler)+'</a>'+(b.pdfDisponivel?pdfLink(b.pdf,T.botoes.pdf):'')+'</div></section>').join(''):'<p class="aviso">'+esc(T.bonus.bloqueado)+'</p>');
  }
  function bonusDetail(id) {
    const b = B.find(b=>b.id===id);
    if (!b) return top()+back('bonus')+title(T.bonus.naoEncontrado);
    return top()+back('bonus')+title(b.titulo)+'<p class="muted mt">'+esc(b.resumo)+'</p>'+(id==='bonus-1'?'<div class="btns"><a class="btn block" href="#calculadora">'+esc(T.nav.calculadora)+'</a></div>':'')+accordion(b.secoes)+(b.pdfDisponivel?'<div class="btns">'+pdfLink(b.pdf,T.botoes.pdf)+'</div>':'');
  }
  function progress() {
    const all = recipes(), ids = root.Estado.obter().feitas, done = all.filter(r=>ids.includes(r.id));
    const summary = template(T.progresso.resumo,{feitas:done.length,total:all.length});
    return top()+install()+title(T.progresso.titulo)+'<div class="card"><p>'+esc(summary)+'</p><div class="barra" role="progressbar" aria-label="'+esc(T.progresso.titulo)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+(all.length?Math.round(done.length/all.length*100):0)+'"><span style="transform:scaleX('+(all.length?done.length/all.length:0)+')"></span></div></div>'+(done.length?done.map(recipeCard).join(''):'<p class="vazio">'+esc(T.progresso.vazio)+'</p>')+'<div class="btns">'+action('exportar',T.botoes.exportar,'block ghost')+'<label class="field">'+esc(T.botoes.importar)+'<input id="import-file" type="file" accept=".json,application/json"></label>'+action('zerar',T.botoes.zerar,'block ghost perigo')+'</div>';
  }
  function nav() {
    return ['inicio','receitas','calculadora','guia','bonus'].map(k=>'<a href="#'+k+'" data-nav="'+k+'">'+ico(k)+'<span>'+esc(T.nav[k])+'</span></a>').join('');
  }
  root.Telas = {esc,fmt,template,footer,gate,home,guide,recipeScreen,recipe,calculator,calcResult,bonus,bonusDetail,progress,nav,filter,recipeList,calcValues};
})(window);
