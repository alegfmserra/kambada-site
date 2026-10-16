import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Assinaturas dos jogos do Kambada Play (somente servidor).
 *
 * O jogo não tem conta nem banco de dados. Para o ranking valer (e render
 * cupom), o servidor assina o que entrega ao navegador (estado da partida,
 * horário de início) e só aceita de volta o que ele mesmo assinou. Assim ninguém
 * inventa pontuação nem encurta o tempo de uma partida.
 */

function segredo(): string {
  const s = process.env.PLAY_SEGREDO || process.env.MANUTENCAO_SECRET || process.env.REVALIDATE_SECRET;
  if (s) return s;
  // Prévia na Vercel (sem segredo configurado): vale só para testar. A produção
  // (Hostinger) tem MANUTENCAO_SECRET; sem ele a API recusa em vez de assinar com
  // um segredo previsível.
  if (process.env.VERCEL) return "kambada-play-previa-vercel";
  if (process.env.NODE_ENV === "production") {
    throw new Error("PLAY_SEGREDO (ou MANUTENCAO_SECRET) não está definido.");
  }
  return "kambada-play-desenvolvimento";
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/** Assina um objeto JSON e devolve "carga.assinatura". */
export function assinar(dados: unknown): string {
  const carga = Buffer.from(JSON.stringify(dados), "utf8").toString("base64url");
  const sig = base64url(createHmac("sha256", segredo()).update(carga).digest());
  return `${carga}.${sig}`;
}

/** Confere a assinatura e devolve o objeto, ou null se foi adulterado. */
export function verificar<T>(token: unknown): T | null {
  if (typeof token !== "string" || token.length > 4000) return null;
  const [carga, sig] = token.split(".");
  if (!carga || !sig) return null;
  const esperado = createHmac("sha256", segredo()).update(carga).digest();
  let recebido: Buffer;
  try {
    recebido = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    return JSON.parse(Buffer.from(carga, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** O servidor nunca guarda a chave do jogador: só este resumo. */
export function resumoDaChave(chave: string): string {
  return createHash("sha256").update(`${chave}|${segredo()}`).digest("hex").slice(0, 32);
}

export function idAleatorio(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

/** A chave do jogador é gerada no navegador: 32 caracteres hexadecimais. */
export function chaveValida(chave: unknown): chave is string {
  return typeof chave === "string" && /^[a-f0-9]{32}$/.test(chave);
}
