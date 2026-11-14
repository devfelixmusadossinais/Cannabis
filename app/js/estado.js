(function(root){
  'use strict';
  const KEY = 'cozinha-verde-v1';
  const empty = () => ({v:1, confirmou21:false, plano:'premium', feitas:[], lidos:[]});
  let state = empty(), storageOK = true;
  function validate(value) {
    if (!value || value.v !== 1 || typeof value.confirmou21 !== 'boolean' ||
        !['basico','premium'].includes(value.plano) || !Array.isArray(value.feitas) ||
        !value.feitas.every(id => typeof id === 'string' && /^r\d{2,}$/.test(id)) ||
        (value.lidos !== undefined && (!Array.isArray(value.lidos) ||
        !value.lidos.every(id => typeof id === 'string' && /^[a-z0-9-]+$/.test(id))))) throw new Error('INVALID_BACKUP');
    return {v:1, confirmou21:value.confirmou21, plano:value.plano, feitas:[...new Set(value.feitas)], lidos:[...new Set(value.lidos || [])]};
  }
  function save() {
    try { root.localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; }
    catch (_) { storageOK = false; }
  }
  try {
    const raw = root.localStorage.getItem(KEY);
    if (raw) state = validate(JSON.parse(raw));
    root.localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) { storageOK = false; }
  // Presentation preference only. This parameter is NOT payment protection.
  const plan = new URLSearchParams(root.location.search).get('plano');
  if (['basico','premium'].includes(plan)) { state.plano = plan; save(); }
  root.Estado = {
    obter: () => ({...state, feitas:[...state.feitas], lidos:[...state.lidos]}),
    armazenamentoOK: () => storageOK,
    confirmar21() { state.confirmou21 = true; save(); },
    alternar(id) {
      if (!/^r\d{2,}$/.test(id)) return;
      state.feitas = state.feitas.includes(id) ? state.feitas.filter(x => x !== id) : [...state.feitas,id];
      save();
    },
    exportar: () => JSON.stringify(state, null, 2),
    alternarLido(id) {
      if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) return;
      state.lidos = state.lidos.includes(id) ? state.lidos.filter(x => x !== id) : [...state.lidos,id];
      save();
    },
    validarImportacao: text => validate(JSON.parse(text)),
    importar(value) { state = validate(value); save(); },
    zerar() { state.feitas = []; state.lidos = []; save(); }
  };
})(window);
