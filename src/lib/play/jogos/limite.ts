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
