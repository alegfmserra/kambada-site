import { NextResponse } from "next/server";
import { gravarAvaliacoes, lerEnvio, lerTokenDeAvaliacao } from "@/lib/avaliacoes/avaliacoes";
import { pecasDoPedido, pedidoPodeAvaliar } from "@/lib/avaliacoes/pedido";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { emailConfigurado, emailDaLoja, enviarEmail } from "@/lib/email/enviar";
import { escaparHtml } from "@/lib/email/confirmacao";
import { lerRegistro } from "@/lib/pedidos/registro";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";

export const dynamic = "force-dynamic";

/**
 * Recebe as avaliações das peças de um pedido.
 *
 * Corpo: {t: convite assinado, autoriza: boolean, avaliacoes: [{produto, nota, texto?}]}.
 * O pedido vem do convite, nunca do navegador; as peças, do registro do pedido.
 */
export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao);
  if (ip !== "sem-ip" && !dentroDoLimite(ip, "avaliacoes", 10, 10 * 60_000)) {
    return NextResponse.json({ erro: "Muitos envios seguidos. Tente de novo em alguns minutos." }, { status: 429 });
  }
  let corpo: Record<string, unknown>;
  try {
    corpo = (await requisicao.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const ref = lerTokenDeAvaliacao(corpo.t);
  if (!ref) return NextResponse.json({ erro: "Este link de avaliação venceu ou não é válido." }, { status: 403 });
  const registro = await lerRegistro(ref);
  if (!pedidoPodeAvaliar(registro)) {
    return NextResponse.json({ erro: "Este pedido ainda não pode ser avaliado." }, { status: 409 });
  }

  const pecas = pecasDoPedido(registro, await buscarCatalogo());
  const envios = lerEnvio(corpo, new Set(pecas.map((p) => p.produto)));
  if (!envios.length) return NextResponse.json({ erro: "Dê uma nota de 1 a 5 para pelo menos uma peça." }, { status: 422 });

  const novas = await gravarAvaliacoes(ref, registro.cliente.nome, corpo.autoriza === true, envios, pecas);

  // Aviso à loja: sem aprovação no painel, nada aparece no site.
  if (emailConfigurado()) {
    const linhas = novas.map((a) => `${"★".repeat(a.nota)}${"☆".repeat(5 - a.nota)} ${a.produtoNome}${a.texto ? ` — "${a.texto}"` : ""}`);
    enviarEmail({
      para: emailDaLoja(),
      assunto: `Nova avaliação no site (${ref}) — aprovar no painel`,
      texto: [...linhas, "", `Publicação autorizada pelo cliente: ${corpo.autoriza === true ? "sim" : "não"}`, "Aprovar em /admin/avaliacoes"].join("\n"),
      html: `<p>${linhas.map(escaparHtml).join("<br>")}</p><p>Publicação autorizada pelo cliente: <strong>${corpo.autoriza === true ? "sim" : "não"}</strong></p><p>Aprovar em /admin/avaliacoes</p>`,
    }).catch((e) => console.error("[avaliacoes] aviso à loja falhou:", e instanceof Error ? e.message : e));
  }

  return NextResponse.json({ ok: true, recebidas: novas.length });
}
