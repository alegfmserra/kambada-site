import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trocas e devoluções",
  description:
    "Como desistir de uma compra, trocar uma peça ou resolver um defeito na Kambada — prazos e passo a passo.",
  alternates: { canonical: "/trocas-e-devolucoes" },
};

/**
 * Política de trocas e devoluções.
 *
 * Orientação do Alexandre (08/10/2026): devolução só nas hipóteses legais —
 * defeito/dano (CDC arts. 18 e 26) e arrependimento em 7 dias (CDC art. 49;
 * Decreto 7.962/2013, art. 5º). Troca por gosto (outra estampa ou tamanho, sem
 * defeito) não é obrigação legal: é cortesia, e o frete fica com o cliente —
 * informado ANTES da compra (CDC arts. 6º, III, e 31). Limite: a cortesia não
 * pode esvaziar o arrependimento; dentro dos 7 dias o cliente ainda pode
 * devolver sem custo (art. 51, I, veda cláusula que o restrinja).
 * O prazo de 30 dias da troca por gosto é proposta a confirmar.
 */
export default function PaginaTrocas() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Trocas e devoluções</h1>
        <p className="mt-3 text-lg text-texto-suave">
          Cada peça da Kambada é feita com cuidado. Se algo não saiu como você esperava, a gente
          resolve junto.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed">
          <article>
            <h2 className="font-display text-2xl font-bold">Desistiu da compra?</h2>
            <p className="mt-3">
              Comprou pelo site? Você pode desistir em até <strong>7 dias corridos</strong>, contados
              do dia em que recebeu ou retirou a peça, sem precisar explicar o motivo (Código de
              Defesa do Consumidor, art. 49).
            </p>
            <p className="mt-3">
              Devolvemos <strong>tudo o que você pagou, inclusive o frete</strong>, pelo mesmo meio de
              pagamento — o estorno é feito no Mercado Pago (Decreto 7.962/2013, art. 5º). O envio de
              volta é por nossa conta: a gente combina a postagem com você pelo WhatsApp. Só pedimos
              que a peça volte bem embalada, do jeito que chegou.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Chegou com defeito ou danificada?</h2>
            <p className="mt-3">
              Avise em até <strong>90 dias</strong> depois de receber (Código de Defesa do
              Consumidor, art. 26) e mande fotos pela conversa — elas aceleram tudo. Se a peça chegou
              danificada pelo transporte, avise assim que abrir a embalagem.
            </p>
            <p className="mt-3">
              Se o problema não for resolvido em até 30 dias, você escolhe: troca por uma peça igual,
              devolução do valor pago ou abatimento proporcional no preço (art. 18, § 1º).{" "}
              <strong>Nesses casos, todo frete é por nossa conta.</strong>
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Quer trocar por outra estampa ou tamanho?</h2>
            <p className="mt-3">
              A peça está perfeita, mas você preferiu outra estampa — trocou o Guará pela Carranca —
              ou o tamanho não serviu? A gente troca com prazer, como cortesia da casa:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>em até <strong>30 dias</strong> depois de receber;</li>
              <li>com a peça sem uso, com a etiqueta;</li>
              <li>conforme o estoque — trabalhamos com lotes pequenos;</li>
              <li>
                <strong>o frete de ida e de volta fica por sua conta</strong>, porque a troca não é por
                defeito. Comprou com retirada no ateliê? Aí a troca é lá mesmo, sem frete.
              </li>
            </ul>
            <p className="mt-3 text-sm text-texto-suave">
              Ainda está nos 7 dias do recebimento? Você também pode simplesmente desistir da compra,
              sem custo, e comprar a outra estampa — vale o que for melhor para você.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Como pedir</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6">
              <li>
                Tenha em mãos o <strong>número do pedido</strong> (começa com KMB-). Ele está na
                página de confirmação da compra.
              </li>
              <li>
                Abra o{" "}
                <Link href="/pedido/atendimento" className="font-semibold underline underline-offset-4">
                  atendimento de pedido
                </Link>
                , escolha o motivo e conte o que houve.
              </li>
              <li>A mensagem chega pronta no nosso WhatsApp, e a gente segue com você por lá.</li>
            </ol>
          </article>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/pedido/atendimento"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
          >
            Abrir um atendimento
          </Link>
          <Link
            href="/pedido"
            className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold hover:border-kambada-amarelo-escuro"
          >
            Acompanhar pedido
          </Link>
        </div>

        <p className="mt-10 text-sm text-texto-tenue">Atualizado em 8 de outubro de 2026.</p>
      </div>
    </section>
  );
}
