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
 * Decisão do Alexandre (10/10/2026): troca e devolução SOMENTE nas hipóteses
 * legais — vício/defeito (CDC arts. 18 e 26) e arrependimento em 7 dias (CDC
 * art. 49; Decreto 7.962/2013, art. 5º). A troca por gosto (outra estampa ou
 * tamanho, sem defeito) não é oferecida como regra; situações atípicas são
 * tratadas pelo WhatsApp, caso a caso. Peças personalizadas com nome e
 * aprovadas antes da produção não têm troca por gosto — mas o arrependimento
 * de 7 dias e a garantia por defeito continuam valendo (art. 51, I, veda
 * cláusula que os restrinja), e o texto diz isso de forma polida.
 */
export default function PaginaTrocas() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Trocas e devoluções</h1>
        <p className="mt-3 text-lg text-texto-suave">
          Algo não saiu como você esperava? A gente resolve junto.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed">
          <article>
            <h2 className="font-display text-2xl font-bold">Desistiu da compra?</h2>
            <p className="mt-3">
              Comprou pelo site? Você pode desistir em até <strong>7 dias corridos</strong> do
              recebimento ou da retirada, sem explicar o motivo (Código de Defesa do Consumidor,
              art. 49).
            </p>
            <p className="mt-3">
              Devolvemos <strong>tudo o que você pagou, inclusive o frete</strong>, pelo mesmo meio de
              pagamento, com estorno no Mercado Pago (Decreto 7.962/2013, art. 5º). O envio de volta
              é por nossa conta e combinado pelo WhatsApp; só pedimos que a peça volte bem embalada.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Chegou com defeito ou danificada?</h2>
            <p className="mt-3">
              Avise em até <strong>90 dias</strong> depois de receber (Código de Defesa do
              Consumidor, art. 26), com fotos. Se o dano foi no transporte, avise assim que abrir a
              embalagem.
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
              Como trabalhamos com lotes pequenos, feitos à mão, as trocas seguem o Código de Defesa do
              Consumidor: desistência em 7 dias ou defeito. Troca só por gosto (outra estampa, o
              tamanho não serviu) não entra.
            </p>
            <p className="mt-3">
              <strong>Ainda está nos 7 dias do recebimento?</strong> Desista da compra, sem custo, e
              compre a outra estampa ou tamanho.
            </p>
            <p className="mt-3">
              Caso fora do comum? Chame no WhatsApp: a gente conversa caso a caso.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Peças personalizadas</h2>
            <p className="mt-3">
              Peça sob encomenda, com o seu nome ou a sua arte e aprovada por você antes da produção,
              <strong>não tem troca por gosto</strong> nem devolução por mudança de ideia depois de
              aprovada. Continuam valendo, como em toda compra, a desistência em 7 dias prevista em lei
              e a garantia por defeito.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Como pedir</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6">
              <li>
                Tenha o <strong>número do pedido</strong> (começa com KMB-), que está na confirmação
                da compra.
              </li>
              <li>
                Abra o{" "}
                <Link href="/pedido/atendimento" className="font-semibold underline underline-offset-4">
                  atendimento de pedido
                </Link>
                , escolha o motivo e conte o que houve.
              </li>
              <li>A mensagem chega pronta no nosso WhatsApp, e seguimos por lá.</li>
            </ol>
          </article>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/pedido/atendimento"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro whitespace-nowrap"
          >
            Abrir um atendimento
          </Link>
          <Link
            href="/pedido"
            className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold hover:border-kambada-amarelo-escuro whitespace-nowrap"
          >
            Acompanhar pedido
          </Link>
        </div>

        <p className="mt-10 text-sm text-texto-tenue">Atualizado em 10 de outubro de 2026.</p>
      </div>
    </section>
  );
}
