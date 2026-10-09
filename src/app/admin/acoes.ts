"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_ADMIN,
  DURACAO_SESSAO_S,
  podeTentar,
  registrarErro,
  senhaConfere,
  sessaoValida,
  valorDoCookie,
} from "@/lib/admin/sessao";
import { processarPagamento } from "@/lib/checkout/processar";
import {
  FORMATO_CODIGO,
  listarCupons,
  normalizarCodigo,
  salvarCupons,
  type Periodo,
} from "@/lib/cupons/cupons";

export type EstadoLogin = { erro?: string };

async function ipDoVisitante(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sem-ip";
}

export async function entrar(_anterior: EstadoLogin, formulario: FormData): Promise<EstadoLogin> {
  const ip = await ipDoVisitante();
  if (!podeTentar(ip)) return { erro: "Muitas tentativas. Espere 15 minutos." };

  if (!senhaConfere(String(formulario.get("senha") ?? ""))) {
    registrarErro(ip);
    return { erro: "Senha incorreta." };
  }

  (await cookies()).set(COOKIE_ADMIN, valorDoCookie(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: DURACAO_SESSAO_S,
  });
  redirect("/admin/pedidos");
}

export async function sair(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_ADMIN, path: "/admin" });
  redirect("/admin/pedidos");
}

/**
 * Refaz as etapas que falharam (estoque, nota, e-mail) de um pedido. É o mesmo
 * processamento da página de sucesso: relê o pagamento e não duplica nada.
 */
export async function refazerPendencias(formulario: FormData): Promise<void> {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) redirect("/admin/pedidos");
  const id = String(formulario.get("pagamento") ?? "");
  if (/^\d+$/.test(id)) {
    try {
      await processarPagamento(id);
    } catch (e) {
      console.error("[admin] refazer pendências:", e instanceof Error ? e.message : e);
    }
  }
  redirect("/admin/pedidos");
}

// ---------------------------------------------------------------------------
// Cupons
// ---------------------------------------------------------------------------

export type EstadoCupom = { erro?: string; ok?: string };

async function exigirSessao(): Promise<void> {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) redirect("/admin/cupons");
}

const PERIODOS = ["total", "dia", "semana", "mes"] as const;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function criarCupom(_anterior: EstadoCupom, formulario: FormData): Promise<EstadoCupom> {
  await exigirSessao();
  const codigo = normalizarCodigo(String(formulario.get("codigo") ?? ""));
  const percentual = Number(formulario.get("percentual"));
  const usos = Number(formulario.get("usos"));
  const periodo = String(formulario.get("periodo") ?? "");
  const parceiro = String(formulario.get("parceiro") ?? "").trim().slice(0, 60);
  const comissao = Number(formulario.get("comissao") || 0);
  const validoDe = String(formulario.get("validoDe") ?? "");
  const validoAte = String(formulario.get("validoAte") ?? "");

  if (!FORMATO_CODIGO.test(codigo)) return { erro: "Código: de 3 a 20 letras, números ou hífen." };
  if (!Number.isInteger(percentual) || percentual < 1 || percentual > 50) {
    return { erro: "Desconto: um número inteiro entre 1% e 50%." };
  }
  if (!Number.isInteger(usos) || usos < 1 || usos > 10000) return { erro: "Usos: um número inteiro a partir de 1." };
  if (!(PERIODOS as readonly string[]).includes(periodo)) return { erro: "Escolha o período do limite." };
  if (!Number.isFinite(comissao) || comissao < 0 || comissao > 50) return { erro: "Comissão: entre 0% e 50%." };
  if (validoDe && !DATA.test(validoDe)) return { erro: "Data de início inválida." };
  if (validoAte && !DATA.test(validoAte)) return { erro: "Data de fim inválida." };
  if (validoDe && validoAte && validoAte < validoDe) return { erro: "O fim vem antes do início." };

  const cupons = await listarCupons();
  if (cupons.some((c) => c.codigo === codigo)) return { erro: `Já existe um cupom ${codigo}.` };

  cupons.push({
    codigo,
    percentual,
    parceiro: parceiro || undefined,
    comissaoPercentual: comissao || undefined,
    limite: { usos, periodo: periodo as Periodo },
    validoDe: validoDe || undefined,
    validoAte: validoAte || undefined,
    ativo: true,
    criadoEm: new Date().toISOString(),
  });
  await salvarCupons(cupons);
  revalidatePath("/admin/cupons");
  return { ok: `Cupom ${codigo} criado.` };
}

export async function alternarCupom(formulario: FormData): Promise<void> {
  await exigirSessao();
  const codigo = normalizarCodigo(String(formulario.get("codigo") ?? ""));
  const cupons = await listarCupons();
  const c = cupons.find((x) => x.codigo === codigo);
  if (c) {
    c.ativo = !c.ativo;
    await salvarCupons(cupons);
  }
  revalidatePath("/admin/cupons");
}

/** Excluir só apaga o cadastro; as vendas já feitas com ele continuam nos pedidos. */
export async function excluirCupom(formulario: FormData): Promise<void> {
  await exigirSessao();
  const codigo = normalizarCodigo(String(formulario.get("codigo") ?? ""));
  await salvarCupons((await listarCupons()).filter((x) => x.codigo !== codigo));
  revalidatePath("/admin/cupons");
}
