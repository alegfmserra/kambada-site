import type { Metadata } from "next";
import Link from "next/link";
import { FRETE_GRATIS_A_PARTIR_DE } from "@/lib/frete/regras";
import { formatarReais } from "@/lib/loja/dinheiro";
import { LIMITES_PARCELAS } from "@/lib/loja/parcelas";
import { POSTAGEM_DIAS_UTEIS, PRODUCAO_PINTADA_A_MAO, PRODUCAO_PLACA } from "@/lib/loja/prazos";
import { EMAILS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de Compra",
  description: "As regras da compra no site da Kambada: preços, pagamento, prazos, frete, nota fiscal, trocas e cupons.",
  alternates: { canonical: "/termos" },
};

/** Termos de Compra — minuta aprovada pelo Alexandre em 11/10/2026. */
export default function PaginaTermos() {
  const reais0 = (c: number) => formatarReais(c / 100).replace(/,00$/, "");
  const limite2x = LIMITES_PARCELAS.find((l) => l.parcelas === 2)!.aPartirDeCentavos;
  const limite3x = LIMITES_PARCELAS.find((l) => l.parcelas === 3)!.aPartirDeCentavos;

  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Termos de Compra</h1>
        <p className="mt-3 text-lg text-texto-suave">
          Estes termos valem para compras feitas em somoskambada.com.br. Ao finalizar um pedido, você
          concorda com eles.
        </p>

        <ol className="mt-10 list-decimal space-y-6 pl-6 leading-relaxed">
          <li>
            <strong>Quem vende.</strong> {SITE.razaoSocial}, CNPJ {SITE.cnpj}, São Luís – MA. Atendimento
            pelo WhatsApp e por{" "}
            <a href={`mailto:${EMAILS.contato}`} className="font-semibold underline underline-offset-4 break-all">
              {EMAILS.contato}
            </a>
            , todos os dias, das 8h às 18h.
          </li>
          <li>
            <strong>Peças artesanais.</strong> Nossas peças são feitas à mão, em lotes pequenos. Peças
            pintadas à mão (matracas, placas, mandalas, porta-chaves) podem variar um pouco da foto — isso
            é característica, não defeito. Cores podem variar conforme a tela.
          </li>
          <li>
            <strong>Preços e pagamento.</strong> Os preços são os mostrados no site no momento da compra,
            em reais, com impostos incluídos. Pagamento pelo Mercado Pago: Pix ou cartão de crédito.
            Parcelamento sem juros em 2x a partir de {reais0(limite2x)} e em 3x a partir de{" "}
            {reais0(limite3x)}; abaixo disso, à vista. O pedido só é confirmado depois da aprovação do
            pagamento.
          </li>
          <li>
            <strong>Estoque.</strong> O site mostra o estoque real. Matracas são feitas por encomenda, com
            produção de {PRODUCAO_PINTADA_A_MAO.min} a {PRODUCAO_PINTADA_A_MAO.max} dias; placas pintadas, de{" "}
            {PRODUCAO_PLACA.min} a {PRODUCAO_PLACA.max} dias. Se, por erro, uma
            peça paga não puder ser entregue, devolvemos o valor integral.
          </li>
          <li>
            <strong>Frete e prazos.</strong> O frete é calculado pelo CEP no checkout. Postamos em até{" "}
            {POSTAGEM_DIAS_UTEIS} dias úteis após a aprovação do pagamento (peças por encomenda: após a
            produção). O prazo da transportadora começa na postagem e é informado no checkout. Frete grátis
            na entrega mais barata a partir de {formatarReais(FRETE_GRATIS_A_PARTIR_DE)} em peças. Retirada
            gratuita no ateliê, em São Luís, com hora marcada pelo WhatsApp — o endereço é informado após
            a confirmação do pagamento.
          </li>
          <li>
            <strong>Nota fiscal.</strong> Toda venda tem nota fiscal eletrônica, enviada por e-mail. Por
            isso pedimos o CPF.
          </li>
          <li>
            <strong>Trocas e devoluções.</strong> Seguem o Código de Defesa do Consumidor: desistência em
            até 7 dias corridos após o recebimento, com devolução integral; defeito ou dano, em até 90
            dias. Peças personalizadas com nome ou arte sua, aprovadas antes da produção, não têm troca
            por gosto. Detalhes em{" "}
            <Link href="/trocas-e-devolucoes" className="font-semibold underline underline-offset-4">
              Trocas e devoluções
            </Link>
            .
          </li>
          <li>
            <strong>Cupons.</strong> Têm validade, limite de usos e podem ser encerrados sem aviso; valem
            só sobre as peças, não sobre o frete, e não são cumulativos.
          </li>
          <li>
            <strong>Propriedade intelectual.</strong> Kambada® é marca registrada no INPI. As artes,
            estampas e textos do site são criações da Kambada e não podem ser reproduzidos sem
            autorização. Detalhes em{" "}
            <Link href="/direitos-autorais" className="font-semibold underline underline-offset-4">
              Direitos autorais
            </Link>
            .
          </li>
          <li>
            <strong>Dúvidas e conflitos.</strong> Tente primeiro o nosso atendimento — resolvemos a maioria
            das coisas na conversa. Fica eleito o foro da comarca de São Luís – MA, sem prejuízo do foro do
            seu domicílio, garantido pelo Código de Defesa do Consumidor.
          </li>
        </ol>

        <p className="mt-8 text-sm text-texto-suave">
          Seus dados: veja a{" "}
          <Link href="/privacidade" className="font-semibold text-texto underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </p>
        <p className="mt-10 text-sm text-texto-tenue">Última atualização: 11 de outubro de 2026.</p>
      </div>
    </section>
  );
}
