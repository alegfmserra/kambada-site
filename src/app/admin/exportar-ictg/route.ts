import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { filtrarPeriodo, listarRespostas, respostasParaCsvIctg } from "@/lib/pesquisa/pesquisa";
import { urlPublica } from "@/lib/seguranca/urlPublica";

export const dynamic = "force-dynamic";

/**
 * Exportação da pesquisa para o ICTG (Método HOWL): CSV anonimizado — sem nome,
 * e-mail, contato nem instituição — com data da resposta e o marcador "usou o
 * Play". Período opcional (?de=AAAA-MM-DD&ate=AAAA-MM-DD). Só com a sessão do painel.
 */
export async function GET(requisicao: Request) {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return NextResponse.redirect(urlPublica("/admin/dados", requisicao));
  }
  const url = new URL(requisicao.url);
  const data = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const de = data(url.searchParams.get("de"));
  const ate = data(url.searchParams.get("ate"));
  const csv = respostasParaCsvIctg(filtrarPeriodo(await listarRespostas(), de, ate));
  const sufixo = [de, ate].filter(Boolean).join("_a_") || new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kambada-pesquisa-ictg-${sufixo}.csv"`,
      "cache-control": "no-store",
    },
  });
}
