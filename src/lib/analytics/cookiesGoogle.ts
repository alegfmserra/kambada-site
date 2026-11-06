/**
 * Lê no navegador os cookies do próprio Google Analytics (`_ga` e `_ga_<ID>`) para o checkout
 * mandar ao servidor o mesmo "client_id" e a mesma sessão da visita. Assim a compra confirmada
 * pelo servidor (lib/analytics/servidor.ts) cai na mesma pessoa e na mesma origem (Instagram,
 * Google...) em vez de aparecer como "direto". Não lê nem manda nenhum dado pessoal.
 */
const ID_DA_PROPRIEDADE = "1LGMQVBGL3"; // G-1LGMQVBGL3

function cookie(nome: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const par = document.cookie.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${nome}=`));
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : undefined;
}

/** `_ga` = "GA1.1.1234567890.1234567890" → client_id "1234567890.1234567890". */
export function clientIdDoGoogle(valor = cookie("_ga")): string | undefined {
  const m = valor?.match(/^GA\d\.\d+\.(\d+\.\d+)$/);
  return m?.[1];
}

/** `_ga_<ID>` = "GS1.1.<sessão>.…" (formato antigo) ou "GS2.1.s<sessão>$o1$…" (atual) → número da sessão. */
export function sessaoDoGoogle(valor = cookie(`_ga_${ID_DA_PROPRIEDADE}`)): string | undefined {
  if (!valor) return undefined;
  const novo = valor.match(/^GS2\.\d+\.s(\d{8,12})/);
  if (novo) return novo[1];
  const antigo = valor.match(/^GS1\.\d+\.(\d{8,12})/);
  return antigo?.[1];
}

export function gaDoNavegador(): { c: string; s?: string } | undefined {
  try {
    const c = clientIdDoGoogle();
    if (!c) return undefined;
    const s = sessaoDoGoogle();
    return { c, ...(s ? { s } : {}) };
  } catch {
    return undefined;
  }
}
