import type { Metadata } from "next";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import MenuAdmin from "@/components/admin/MenuAdmin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { listarAvaliacoes, type Avaliacao } from "@/lib/avaliacoes/avaliacoes";
import { moderarAvaliacaoDoPainel } from "../acoes";

export const metadata: Metadata = {
  title: "Avaliações",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });

/**
 * Avaliações de peça — só para a loja (mesma senha dos pedidos).
 *
 * Regra da moderação: aprovar tudo, boa ou ruim. Recusar só ofensa, dado
 * pessoal ou texto que não fala da peça. Sem a autorização do cliente, a
 * avaliação aprovada conta só para a loja e não aparece no site.
 */
export default async function PaginaAvaliacoes() {
  if (!adminConfigurado()) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Avaliações</h1>
        <p className="mt-4 text-texto-suave">Configure a variável ADMIN_SENHA no painel da Hostinger.</p>
      </section>
    );
  }
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Avaliações</h1>
        <FormularioLogin />
      </section>
    );
  }

  const todas = await listarAvaliacoes();
  const pendentes = todas.filter((a) => a.status === "pendente");
  const moderadas = todas.filter((a) => a.status !== "pendente");

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <MenuAdmin ativa="avaliacoes" />
      <div>
        <h1 className="font-display text-3xl font-extrabold">Avaliações</h1>
        <p className="mt-1 text-texto-suave">
          Aprove tudo, boa ou ruim. Recuse só ofensa, dado pessoal ou texto que não fala da peça — esconder avaliação ruim
          engana quem compra.
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold">Aguardando ({pendentes.length})</h2>
        {pendentes.length === 0 ? (
          <p className="mt-2 text-texto-suave">Nada esperando aprovação.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendentes.map((a) => (
              <Linha key={a.id} a={a} />
            ))}
          </ul>
        )}
      </div>

      {moderadas.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">Já moderadas ({moderadas.length})</h2>
          <ul className="mt-4 space-y-3">
            {moderadas.slice(0, 100).map((a) => (
              <Linha key={a.id} a={a} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Linha({ a }: { a: Avaliacao }) {
  const botao = (decisao: "aprovada" | "recusada", rotulo: string) => (
    <form action={moderarAvaliacaoDoPainel}>
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="decisao" value={decisao} />
      <button
        type="submit"
        className={`rounded-full px-4 py-2 text-sm font-semibold ${
          decisao === "aprovada" ? "bg-kambada-amarelo text-kambada-grafite" : "border border-borda hover:border-kambada-amarelo-escuro"
        }`}
      >
        {rotulo}
      </button>
    </form>
  );
  return (
    <li className="rounded-2xl border border-borda p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold">
            <span className="text-kambada-amarelo-escuro">{"★".repeat(a.nota)}{"☆".repeat(5 - a.nota)}</span> {a.produtoNome}
            {a.opcao ? <span className="font-normal text-texto-suave"> ({a.opcao})</span> : null}
          </p>
          {a.texto && <p className="mt-1">{a.texto}</p>}
          <p className="mt-1 text-xs text-texto-tenue">
            {a.nome} · pedido {a.pedido} · {quando(a.em)} · {a.autorizaPublicar ? "autorizou publicar" : "NÃO autorizou publicar"}
            {a.status !== "pendente" ? ` · ${a.status}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {a.status !== "aprovada" && botao("aprovada", "Aprovar")}
          {a.status !== "recusada" && botao("recusada", "Recusar")}
        </div>
      </div>
    </li>
  );
}
