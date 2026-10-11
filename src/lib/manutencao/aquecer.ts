/**
 * Aquecimento das páginas de produto.
 *
 * As 63 páginas são geradas sob demanda e revalidadas a cada 10 min. A primeira
 * visita "fria" custava 4 s (Bling em série). Em vez de pré-gerar no build —
 * que congelaria o catálogo e daria 404 em peça nova —, o site visita a si
 * mesmo: ao subir (3 min depois) e a cada rodada de manutenção, pede cada
 * página de produto, categoria e a loja. Quem chega depois encontra tudo pronto.
 */

import { buscarCatalogo } from "../bling/produtos";
import { CATEGORIAS } from "../catalogo";

export type Aquecimento = { paginas: number; ok: number; falhas: number; ms: number };

export async function aquecerPaginas(urlDoSite: string, concorrencia = 3): Promise<Aquecimento> {
  const inicio = Date.now();
  const base = urlDoSite.replace(/\/+$/, "");
  const caminhos = ["/", "/loja", ...CATEGORIAS.map((c) => `/loja/${c.slug}`)];
  try {
    const catalogo = await buscarCatalogo();
    for (const p of catalogo.produtos) if (!p.oculto) caminhos.push(`/loja/${p.categoria}/${p.slug}`);
  } catch {
    // sem catálogo, aquece só as páginas fixas
  }
  let ok = 0;
  let falhas = 0;
  const fila = [...caminhos];
  const trabalhador = async () => {
    for (let c = fila.shift(); c !== undefined; c = fila.shift()) {
      try {
        const r = await fetch(`${base}${c}`, {
          headers: { "User-Agent": "Kambada aquecimento", Accept: "text/html" },
          cache: "no-store",
          signal: AbortSignal.timeout(30_000),
        });
        if (r.ok) ok++;
        else falhas++;
        await r.arrayBuffer(); // consome o corpo para liberar a conexão
      } catch {
        falhas++;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concorrencia) }, trabalhador));
  return { paginas: caminhos.length, ok, falhas, ms: Date.now() - inicio };
}
