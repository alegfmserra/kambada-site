import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { montarPlanilha, reunirDados } from "@/lib/admin/dados";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * "Baixar tudo" da área de controle: uma planilha Excel com pedidos, contas,
 * pesquisa, cupons e Kambada Play. Só com a sessão da área de controle (o
 * cookie vale para /admin) — sem link público, sem senha em endereço.
 */
export async function GET(requisicao: Request) {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return NextResponse.redirect(new URL("/admin/dados", requisicao.url));
  }
  const planilha = await montarPlanilha(await reunirDados());
  const dia = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(planilha), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="kambada-dados-do-site-${dia}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
