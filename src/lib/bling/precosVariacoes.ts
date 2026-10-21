/**
 * Preço de cada variação pelas regras do Alexandre (21/10/2026):
 *   - Ecobag: Mini R$ 40 · Grande R$ 55
 *   - Matraca Kambada Mini: R$ 110 sem suporte · R$ 145 com suporte (110 + 35)
 *   - Matraca Kambada Grande: R$ 145 sem suporte · R$ 190 suporte reto · R$ 195 Leque Bordado
 *     ou Topo Boi Preto (corte diferenciado — Alexandre, 21/10/2026, tarde)
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
  if (/^matraca kambada grande$/i.test(nomePai)) {
    if (semSuporte) return 145;
    if (/leque|topo/.test(a)) return 195;
    return comAlgumSuporte ? 190 : null;
  }
  if (/^matraca kambada mini$/i.test(nomePai)) return semSuporte ? 110 : comAlgumSuporte ? 145 : null;
  return null;
}
