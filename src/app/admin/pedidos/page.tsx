import type { Metadata } from "next";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { situacaoNoBling } from "@/lib/checkout/acompanhar";
import { emailConfigurado } from "@/lib/email/enviar";
import { formatarReais } from "@/lib/loja/dinheiro";
import { listarRegistros, type Etapa, type RegistroPedido } from "@/lib/pedidos/registro";
import { refazerPendencias, sair } from "../acoes";

export const metadata: Metadata = {
  title: "Pedidos do site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Controle dos pedidos do site — só para a loja (senha em ADMIN_SENHA).
 *
 * Mostra cada venda paga pelo site com o que o site fez depois dela (registro,
 * estoque, nota, e-mail) e a situação ATUAL no Bling. Para mudar a situação,
 * separar, emitir nota ou etiqueta, o lugar continua sendo o Bling — o botão
 * "abrir no Bling" leva direto ao pedido. Assim não há dois cadastros
 * divergindo.
 */

const dataLocal = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Selo({ nome, etapa, desligada }: { nome: string; etapa?: Etapa; desligada?: boolean }) {
  const [cor, texto] = desligada
    ? ["border border-borda text-texto-tenue", "desligado"]
    : etapa?.feitoEm
      ? ["bg-kambada-amarelo text-kambada-grafite", "ok"]
      : etapa?.erro
        ? ["border border-red-500 text-red-500", "falhou"]
        : ["border border-borda text-texto-tenue", "pendente"];
  return (
    <span title={etapa?.erro ? `${etapa.erro}${etapa.detalhe ? ` — ${etapa.detalhe}` : ""}` : undefined}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}>
      {nome}: {texto}
    </span>
  );
}

async function comSituacao(registros: RegistroPedido[]) {
  // Situação ao vivo no Bling para os 30 mais recentes (limite de 3 req/s do Bling).
  return Promise.all(
    registros.map(async (r, i) => {
      if (i >= 30) return { r, situacao: "—" };
      try {
        return { r, situacao: (await situacaoNoBling(r.bling.idPedido)).situacao };
      } catch {
        return { r, situacao: "Bling indisponível" };
      }
    }),
  );
}

export default async function PaginaAdminPedidos() {
  if (!adminConfigurado()) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Pedidos do site</h1>
        <p className="mt-4 text-texto-suave">
          A área de controle ainda não tem senha. No painel da Hostinger, crie a variável{" "}
          <code className="font-mono">ADMIN_SENHA</code> (mínimo 8 caracteres) e reimplante.
        </p>
      </section>
    );
  }

  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Pedidos do site</h1>
        <FormularioLogin />
      </section>
    );
  }

  const linhas = await comSituacao(await listarRegistros(200));
  const total = linhas.reduce((s, l) => s + l.r.total, 0);
  const emailLigado = emailConfigurado();
  const notaLigada = process.env.BLING_EMITIR_NFE === "1";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Pedidos do site</h1>
          <p className="mt-1 text-texto-suave">
            {linhas.length} {linhas.length === 1 ? "pedido" : "pedidos"} · {formatarReais(total)} pagos pelo site
          </p>
        </div>
        <form action={sair}>
          <button type="submit" className="rounded-full border border-borda px-5 py-2 text-sm font-semibold hover:border-kambada-amarelo-escuro">
            Sair
          </button>
        </form>
      </div>

      <p className="mt-4 rounded-xl bg-superficie px-4 py-3 text-sm text-texto-suave">
        Mudar situação, separar, emitir nota e etiqueta: no Bling (botão em cada pedido). E-mail de
        confirmação: <strong>{emailLigado ? "ligado" : "desligado"}</strong> · Nota fiscal automática:{" "}
        <strong>{notaLigada ? "ligada" : "desligada"}</strong>.
      </p>

      {linhas.length === 0 ? (
        <p className="mt-10 text-texto-suave">Nenhum pedido registrado ainda.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {linhas.map(({ r, situacao }) => {
            const pendente =
              !r.estoque?.feitoEm || (emailLigado && (!r.email?.feitoEm || !r.emailLoja?.feitoEm)) || (notaLigada && !r.nfe?.feitoEm);
            return (
              <li key={r.ref} className="rounded-2xl border border-borda bg-superficie p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold">{r.ref}</p>
                    <p className="text-sm text-texto-suave">
                      {dataLocal(r.criadoEm)} · {r.cliente.nome} · {r.cliente.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold">{formatarReais(r.total)}</p>
                    <p className="text-sm font-semibold">Bling: {situacao}</p>
                  </div>
                </div>

                <ul className="mt-3 text-sm">
                  {r.itens.map((i) => (
                    <li key={`${r.ref}-${i.id}`}>
                      {i.quantidade}× {i.nome} — {formatarReais(i.preco * i.quantidade)}
                    </li>
                  ))}
                  <li className={r.entrega.retirada ? "font-semibold" : "text-texto-suave"}>
                    {r.entrega.retirada
                      ? "RETIRADA NO ATELIÊ"
                      : `${r.entrega.descricao} — ${r.entrega.valor > 0 ? formatarReais(r.entrega.valor) : "frete grátis"}`}
                  </li>
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Selo nome="Estoque" etapa={r.estoque} />
                  <Selo nome="E-mail cliente" etapa={r.email} desligada={!emailLigado && !r.email} />
                  <Selo nome="Aviso loja" etapa={r.emailLoja} desligada={!emailLigado && !r.emailLoja} />
                  <Selo nome="Nota" etapa={r.nfe} desligada={!notaLigada && !r.nfe} />
                  <a
                    href={`https://www.bling.com.br/vendas.php#edit/${r.bling.idPedido}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto rounded-full bg-kambada-amarelo px-4 py-1.5 text-sm font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
                  >
                    Abrir no Bling
                  </a>
                  {pendente && (
                    <form action={refazerPendencias}>
                      <input type="hidden" name="pagamento" value={r.pagamentoId} />
                      <button type="submit" className="rounded-full border border-borda px-4 py-1.5 text-sm font-semibold hover:border-kambada-amarelo-escuro">
                        Refazer pendências
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
