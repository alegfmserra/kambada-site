import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { chamarBling } from "@/lib/bling/cliente";
import { urlPublica } from "@/lib/seguranca/urlPublica";
import { lerRegistro } from "@/lib/pedidos/registro";
import { mensagemDoWhatsApp, telefoneParaWhatsApp } from "@/lib/pedidos/whatsapp";

export const dynamic = "force-dynamic";

/**
 * WhatsApp com mensagem pronta para o CLIENTE (Fase A, 21/10/2026). A loja
 * clica, o WhatsApp abre na conversa do cliente com o texto escrito, e ela só
 * aperta enviar. O telefone vem do Bling na hora — o registro do site não
 * guarda telefone (LGPD). Só com a sessão da área de controle.
 */

export async function GET(requisicao: Request) {
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return NextResponse.redirect(urlPublica("/admin/pedidos", requisicao));
  }
  const p = new URL(requisicao.url).searchParams;
  const ref = p.get("ref") ?? "";
  const r = /^KMB-\d{8}-[0-9A-F]{6}$/.test(ref) ? await lerRegistro(ref) : null;
  if (!r) return NextResponse.redirect(urlPublica("/admin/pedidos", requisicao));

  try {
    const pedido = await chamarBling<{ data?: { contato?: { id?: number } } }>(`/pedidos/vendas/${r.bling.idPedido}`, { revalidar: 0 });
    const idContato = pedido.data?.contato?.id;
    const contato = idContato
      ? (await chamarBling<{ data?: { celular?: string; telefone?: string } }>(`/contatos/${idContato}`, { revalidar: 0 })).data
      : undefined;
    const numero = telefoneParaWhatsApp(contato?.celular) ?? telefoneParaWhatsApp(contato?.telefone);
    if (!numero) {
      return new NextResponse("O cadastro do cliente no Bling está sem celular válido. Abra o pedido no Bling para ver o contato.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const texto = mensagemDoWhatsApp(r, p.get("tipo") ?? "");
    return NextResponse.redirect(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`);
  } catch (e) {
    return new NextResponse(`Não consegui ler o telefone no Bling: ${e instanceof Error ? e.message : String(e)}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
