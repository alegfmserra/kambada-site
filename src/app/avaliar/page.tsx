import type { Metadata } from "next";
import Link from "next/link";
import FormularioAvaliacao from "@/components/avaliacoes/FormularioAvaliacao";
import { lerTokenDeAvaliacao, nomeDeExibicao } from "@/lib/avaliacoes/avaliacoes";
import { pecasDoPedido, pedidoPodeAvaliar } from "@/lib/avaliacoes/pedido";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { lerRegistro } from "@/lib/pedidos/registro";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = { title: "Avaliar minhas peças", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Destino do convite do e-mail "pedido chegou": avalia as peças daquele pedido. */
export default async function PaginaAvaliar({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const ref = lerTokenDeAvaliacao(t);
  const registro = ref ? await lerRegistro(ref) : null;
  const pode = pedidoPodeAvaliar(registro);
  const pecas = pode ? pecasDoPedido(registro, await buscarCatalogo()) : [];

  return (
    <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
        Avalie suas <span className="destaque">peças</span>
      </h1>
      {pode && pecas.length > 0 ? (
        <>
          <p className="mt-4 leading-relaxed text-texto-suave">
            Pedido <strong className="text-texto">{registro.ref}</strong>. Sua nota ajuda quem ainda está em dúvida — e ajuda
            a gente a melhorar. Publicamos todas as avaliações, boas ou ruins; só ficam de fora ofensas e dados pessoais.
          </p>
          <FormularioAvaliacao token={t!} pecas={pecas} nomeExibido={nomeDeExibicao(registro.cliente.nome)} />
        </>
      ) : (
        <>
          <p className="mt-4 leading-relaxed text-texto-suave">
            {!ref
              ? "Este link de avaliação venceu ou não é válido."
              : "Este pedido ainda não pode ser avaliado: a avaliação abre quando o pedido é entregue ou retirado."}
          </p>
          <p className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/loja" className="font-semibold underline underline-offset-4">
              Voltar para a loja
            </Link>
            <a
              href={linkWhatsApp("Oi! Quero avaliar meu pedido, mas o link não abriu.")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-4"
            >
              Falar no WhatsApp
            </a>
          </p>
        </>
      )}
    </section>
  );
}
