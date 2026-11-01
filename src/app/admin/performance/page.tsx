import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import MenuAdmin from "@/components/admin/MenuAdmin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { duracao, listarTelas, resumirTelas } from "@/lib/play/telas";
import { listarRegistros } from "@/lib/pedidos/registro";
import { filtrarPorDias, listarVisitas, resumirVisitas } from "@/lib/visitas/visitas";

export const metadata: Metadata = { title: "Performance do site", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Performance do site (Alexandre, 01/11/2026): visitas, cliques, páginas mais
 * vistas, tempo de tela, produtos, canal de origem e conversão. Fica SEPARADA de
 * "Pesquisa e dados" (/admin/dados), que guarda o que as pessoas respondem e serve
 * à prestação da FAPEMA. Aqui é só o comportamento no site, anônimo (sem cookie,
 * IP nem terceiros) — ver lib/visitas e lib/play/telas.
 */

const CARTAO = "rounded-2xl border border-borda bg-superficie p-5";
const PERIODOS = [
  { chave: "hoje", rotulo: "Hoje", dias: 1 },
  { chave: "7", rotulo: "7 dias", dias: 7 },
  { chave: "30", rotulo: "30 dias", dias: 30 },
  { chave: "tudo", rotulo: "Tudo", dias: null },
] as const;

const diaSaoLuis = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

function Tabela({ titulo, nota, cab, linhas }: { titulo: string; nota?: string; cab: string[]; linhas: (string | number)[][] }) {
  return (
    <div className={`${CARTAO} mt-3 overflow-x-auto`}>
      <h3 className="font-display font-bold">{titulo}</h3>
      {nota ? <p className="mt-1 text-xs text-texto-suave">{nota}</p> : null}
      {linhas.length === 0 ? (
        <p className="mt-2 text-sm text-texto-suave">Sem dados no período.</p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-xs text-texto-suave">
            <tr>{cab.map((c) => <th key={c} className="py-1 pr-3">{c}</th>)}</tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-t border-borda">
                {l.map((c, j) => <td key={j} className="py-1 pr-3">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function PaginaPerformance({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  if (!adminConfigurado()) return <p className="px-4 py-16 text-center">A área de controle ainda não tem senha (ADMIN_SENHA).</p>;
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Performance do site</h1>
        <FormularioLogin />
      </section>
    );
  }

  const { periodo: pedido } = await searchParams;
  const periodo = PERIODOS.find((p) => p.chave === pedido) ?? PERIODOS[1];
  const agora = new Date();

  const [eventos, registros, eventosTelas] = await Promise.all([listarVisitas(), listarRegistros(10000), listarTelas()]);
  const doPeriodo = filtrarPorDias(eventos, periodo.dias, agora);
  const limite = periodo.dias ? diaSaoLuis(new Date(agora.getTime() - (periodo.dias - 1) * 86_400_000)) : null;
  const v = resumirVisitas(
    doPeriodo,
    registros
      .filter((p) => !limite || diaSaoLuis(new Date(p.criadoEm)) >= limite)
      .map((p) => ({
        criadoEm: p.criadoEm,
        cancelado: Boolean(p.cancelamento?.concluidoEm || p.estorno),
        itens: p.itens,
        fonte: p.atribuicao?.fonte,
        meio: p.atribuicao?.meio,
      })),
  );
  const telas = resumirTelas(limite ? eventosTelas.filter((e) => diaSaoLuis(new Date(e.em)) >= limite) : eventosTelas);

  const cartoes: [string, string | number][] = [
    ["Visitas (sessões)", v.sessoes],
    ["Páginas vistas", v.paginasVistas],
    ["Cliques em links e botões", v.cliques],
    ["Iniciaram checkout", v.checkouts],
    ["Pedidos pagos", v.pedidos],
    ["Conversão", `${v.conversao ?? "—"}%`],
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuAdmin ativa="performance" />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Performance do site</h1>
          <p className="mt-1 max-w-3xl text-texto-suave">
            Como as pessoas usam o site: visitas, cliques, páginas, produtos, tempo de tela e de onde vêm. Medição própria e anônima
            (sem cookie, IP nem terceiros). As respostas da pesquisa ficam em “Pesquisa e dados (FAPEMA)”.
            {v.periodo ? ` Medido de ${v.periodo.de} a ${v.periodo.ate}.` : ""}
          </p>
        </div>
        <nav aria-label="Período" className="flex gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.chave}
              href={`/admin/performance?periodo=${p.chave}`}
              aria-current={p.chave === periodo.chave ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                p.chave === periodo.chave ? "bg-kambada-amarelo text-kambada-grafite" : "border border-borda hover:border-kambada-amarelo-escuro"
              }`}
            >
              {p.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cartoes.map(([k, valor]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{valor}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-texto-suave">
        Visita (sessão) = primeira página de cada visita. Conversão = pedidos pagos ÷ visitas, só de pedidos feitos depois que a medição começou.
        O app do Instagram às vezes não informa a origem e a visita cai em “Direto”: use links com{" "}
        <code>?utm_source=instagram&amp;utm_medium=social</code>.
      </p>

      <Tabela
        titulo="De onde vêm as visitas"
        cab={["Canal", "Visitas", "Pedidos", "Conversão"]}
        linhas={v.canais.map((c) => [c.canal, c.sessoes, c.pedidos, c.conversao === null ? "—" : `${c.conversao}%`])}
      />
      <Tabela
        titulo="Produtos mais vistos"
        nota="Vistas = abriu a página do produto (1 por visita). Carrinho = colocou no carrinho. Vendidas = unidades em pedidos pagos. % compra = vendidas ÷ vistas."
        cab={["Produto", "Vistas", "Carrinho", "% carrinho", "Vendidas", "% compra"]}
        linhas={v.produtos.slice(0, 30).map((p) => [
          p.produto, p.vistas, p.carrinho, p.pctCarrinho === null ? "—" : `${p.pctCarrinho}%`, p.vendidas, p.pctCompra === null ? "—" : `${p.pctCompra}%`,
        ])}
      />
      <Tabela
        titulo="Páginas mais vistas e tempo de tela"
        cab={["Página", "Vistas", "Tempo médio"]}
        linhas={v.paginas.slice(0, 30).map((p) => [p.caminho, p.vistas, p.segMedio === null ? "—" : duracao(p.segMedio)])}
      />
      <Tabela
        titulo="Cliques mais dados"
        nota="Texto do link ou botão e para onde leva. Só do site (o Play não registra cliques)."
        cab={["Clique em", "Leva para", "Cliques"]}
        linhas={v.topCliques.slice(0, 30).map((c) => [c.rotulo, c.destino ?? "—", c.cliques])}
      />

      <h2 className="mt-10 font-display text-xl font-bold">Kambada Play: telas mais vistas e tempo de tela</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Medição própria à parte (só a tela e os segundos, sem conta nem terceiros). Login, confirmação e conta não entram.
      </p>
      <Tabela
        titulo="Telas do Play"
        cab={["Tela", "Visitas", "Tempo médio", "Mediana", "Tempo total"]}
        linhas={telas.linhas.map((l) => [
          l.tela.replace("/kambadaplay", "") || "/ (início)", l.visitas, duracao(l.segMedio), duracao(l.segMediana), duracao(l.segTotal),
        ])}
      />
    </section>
  );
}
