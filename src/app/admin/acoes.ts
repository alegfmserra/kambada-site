"use server";

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
