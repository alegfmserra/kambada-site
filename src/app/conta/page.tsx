import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AcoesDaConta } from "@/components/conta/AcoesDaConta";
import { pedidosDaConta } from "@/lib/conta/pedidosDaConta";
import { linkDeRastreio } from "@/lib/email/posVenda";
import { formatarReais } from "@/lib/loja/dinheiro";
import { linkWhatsApp } from "@/lib/site";
import { COOKIE_SESSAO, lerSessao } from "@/lib/play/acesso";
import { buscarPorId } from "@/lib/play/contas";
import { listarRegistros } from "@/lib/pedidos/registro";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Minha conta da loja — pedido do Alexandre (20/10/2026): ícone de perfil ao
 * lado do carrinho; a pessoa vê a conta, os pedidos vinculados ao e-mail, o
 * plano, a forma de pagamento e os pedidos recorrentes.
 *
 * A conta é a do Kambada Play (mesmo cookie, mesmo cadastro). Plano pago,
 * cartão guardado e pedido recorrente ainda não existem: a cobrança começa em
 * 01/01/2027 (Mercado Pago Assinaturas). Até lá a página diz isso com clareza,
 * em vez de mostrar botão que não faz nada.
 */
export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ bemvindo?: string; semEmail?: string }>;
}) {
  const p = await searchParams;
  const sessao = lerSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  const conta = sessao?.v === 2 ? await buscarPorId(sessao.conta) : null;
  if (!conta) redirect("/entrar?de=/conta");

  const pedidos = pedidosDaConta(await listarRegistros(1000), conta);
  const recorrencia = linkWhatsApp("Oi, Kambada! Tenho conta no site e quero combinar um pedido recorrente.");

  return (
    <section>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">
          Minha <span className="destaque">conta</span>
        </h1>
        <p className="mt-3 text-lg text-texto-suave">Éguas, {conta.nome}! Aqui fica tudo o que é seu na Kambada.</p>

        {p.bemvindo === "1" ? (
          <p role="status" className="mt-6 rounded-xl border-2 border-kambada-amarelo bg-kambada-amarelo/15 p-4 text-texto">
            <strong>Conta criada.</strong>{" "}
            {p.semEmail === "1"
              ? "Não conseguimos mandar o e-mail de confirmação agora; peça de novo abaixo."
              : "Mandamos um e-mail para confirmar seu endereço. Confirme para seus pedidos aparecerem aqui."}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-borda bg-superficie p-6">
            <h2 className="font-display text-xl font-bold">Meus dados</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">Nome</dt>
                <dd className="font-semibold">{conta.nome}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">E-mail</dt>
                <dd className="break-all font-semibold">{conta.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-texto-suave">Situação</dt>
                <dd className="font-semibold">{conta.confirmadoEm ? "E-mail confirmado" : "E-mail não confirmado"}</dd>
              </div>
            </dl>
            <AcoesDaConta confirmado={Boolean(conta.confirmadoEm)} novidades={conta.novidades} />
          </article>

          <article className="rounded-2xl border border-borda bg-superficie p-6">
            <h2 className="font-display text-xl font-bold">Meu plano</h2>
            <p className="mt-4 text-sm text-texto-suave">
              <span className="font-semibold text-texto">Grátis.</span> Tudo do Kambada Play liberado até 31/12/2026.
              Os planos Família e Brincante (com cupons todo mês) começam em 01/01/2027.
            </p>
            <Link
              href="/kambadaplay/planos"
              className="mt-4 inline-block rounded-full bg-kambada-amarelo px-6 py-2.5 text-sm font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Conhecer os planos
            </Link>

            <h3 className="mt-8 font-display text-lg font-bold">Forma de pagamento</h3>
            <p className="mt-2 text-sm text-texto-suave">
              Nenhuma cadastrada. Hoje você paga cada pedido no checkout, por Pix ou cartão, pelo Mercado Pago, e a
              Kambada não guarda dados de cartão. Quando as assinaturas começarem, o cartão da assinatura fica
              cadastrado no Mercado Pago e aparece aqui.
            </p>
          </article>
        </div>

        <article className="mt-6 rounded-2xl border border-borda bg-superficie p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Meus pedidos</h2>
            <Link href="/pedido" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
              Acompanhar pelo número →
            </Link>
          </div>
          {!conta.confirmadoEm ? (
            <p className="mt-4 text-sm text-texto-suave">
              Confirme seu e-mail para ver aqui os pedidos feitos com ele. É o que garante que só você vê os seus.
            </p>
          ) : pedidos.length === 0 ? (
            <p className="mt-4 text-sm text-texto-suave">
              Nenhum pedido com {conta.email} ainda.{" "}
              <Link href="/loja" className="font-semibold text-[var(--destaque-texto)] hover:underline">
                Bora vestir o Maranhão?
              </Link>
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-borda">
              {pedidos.map((pedido) => (
                <li key={pedido.ref} className="flex flex-wrap items-start justify-between gap-3 py-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {pedido.ref}
                      <span className="ml-2 font-normal text-texto-tenue">
                        {new Date(pedido.criadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}
                      </span>
                    </p>
                    <p className="mt-1 text-texto-suave">{pedido.itens.join(" · ")}</p>
                    <p className="mt-1 font-semibold">{pedido.situacao}</p>
                    {pedido.rastreio ? (
                      <a
                        href={linkDeRastreio(pedido.rastreio.codigo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[var(--destaque-texto)] hover:underline"
                      >
                        Rastrear ({pedido.rastreio.transportadora} {pedido.rastreio.codigo})
                      </a>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold">{formatarReais(pedido.total)}</p>
                    <Link
                      href={`/pedido?ref=${pedido.ref}`}
                      className="text-[var(--destaque-texto)] hover:underline"
                    >
                      Detalhes
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="mt-6 rounded-2xl border border-borda bg-superficie p-6">
          <h2 className="font-display text-xl font-bold">Pedidos recorrentes</h2>
          <p className="mt-3 text-sm text-texto-suave">
            Quer receber as mesmas peças com frequência (brindes da empresa, revenda, presentes do mês)? Por enquanto
            a gente combina pelo WhatsApp e separa para você. A programação automática na conta vem junto com as
            assinaturas.
          </p>
          <a
            href={recorrencia}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full border-2 border-borda px-6 py-2.5 text-sm font-bold transition-colors hover:border-kambada-amarelo"
          >
            Combinar pedido recorrente
          </a>
        </article>
      </div>
    </section>
  );
}
