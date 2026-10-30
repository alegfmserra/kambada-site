/**
 * Limite simples de requisições por IP e por tipo (em memória). Basta para
 * segurar quem tenta martelar a API dos jogos; não é segurança contra um
 * ataque pesado.
 */
const baldes = new Map<string, { inicio: number; vezes: number }>();

export function dentroDoLimite(
  ip: string,
  tipo: string,
  maximo: number,
  janelaMs: number,
  agora = Date.now(),
): boolean {
  const chave = `${tipo}|${ip}`;
  const b = baldes.get(chave);
  if (!b || agora - b.inicio > janelaMs) {
    baldes.set(chave, { inicio: agora, vezes: 1 });
    if (baldes.size > 10000) baldes.delete(baldes.keys().next().value as string);
    return true;
  }
  b.vezes += 1;
  return b.vezes <= maximo;
}

/**
 * Limite só de ERROS (30/10/2026), para login: entrar certo não gasta tentativa.
 * Antes, toda entrada contava, e várias pessoas na mesma rede (Wi-Fi de escola,
 * mesmo IP) se bloqueavam depois de 8 logins certos. `errosEsgotados` só olha;
 * `contarErro` soma um erro na janela.
 */
const erros = new Map<string, { inicio: number; vezes: number }>();

export function errosEsgotados(ip: string, tipo: string, maximo: number, janelaMs: number, agora = Date.now()): boolean {
  const b = erros.get(`${tipo}|${ip}`);
  if (!b || agora - b.inicio > janelaMs) return false;
  return b.vezes >= maximo;
}

export function contarErro(ip: string, tipo: string, janelaMs: number, agora = Date.now()): void {
  const chave = `${tipo}|${ip}`;
  const b = erros.get(chave);
  if (!b || agora - b.inicio > janelaMs) {
    erros.set(chave, { inicio: agora, vezes: 1 });
    if (erros.size > 10000) erros.delete(erros.keys().next().value as string);
    return;
  }
  b.vezes += 1;
}

export function ipDaRequisicao(requisicao: Request): string {
  return (requisicao.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sem-ip";
}

export async function corpoJson(requisicao: Request): Promise<Record<string, unknown> | null> {
  try {
    const c = (await requisicao.json()) as unknown;
    return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
