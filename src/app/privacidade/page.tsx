import type { Metadata } from "next";
import Link from "next/link";
import { EMAILS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Quais dados a Kambada pede quando você compra no site, para que servem, com quem são compartilhados e como exercer os seus direitos (LGPD).",
  alternates: { canonical: "/privacidade" },
};

/**
 * Política de Privacidade — minuta aprovada pelo Alexandre em 11/10/2026.
 * Encarregado (LGPD, art. 41): Alexandre, pelo e-mail contato@. Linguagem
 * simples de propósito; as bases legais ficaram na minuta, não aqui.
 */
const LINHAS: { dado: string; quando: string; paraQue: string; base: string }[] = [
  { dado: "Nome, e-mail, celular", quando: "No checkout", paraQue: "Confirmar o pedido, avisar da postagem, atender dúvidas e trocas", base: "Execução do contrato" },
  { dado: "CPF", quando: "No checkout", paraQue: "Emitir a nota fiscal eletrônica, que é obrigatória", base: "Obrigação legal" },
  { dado: "Endereço e CEP", quando: "No checkout", paraQue: "Calcular o frete, entregar a encomenda e preencher a nota", base: "Execução do contrato" },
  { dado: "Dados do pagamento (cartão, Pix)", quando: "Na página do Mercado Pago", paraQue: "Processar o pagamento. O site da Kambada não vê nem guarda número de cartão", base: "Tratados pelo Mercado Pago" },
  { dado: "Número do pedido e e-mail", quando: "Em “Acompanhar pedido”", paraQue: "Mostrar a situação do seu pedido só para você", base: "Execução do contrato" },
  { dado: "Dados de navegação (páginas vistas, aparelho, origem do acesso)", quando: "Ao navegar", paraQue: "Entender o que funciona no site e medir anúncios (Google Analytics / Google Ads) e contar visitas (GoatCounter, sem cookies)", base: "Legítimo interesse" },
  { dado: "Preferência de tema e carrinho", quando: "Ao navegar", paraQue: "Guardar a sua escolha e as peças do carrinho no seu próprio navegador", base: "Não sai do seu aparelho" },
];

export default function PaginaPrivacidade() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Política de Privacidade</h1>
        <p className="mt-3 text-lg text-texto-suave">
          A Kambada respeita a sua privacidade. Esta página explica, sem juridiquês, quais dados pedimos
          quando você compra no site, para que servem, com quem são compartilhados e como você pode
          exercer os seus direitos.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed">
          <article>
            <h2 className="font-display text-2xl font-bold">Quem é o responsável pelos seus dados</h2>
            <p className="mt-3">
              <strong>{SITE.razaoSocial}</strong>, CNPJ {SITE.cnpj}, São Luís – MA. O encarregado pela
              proteção de dados é <strong>Alexandre Gabriel Ferreira Moreira Serra</strong>, sócio da Kambada.
              Para qualquer assunto de privacidade, escreva para{" "}
              <a href={`mailto:${EMAILS.contato}`} className="font-semibold underline underline-offset-4 break-all">
                {EMAILS.contato}
              </a>
              .
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Quais dados pedimos e por quê</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-texto-tenue">
                    <th className="py-2 pr-3 font-semibold">Dado</th>
                    <th className="py-2 pr-3 font-semibold">Quando</th>
                    <th className="py-2 pr-3 font-semibold">Para quê</th>
                    <th className="py-2 font-semibold">Base</th>
                  </tr>
                </thead>
                <tbody>
                  {LINHAS.map((l) => (
                    <tr key={l.dado} className="border-t border-borda align-top">
                      <td className="py-2 pr-3 font-semibold">{l.dado}</td>
                      <td className="py-2 pr-3">{l.quando}</td>
                      <td className="py-2 pr-3">{l.paraQue}</td>
                      <td className="py-2 text-texto-suave">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Não pedimos data de nascimento, documentos além do CPF, nem dados sensíveis.{" "}
              <strong>Não vendemos nem alugamos dados a ninguém.</strong>
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Com quem compartilhamos</h2>
            <p className="mt-3">Só com quem precisa para o pedido acontecer, e só o necessário:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Mercado Pago</strong> (pagamento): nome, e-mail, CPF, telefone e endereço de
                cobrança — exigidos pelo processador e pela prevenção à fraude.
              </li>
              <li>
                <strong>Bling</strong> (nosso sistema de gestão e emissão de nota fiscal): dados do pedido e
                da nota.
              </li>
              <li>
                <strong>Melhor Envio e transportadoras</strong> (Correios, Jadlog, J&amp;T, Loggi, Azul):
                nome, endereço e telefone, para entregar.
              </li>
              <li>
                <strong>SEFAZ</strong> (Secretaria da Fazenda): recebe a nota fiscal, como manda a lei.
              </li>
              <li>
                <strong>Hostinger</strong> (hospedagem do site e do e-mail) e <strong>Google</strong>{" "}
                (Analytics/Ads) e <strong>GoatCounter</strong> (contagem de visitas): infraestrutura e
                medição.
              </li>
              <li>Autoridades, quando a lei exigir.</li>
            </ul>
            <p className="mt-3 text-sm text-texto-suave">
              Alguns desses parceiros podem armazenar dados fora do Brasil, seguindo as regras da LGPD para
              transferência internacional.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Por quanto tempo guardamos</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Dados da nota fiscal e do pedido: <strong>5 anos</strong>, prazo que a legislação fiscal
                exige.
              </li>
              <li>
                Registro do pedido no site (nome, e-mail, peças, situação): enquanto durar a garantia e o
                prazo acima; depois é apagado.
              </li>
              <li>
                Dados de navegação: conforme a retenção do Google Analytics (até 14 meses). A contagem de
                visitas do GoatCounter guarda só a página, o tipo de aparelho e a origem do acesso, sem
                identificar você.
              </li>
              <li>E-mails trocados com você: enquanto houver atendimento em aberto e pelo prazo legal.</li>
            </ul>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Seus direitos</h2>
            <p className="mt-3">Você pode, a qualquer momento, pedir:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>confirmação de que tratamos os seus dados e acesso a eles;</li>
              <li>correção de dado incompleto ou errado;</li>
              <li>
                exclusão do que não for obrigatório por lei (os dados da nota fiscal precisam ficar pelo
                prazo legal);
              </li>
              <li>informação sobre com quem compartilhamos;</li>
              <li>revogação de consentimento, quando for o caso.</li>
            </ul>
            <p className="mt-3">
              Basta escrever para{" "}
              <a href={`mailto:${EMAILS.contato}`} className="font-semibold underline underline-offset-4 break-all">
                {EMAILS.contato}
              </a>{" "}
              com o número do pedido (se tiver). Respondemos em até <strong>15 dias</strong>. Se preferir,
              pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Segurança</h2>
            <p className="mt-3">
              O site funciona só em conexão segura (HTTPS). O pagamento acontece na página do Mercado
              Pago, certificada para isso — nenhum número de cartão passa pela Kambada. Os acessos
              internos são protegidos por senha, e os dados do pedido ficam em servidores com acesso
              restrito. Nenhum sistema é infalível; se houver um incidente que afete os seus dados,
              avisaremos você e a ANPD como a lei determina.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Cookies</h2>
            <p className="mt-3">
              Usamos cookies e armazenamento do navegador para: manter o seu carrinho e o tema escolhido
              (essenciais, não identificam você) e para medição de audiência e anúncios (Google Analytics
              e Google Ads). A contagem de visitas do GoatCounter não usa cookies e não roda nas
              páginas do Kambada Play. Você pode apagar ou bloquear cookies nas configurações do navegador; o
              carrinho e o tema deixam de ser lembrados, mas a compra continua funcionando.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Crianças e adolescentes</h2>
            <p className="mt-3">
              O site vende para maiores de 18 anos. Compras de peças infantis são feitas pelos
              responsáveis.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Mudanças nesta política</h2>
            <p className="mt-3">
              Quando mudarmos algo relevante, atualizamos a data no fim desta página. Mudanças grandes
              serão avisadas no site. Veja também os{" "}
              <Link href="/termos" className="font-semibold underline underline-offset-4">
                Termos de Compra
              </Link>
              .
            </p>
          </article>
        </div>

        <p className="mt-10 text-sm text-texto-tenue">Última atualização: 11 de outubro de 2026.</p>
      </div>
    </section>
  );
}
