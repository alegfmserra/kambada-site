import { createHash } from "node:crypto";

/**
 * IndexNow (02/11/2026): avisa o Bing (e Yandex, Seznam, Naver) quando o sitemap muda,
 * para as páginas novas e alteradas serem rastreadas em horas e não em semanas. O Google
 * NÃO usa IndexNow (lá o caminho é o sitemap e o "Solicitar indexação" do Search Console).
 *
 * A chave é pública por desenho: o buscador confere se o arquivo /<chave>.txt do site
 * traz a mesma chave. Só URLs públicas do próprio domínio são enviadas.
 */
export const CHAVE_INDEXNOW = "6ba318441b5aea851f2350311acc175d";
const SITE = "https://somoskambada.com.br";

export async function urlsDoSitemap(base = SITE): Promise<{ urls: string[]; assinatura: string }> {
  const r = await fetch(`${base}/sitemap.xml`, { cache: "no-store" });
  if (!r.ok) throw new Error(`sitemap respondeu ${r.status}`);
  const xml = await r.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(SITE));
  return { urls, assinatura: createHash("sha256").update(urls.join("\n")).digest("hex").slice(0, 16) };
}

export async function enviarIndexNow(urls: string[]): Promise<{ enviadas: number; status: number }> {
  if (!urls.length) return { enviadas: 0, status: 0 };
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: CHAVE_INDEXNOW, keyLocation: `${SITE}/${CHAVE_INDEXNOW}.txt`, urlList: urls.slice(0, 10_000) }),
  });
  // 200/202 = recebido; 422/403 = chave ou URL inválida.
  return { enviadas: urls.length, status: r.status };
}

/** Envia o sitemap inteiro quando a lista de URLs mudou desde a última vez (guardada em `ultima`). */
export async function sincronizarIndexNow(ultima?: string): Promise<{ enviou: boolean; assinatura: string; status?: number; urls?: number }> {
  // Só o site oficial avisa os buscadores (máquina local e prévias não).
  if (process.env.NEXT_PUBLIC_SITE_URL !== SITE) return { enviou: false, assinatura: "" };
  const { urls, assinatura } = await urlsDoSitemap();
  if (assinatura === ultima) return { enviou: false, assinatura };
  const r = await enviarIndexNow(urls);
  return { enviou: r.status === 200 || r.status === 202, assinatura, status: r.status, urls: r.enviadas };
}
