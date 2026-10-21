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
import { urlPublica } from "@/lib/checkout/posVenda";
import { FORMATO_RASTREIO, normalizarRastreio, TRANSPORTADORAS } from "@/lib/email/posVenda";
import { lerRegistro } from "@/lib/pedidos/registro";
import {
  avisarPostagemAoCliente,
  avisarProntoParaRetirada,
  cancelarPedido,
  concluirPedido,
  desfazerConclusao,
  iniciarProducao,
  marcarNotaResolvida,
  marcarPecaDevolvida,
} from "@/lib/pedidos/posVendaLoja";
import { criarNotaDeDevolucao, enviarNotaDeDevolucao } from "@/lib/fiscal/devolucao";
import { atualizarRastreio, gerarEtiqueta } from "@/lib/frete/etiqueta";
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
      await processarPagamento(id, { posVendaAgora: true });
    } catch (e) {
      console.error("[admin] refazer pendências:", e instanceof Error ? e.message : e);
    }
  }
  redirect("/admin/pedidos");
}

/**
 * "Postamos": grava o código de rastreio no pedido e manda ao cliente o e-mail
 * com o link de acompanhamento (cópia oculta para a loja). Reenviar com outro
 * código substitui o anterior.
 */
export async function avisarPostagem(formulario: FormData): Promise<void> {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) redirect("/admin/pedidos");
  const ref = String(formulario.get("ref") ?? "");
  const codigo = normalizarRastreio(String(formulario.get("codigo") ?? ""));
  const transportadora = String(formulario.get("transportadora") ?? "");
  if (!FORMATO_RASTREIO.test(codigo) || !(TRANSPORTADORAS as readonly string[]).includes(transportadora)) {
    redirect("/admin/pedidos?aviso=rastreio-invalido");
  }
  const r = await lerRegistro(ref).catch(() => null);
  if (!r) redirect("/admin/pedidos");
  await avisarPostagemAoCliente(ref, codigo, transportadora);
  await voltar(ref, "postado", "postados");
}

/** Compra a etiqueta no Melhor Envio (saldo da carteira) e devolve o link de impressão. */
export async function comprarEtiqueta(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  try {
    await gerarEtiqueta(ref, urlPublica());
  } catch (e) {
    console.error("[admin] etiqueta:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "etiqueta");
}

/** Lê agora a situação da etiqueta no Melhor Envio (sem esperar a conferência de hora em hora). */
export async function conferirRastreio(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  try {
    await atualizarRastreio(ref);
  } catch (e) {
    console.error("[admin] rastreio:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "rastreio");
}

// ---------------------------------------------------------------------------
// Produção, entrega/retirada e cancelamento (21/10/2026)
// ---------------------------------------------------------------------------

async function refDoFormulario(formulario: FormData): Promise<string> {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) redirect("/admin/pedidos");
  const ref = String(formulario.get("ref") ?? "");
  if (!/^KMB-\d{8}-[0-9A-F]{6}$/.test(ref)) redirect("/admin/pedidos");
  return ref;
}

/** Volta à área de controle com o aviso do que acabou de acontecer, na aba onde o pedido está agora. */
async function voltar(ref: string, aviso?: string, filtro?: string): Promise<never> {
  revalidatePath("/admin/pedidos");
  const q = new URLSearchParams();
  if (filtro) q.set("filtro", filtro);
  if (aviso) q.set("aviso", aviso);
  q.set("ref", ref);
  redirect(`/admin/pedidos?${q}#${ref}`);
}

export async function marcarProducao(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  await iniciarProducao(ref, formulario.get("personalizado") === "on");
  await voltar(ref, "producao");
}

export async function marcarConclusao(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  const tipo = formulario.get("tipo") === "retirado" ? "retirado" : "entregue";
  await concluirPedido(ref, tipo);
  await voltar(ref, "concluido", "concluidos");
}

export async function marcarProntoRetirada(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  try {
    await avisarProntoParaRetirada(ref);
  } catch (e) {
    console.error("[admin] pronto para retirada:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "pronto");
}

export async function desfazerConclusaoPedido(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  await desfazerConclusao(ref);
  await voltar(ref);
}

/** Nota de devolução, passo 1: cria no Bling (rascunho) referenciando a nota de venda. */
export async function criarDevolucao(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  try {
    await criarNotaDeDevolucao(ref);
  } catch (e) {
    console.error("[admin] devolução:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "devolucao-criada", "cancelamento");
}

/** Nota de devolução, passo 2: a loja conferiu no Bling; envia à SEFAZ (exige "confirmo"). */
export async function enviarDevolucao(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  if (formulario.get("confirmo") !== "on") await voltar(ref, "confirmar-devolucao", "cancelamento");
  try {
    await enviarNotaDeDevolucao(ref);
  } catch (e) {
    console.error("[admin] devolução (envio):", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "devolucao-enviada", "cancelamento");
}

/**
 * Arrependimento (até 7 dias do recebimento): a peça voltou ao ateliê. Registra,
 * estorna tudo (inclusive o frete), devolve o estoque e cancela no Bling; a
 * nota de devolução segue pelos dois passos acima.
 */
export async function registrarDevolucaoRecebida(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  if (formulario.get("confirmo") !== "on") await voltar(ref, "confirmar-cancelamento");
  try {
    await marcarPecaDevolvida(ref);
    await cancelarPedido(ref, 0);
  } catch (e) {
    console.error("[admin] devolução recebida:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "cancelado", "cancelamento");
}

/** Exige marcar "confirmo": estorno de dinheiro não se desfaz. */
export async function cancelarEEstornar(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  if (formulario.get("confirmo") !== "on") await voltar(ref, "confirmar-cancelamento");
  try {
    const reter = Number(String(formulario.get("reter") ?? "0").replace(",", ".")) || 0;
    await cancelarPedido(ref, reter);
  } catch (e) {
    console.error("[admin] cancelar:", e instanceof Error ? e.message : e);
  }
  await voltar(ref, "cancelado", "cancelamento");
}

export async function notaResolvida(formulario: FormData): Promise<void> {
  const ref = await refDoFormulario(formulario);
  await marcarNotaResolvida(ref);
  await voltar(ref, undefined, "cancelamento");
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
