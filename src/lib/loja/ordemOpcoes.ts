/**
 * Ordem humana das opções de um produto.
 *
 * O Bling devolve as variações em ordem alfabética, e o site mostrava
 * "G · GG · P · XG" e "10 anos · 12 anos · 14 anos · 6 anos · 8 anos"
 * (achado da auditoria de 10/10/2026). Aqui a ordem é a de uma arara:
 * tamanhos do menor para o maior, idades em ordem numérica, cores em ordem
 * alfabética — e, quando o rótulo junta cor e tamanho ("Off White G"), a cor
 * agrupa e o tamanho ordena dentro dela.
 */

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG", "XXG"];

type Partes = { prefixo: string; posicao: number; numero: number };

function partes(rotulo: string): Partes {
  const texto = rotulo.trim();
  const palavras = texto.split(/\s+/);
  const ultima = palavras[palavras.length - 1]?.toUpperCase() ?? "";

  // "6 anos", "14 anos" — idade.
  const idade = texto.match(/^(.*?)\s*(\d+)\s*anos?$/i);
  if (idade) return { prefixo: idade[1].trim().toLowerCase(), posicao: 100, numero: Number(idade[2]) };

  // "G", "Off White GG" — tamanho de roupa no fim.
  const indice = TAMANHOS.indexOf(ultima);
  if (indice >= 0) {
    return { prefixo: palavras.slice(0, -1).join(" ").toLowerCase(), posicao: indice, numero: 0 };
  }

  // "38", "42" — numeração.
  if (/^\d+$/.test(texto)) return { prefixo: "", posicao: 100, numero: Number(texto) };

  // Estampa, cor ou "Único": ordem alfabética entre si, depois dos tamanhos.
  return { prefixo: texto.toLowerCase(), posicao: 200, numero: 0 };
}

export function compararOpcoes(a: string, b: string): number {
  const pa = partes(a);
  const pb = partes(b);
  if (pa.prefixo !== pb.prefixo) return pa.prefixo.localeCompare(pb.prefixo, "pt-BR");
  if (pa.posicao !== pb.posicao) return pa.posicao - pb.posicao;
  if (pa.numero !== pb.numero) return pa.numero - pb.numero;
  return a.localeCompare(b, "pt-BR");
}

export function ordenarRotulos(rotulos: readonly string[]): string[] {
  return [...rotulos].sort(compararOpcoes);
}
