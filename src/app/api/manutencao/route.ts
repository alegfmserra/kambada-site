import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rotinaDeManutencao } from "@/lib/manutencao/saude";
import { enviarTesteDoFluxo } from "@/lib/play/aniversarios";
import { aniversarioValido, buscarPorEmail, definirAniversario } from "@/lib/play/contas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Manutenção sob demanda — chamada pelo cron externo (GitHub Actions, a cada
 * 6 h) além do timer interno. Protegida por MANUTENCAO_SECRET (ou, na falta,
 * REVALIDATE_SECRET) em `Authorization: Bearer <segredo>`.
 */
function autorizado(req: Request): boolean {
  const segredo = process.env.MANUTENCAO_SECRET || process.env.REVALIDATE_SECRET;
  if (!segredo) return false;
  const recebido = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!recebido) return false;
  const h = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(recebido), h(segredo));
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const params = new URL(req.url).searchParams;

  // Fluxo de aniversário (02/11/2026), só com a senha de manutenção:
  //  ?definir-aniversario=<e-mail>&dia=24&mes=11 → guarda dia e mês (nunca o ano) na conta daquele e-mail;
  //  ?teste-aniversario=<e-mail> → manda as 3 mensagens de modelo, com "[TESTE]", ao dono da conta.
  const definir = params.get("definir-aniversario");
  if (definir) {
    const conta = await buscarPorEmail(definir);
    const valor = aniversarioValido(params.get("dia"), params.get("mes"));
    if (!conta || valor === null) return NextResponse.json({ ok: false, erro: "conta não encontrada ou data inválida" }, { status: 400 });
    return NextResponse.json({ ok: await definirAniversario(conta.id, valor), aniversario: valor || null });
  }
  const teste = params.get("teste-aniversario");
  if (teste) {
    const r = await enviarTesteDoFluxo(teste);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }

  const forcarResumo = params.get("resumo") === "1";
  // ?relatorio=AAAA-MM reenvia os relatórios de cupom daquele mês.
  const relatorioMes = /^\d{4}-\d{2}$/.test(params.get("relatorio") ?? "") ? (params.get("relatorio") as string) : undefined;
  const r = await rotinaDeManutencao({ forcarResumo, relatorioMes });
  return NextResponse.json(r, { status: r.ok ? 200 : 503 });
}

export const POST = GET;
