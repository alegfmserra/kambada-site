import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

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

/**
 * Estado que o navegador carrega mas NÃO pode ler (17/11/2026): cifrado e
 * autenticado (AES-256-GCM). Serve à memória das estampas, em que o estado da
 * partida leva a posição de todas as cartas. Assinar só não bastava: a carga
 * assinada é legível, e quem a lesse saberia onde está cada par.
 */
function chaveDaCifra(): Buffer {
  return createHash("sha256").update(`cifra|${segredo()}`).digest();
}

export function cifrar(dados: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chaveDaCifra(), iv);
  const corpo = Buffer.concat([c.update(JSON.stringify(dados), "utf8"), c.final()]);
  return `${base64url(iv)}.${base64url(corpo)}.${base64url(c.getAuthTag())}`;
}

/** Abre o que `cifrar` fechou, ou null se foi adulterado (ou não é nosso). */
export function decifrar<T>(token: unknown): T | null {
  if (typeof token !== "string" || token.length > 8000) return null;
  const [iv, corpo, marca] = token.split(".");
  if (!iv || !corpo || !marca) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", chaveDaCifra(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(marca, "base64url"));
    const claro = Buffer.concat([d.update(Buffer.from(corpo, "base64url")), d.final()]).toString("utf8");
    return JSON.parse(claro) as T;
  } catch {
    return null;
  }
}

/** Embaralha com o sorteio do sistema (não previsível pelo navegador). */
export function embaralharSeguro<T>(lista: readonly T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Embaralha sempre do mesmo jeito para o mesmo rótulo (derivado do segredo do
 * servidor). Serve quando o mesmo pedido pode chegar duas vezes (resposta
 * perdida na rede) e precisa dar o mesmo resultado. Até 32 itens.
 */
export function embaralharPorRotulo<T>(lista: readonly T[], rotulo: string): T[] {
  const bytes = createHmac("sha256", segredo()).update(`embaralhar|${rotulo}`).digest();
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

/**
 * Ordem embaralhada das opções de uma pergunta, derivada de um segredo do
 * servidor. O estado da partida é assinado mas NÃO cifrado (dá para ler a
 * carga em base64): se a permutação viajasse nele, o gabarito viajaria junto.
 * Assim a ordem é recalculada a cada resposta e nunca sai do servidor.
 */
export function permutacaoSecreta(partida: string, indice: number, n: number): number[] {
  const bytes = createHmac("sha256", segredo()).update(`opcoes|${partida}|${indice}`).digest();
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
