/**
 * Preço de cada variação pelas regras do Alexandre (21/10/2026):
 *   - Ecobag: Mini R$ 40 · Grande R$ 55
 *   - Matraca Kambada Mini: R$ 110 sem suporte · R$ 145 com suporte (110 + 35)
 *   - Matraca Kambada Grande: R$ 145 sem suporte · R$ 190 com qualquer suporte (145 + 45)
 * Devolve null quando a regra não se aplica (o preço fica como está).
 */
export function precoDaRegra(nomePai: string, atributos: string): number | null {
  const a = atributos.toLowerCase();
  if (/^ecobag/i.test(nomePai)) {
    if (/grande/.test(a)) return 55;
    if (/mini/.test(a)) return 40;
    return null;
  }
  const semSuporte = /sem suporte/.test(a);
  const comAlgumSuporte = /suporte:/.test(a) && !semSuporte;
  if (/^matraca kambada grande$/i.test(nomePai)) return semSuporte ? 145 : comAlgumSuporte ? 190 : null;
  if (/^matraca kambada mini$/i.test(nomePai)) return semSuporte ? 110 : comAlgumSuporte ? 145 : null;
  return null;
}
