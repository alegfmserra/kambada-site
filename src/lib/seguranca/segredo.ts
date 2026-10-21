import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Senhas das rotas de manutenção — um lugar só (21/10/2026).
 *
 * Antes, cada rota tinha a própria cópia da conferência e a senha só podia ir
 * no endereço (`?token=`), que fica no histórico do navegador e nos logs do
 * servidor. Agora o jeito certo é o cabeçalho:
 *
 *   curl -H "Authorization: Bearer SENHA" https://somoskambada.com.br/api/...
 *   (ou "X-Kambada-Segredo: SENHA")
 *
 * O `?token=` ainda é aceito na transição (e é o único jeito de abrir pelo
 * navegador, como em /api/bling/autorizar), mas registra um aviso no log.
 */

const CABECALHO = "x-kambada-segredo";

export function segredoRecebido(requisicao: Request): string | null {
  const proprio = requisicao.headers.get(CABECALHO)?.trim();
  if (proprio) return proprio;
  const bearer = (requisicao.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) return bearer;
  const naUrl = new URL(requisicao.url).searchParams.get("token");
  if (naUrl) {
    console.warn(`[seguranca] senha no endereço em ${new URL(requisicao.url).pathname}: prefira o cabeçalho Authorization`);
  }
  return naUrl;
}

/** Comparação em tempo constante, por resumo (tamanhos diferentes não vazam). */
export function confere(recebido: string | null, esperado: string | undefined): boolean {
  if (!esperado || !recebido) return false;
  const h = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(h(recebido), h(esperado));
}

/** Senha-mestra das rotas de manutenção (Bling, checkout, pesquisa): REVALIDATE_SECRET. */
export function segredoDeManutencao(requisicao: Request): boolean {
  return confere(segredoRecebido(requisicao), process.env.REVALIDATE_SECRET);
}

/**
 * Exportação da base de contas para o marketing: senha própria
 * (EXPORTACAO_SECRET), para um vazamento do lado do marketing não abrir o
 * Bling. Enquanto a variável não existir na Hostinger, vale a senha-mestra.
 */
export function segredoDaExportacao(requisicao: Request): boolean {
  return confere(segredoRecebido(requisicao), process.env.EXPORTACAO_SECRET || process.env.REVALIDATE_SECRET);
}
