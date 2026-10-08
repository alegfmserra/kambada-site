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
 * Base legal: Código de Defesa do Consumidor (Lei 8.078/1990), arts. 18, 26 e
 * 49. Texto redigido em 08/10/2026 para revisão do Alexandre; a regra de troca
 * por tamanho/estampa (sem defeito) é decisão comercial e ficou em aberto, a
 * combinar caso a caso, até ele definir.
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
              pagamento — o estorno é feito no Mercado Pago. A postagem de volta a gente combina com
              você pelo WhatsApp. Só pedimos que a peça volte bem embalada, do jeito que chegou.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">A peça chegou com defeito?</h2>
            <p className="mt-3">
              Avise em até <strong>90 dias</strong> depois de receber (Código de Defesa do
              Consumidor, art. 26) e mande fotos pela conversa — elas aceleram tudo.
            </p>
            <p className="mt-3">
              Se o defeito não for resolvido em até 30 dias, você escolhe: troca por uma peça igual,
              devolução do valor pago ou abatimento proporcional no preço (art. 18, § 1º). Nesses
              casos, o frete é por nossa conta.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Quer outro tamanho ou outra estampa?</h2>
            <p className="mt-3">
              A peça não tem defeito, mas o tamanho não serviu ou você ficou com vontade de outra
              estampa? Fale com a gente. Como trabalhamos com lotes pequenos, a troca depende do
              estoque — e combinamos tudo pelo WhatsApp.
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
