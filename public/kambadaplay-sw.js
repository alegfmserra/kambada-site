/*
 * Service worker do app Kambada Play (PWA, 30/10/2026).
 *
 * Mora na raiz (/kambadaplay-sw.js) só para poder ter o escopo "/kambadaplay"
 * sem barra no fim (um arquivo em /kambadaplay/ só alcançaria /kambadaplay/…
 * e deixaria a página inicial do Play de fora). É registrado com
 * { scope: "/kambadaplay" }: a loja não passa por aqui.
 *
 * O que guarda (para ler as HQs sem internet):
 *  - páginas públicas do app: "Como instalar" e "Sem internet";
 *  - páginas das HQs (/kambadaplay/hq/…), na hora em que abrem com internet
 *    ou quando a pessoa toca em "Guardar as HQs";
 *  - arquivos estáticos: /_next/static (nome com hash, imutável), páginas das
 *    HQs em .webp, ícones do app.
 *
 * O que NUNCA guarda: /api/* (respostas de quem está logado), dados de conta,
 * placar ou perfil de aluno, qualquer página fora das HQs, e qualquer
 * resposta que veio de um redirecionamento (ex.: mandou para o login).
 * Ao sair do Play, a página pede para apagar as páginas guardadas.
 */

const VERSAO = "kp-v1";
const CACHE_ESTATICO = `${VERSAO}-estatico`;
const CACHE_PAGINAS = `${VERSAO}-paginas`;
const OFFLINE = "/kambadaplay/offline";
/** Páginas públicas guardadas na instalação, com o JS e o CSS que usam (sem eles a página não reage). */
const PAGINAS_FIXAS = [OFFLINE, "/kambadaplay/instalar"];
const ARQUIVOS_FIXOS = [
  "/kambadaplay/manifest.json",
  "/kambadaplay/icones/icone-192.png",
  "/kambadaplay/icones/icone-512.png",
];

async function guardarFixos() {
  // Um por um: se algo falhar, o resto ainda entra (e o SW instala).
  const estatico = await caches.open(CACHE_ESTATICO);
  await Promise.all([
    ...PAGINAS_FIXAS.map((url) => guardarComArquivos(url, []).catch(() => undefined)),
    ...ARQUIVOS_FIXOS.map((url) => guardar(estatico, url).catch(() => undefined)),
  ]);
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      await guardarFixos();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes.filter((n) => n.startsWith("kp-") && !n.startsWith(`${VERSAO}-`)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

const ehPaginaGuardavel = (caminho) =>
  caminho === OFFLINE || caminho === "/kambadaplay/instalar" || caminho.startsWith("/kambadaplay/hq/");

const ehEstatico = (caminho) =>
  caminho.startsWith("/_next/static/") ||
  caminho.startsWith("/kambadaplay/hq/") ||
  caminho.startsWith("/kambadaplay/icones/") ||
  caminho === "/kambadaplay/manifest.json";

/** Busca e guarda, mas só resposta 200 que não veio de redirecionamento. */
async function guardar(cache, url) {
  const resposta = await fetch(url, { credentials: "same-origin" });
  if (!resposta.ok || resposta.redirected || resposta.type !== "basic") throw new Error(`não guardei ${url}`);
  await cache.put(url, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const caminho = url.pathname;
  // Nada de API (logado ou não) nem de dado do Next em navegação suave (RSC):
  // sem internet, o Next cai para a navegação completa, que passa abaixo.
  if (caminho.startsWith("/api/") || url.searchParams.has("_rsc") || req.headers.get("RSC")) return;

  if (req.mode === "navigate") {
    if (!caminho.startsWith("/kambadaplay")) return;
    evento.respondWith(navegar(req, caminho));
    return;
  }

  if (ehEstatico(caminho) && !url.search) {
    evento.respondWith(primeiroDoCache(req));
  }
});

/** Páginas: rede primeiro (conteúdo sempre novo); sem internet, a cópia guardada ou a tela "Sem internet". */
async function navegar(req, caminho) {
  try {
    const resposta = await fetch(req);
    if (ehPaginaGuardavel(caminho) && resposta.ok && !resposta.redirected && resposta.type === "basic") {
      const cache = await caches.open(CACHE_PAGINAS);
      await cache.put(caminho, resposta.clone());
    }
    return resposta;
  } catch {
    if (ehPaginaGuardavel(caminho)) {
      const guardada = await caches.match(caminho, { cacheName: CACHE_PAGINAS });
      if (guardada) return guardada;
    }
    // Redireciona (em vez de servir a tela "Sem internet" no endereço pedido): o Next
    // estranha página com endereço de outra rota e tenta recarregar, o que sem internet dá erro.
    if (await caches.match(OFFLINE, { cacheName: CACHE_PAGINAS })) {
      return Response.redirect(`${OFFLINE}?de=${encodeURIComponent(caminho)}`, 302);
    }
    return new Response("Sem internet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function primeiroDoCache(req) {
  const cache = await caches.open(CACHE_ESTATICO);
  const guardada = await cache.match(req);
  if (guardada) return guardada;
  const resposta = await fetch(req);
  if (resposta.ok && resposta.type === "basic") await cache.put(req, resposta.clone());
  return resposta;
}

/** Guarda uma página e tudo o que ela usa (imagens dadas, JS e CSS do Next citados no HTML). */
async function guardarComArquivos(url, imagens) {
  const paginas = await caches.open(CACHE_PAGINAS);
  const estatico = await caches.open(CACHE_ESTATICO);
  const resposta = await guardar(paginas, url);
  const html = await resposta.text();
  const doNext = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  const arquivos = [...doNext, ...imagens];
  await Promise.all(
    arquivos.map(async (a) => {
      if (await estatico.match(a)) return;
      await guardar(estatico, a).catch(() => undefined);
    }),
  );
}

self.addEventListener("message", (evento) => {
  const msg = evento.data || {};
  const porta = evento.ports && evento.ports[0];
  const responder = (r) => porta && porta.postMessage(r);

  if (msg.tipo === "guardar-hqs" && Array.isArray(msg.hqs)) {
    evento.waitUntil(
      (async () => {
        let ok = 0;
        for (const hq of msg.hqs) {
          if (typeof hq.url !== "string" || !hq.url.startsWith("/kambadaplay/hq/")) continue;
          const imagens = (Array.isArray(hq.imagens) ? hq.imagens : []).filter(
            (i) => typeof i === "string" && i.startsWith("/kambadaplay/hq/"),
          );
          try {
            await guardarComArquivos(hq.url, imagens);
            ok++;
          } catch {
            // segue para a próxima
          }
        }
        responder({ ok, total: msg.hqs.length });
      })(),
    );
  }

  if (msg.tipo === "limpar-paginas") {
    // Ao sair do Play: só as páginas (podem ter o nome do jogador no cabeçalho); os estáticos são públicos.
    evento.waitUntil(
      (async () => {
        await caches.delete(CACHE_PAGINAS);
        await guardarFixos();
        responder({ ok: true });
      })(),
    );
  }
});
