(function(root){
  'use strict';
  function calcularDose({gramas, thca, thc, eficiencia, porcoes, gordura}) {
    const values = [gramas, thca, thc, eficiencia, porcoes];
    if (!values.every(v => typeof v === 'number' && Number.isFinite(v)) ||
        gramas <= 0 || thca < 0 || thc < 0 || thca + thc <= 0 ||
        !Number.isInteger(porcoes) || porcoes < 1 || eficiencia < 0 || eficiencia > 1 ||
        (gordura != null && (typeof gordura !== 'number' || !Number.isFinite(gordura) || gordura <= 0))) {
      throw new RangeError('INVALID_INPUT');
    }
    const mgBruto = gramas * 1000 * (thca * 0.877 + thc) / 100;
    const mgTotais = mgBruto * eficiencia;
    const mgPorPorcao = mgTotais / porcoes;
    const mgPorGrama = gordura == null ? null : mgTotais / gordura;
    if (![mgBruto, mgTotais, mgPorPorcao, mgPorGrama ?? 0].every(Number.isFinite)) throw new RangeError('INVALID_INPUT');
    // Full precision for thresholds and subsequent arithmetic; rounding is presentation only.
    const intensidade = mgPorPorcao <= 5 ? 'leve' : mgPorPorcao <= 10 ? 'moderada' : 'forte';
    const f = (n, max = 1) => n.toLocaleString('pt-BR', {maximumFractionDigits:max});
    const f1 = n => n.toLocaleString('pt-BR', {minimumFractionDigits:1, maximumFractionDigits:1});
    // Structured steps keep every translated sentence in data/textos.json.
    const passos = [
      {chave:0, valores:{gramas:f(gramas, 6), massa:f(gramas * 1000, 6)}},
      {chave:1, valores:{thca:f(thca, 6), thc:f(thc, 6), bruto:f1(mgBruto)}},
      {chave:2, valores:{eficiencia:eficiencia.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:6}), total:f1(mgTotais)}},
      {chave:3, valores:{porcoes:f(porcoes), dose:f1(mgPorPorcao)}}
    ];
    return {mgBruto, mgTotais, mgPorPorcao, mgPorGrama, intensidade, alerta:mgPorPorcao > 10, passos};
  }
  root.CalculadoraDose = {calcularDose};
  if (typeof module !== 'undefined') module.exports = {calcularDose};
})(typeof window !== 'undefined' ? window : globalThis);
