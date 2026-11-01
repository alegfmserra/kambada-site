import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import MenuAdmin from "@/components/admin/MenuAdmin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { formatarReais } from "@/lib/loja/dinheiro";
import { duracao, listarTelas, resumirTelas } from "@/lib/play/telas";
import { listarRegistros, type RegistroPedido } from "@/lib/pedidos/registro";
import { analisarVisitas, avaliarVital, variacao } from "@/lib/visitas/analise";
import { diaSaoLuis, listarVisitas, resumirVisitas, type EventoVisita, type NomeVital } from "@/lib/visitas/visitas";

export const metadata: Metadata = { title: "Performance do site", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Performance do site (Alexandre, 01/11/2026): visitas, cliques, páginas, produtos,
 * tempo de tela, canal de origem, funil, velocidade real, aparelho, horário e 404.
 * Fica SEPARADA de "Pesquisa e dados" (/admin/dados), que guarda o que as pessoas
 * respondem e serve à prestação da FAPEMA. Aqui é só o comportamento no site, anônimo
 * (sem cookie, IP nem terceiros) — ver lib/visitas e lib/play/telas.
 */

const CARTAO = "rounded-2xl border border-borda bg-superficie p-5";
const PERIODOS = [
  { chave: "hoje", rotulo: "Hoje", dias: 1 },
  { chave: "7", rotulo: "7 dias", dias: 7 },
  { chave: "30", rotulo: "30 dias", dias: 30 },
  { chave: "tudo", rotulo: "Tudo", dias: null },
] as const;

const brData = (dia: string) => dia.split("-").reverse().join("/");
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const diaDaSemana = (dia: string) => DIAS_SEMANA[new Date(`${dia}T12:00:00Z`).getUTCDay()];
const pcto = (n: number | null) => (n === null ? "—" : `${n}%`);

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

/** "1,8 s · bom" a partir do valor p75; CLS é adimensional. */
function vital(nome: NomeVital, valor: number | null): string {
  if (valor === null) return "—";
  const nivel = avaliarVital(nome, valor);
  const txt = nome === "CLS" ? valor.toFixed(2).replace(".", ",") : valor >= 1000 ? `${(valor / 1000).toFixed(1).replace(".", ",")} s` : `${Math.round(valor)} ms`;
  return `${txt} · ${nivel}`;
}

const pedidoMedido = (p: RegistroPedido) => ({
  criadoEm: p.criadoEm,
  cancelado: Boolean(p.cancelamento?.concluidoEm || p.estorno),
  itens: p.itens,
  total: p.total,
  fonte: p.atribuicao?.fonte,
  meio: p.atribuicao?.meio,
});

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
  const diaAtras = (n: number) => diaSaoLuis(new Date(agora.getTime() - n * 86_400_000));

  const [eventos, registros, eventosTelas] = await Promise.all([listarVisitas(), listarRegistros(10000), listarTelas()]);
  // Janela atual e a anterior de mesmo tamanho (para comparar).
  const de = periodo.dias ? diaAtras(periodo.dias - 1) : null;
  const dePrev = periodo.dias ? diaAtras(periodo.dias * 2 - 1) : null;
  const naJanela = (iso: string, ini: string | null, fim: string | null) => {
    const d = diaSaoLuis(iso);
    return (!ini || d >= ini) && (!fim || d < fim);
  };
  const doPeriodo: EventoVisita[] = eventos.filter((e) => naJanela(e.em, de, null));
  const doAnterior: EventoVisita[] = periodo.dias ? eventos.filter((e) => naJanela(e.em, dePrev, de)) : [];
  const pedidosPeriodo = registros.filter((p) => naJanela(p.criadoEm, de, null)).map(pedidoMedido);
  const pedidosAnterior = periodo.dias ? registros.filter((p) => naJanela(p.criadoEm, dePrev, de)).map(pedidoMedido) : [];

  const v = resumirVisitas(doPeriodo, pedidosPeriodo);
  const a = analisarVisitas(doPeriodo, pedidosPeriodo);
  const antes = periodo.dias ? resumirVisitas(doAnterior, pedidosAnterior) : null;
  const telas = resumirTelas(de ? eventosTelas.filter((e) => naJanela(e.em, de, null)) : eventosTelas);

  const delta = (atual: number, anterior: number | undefined) => {
    if (!antes || anterior === undefined) return null;
    const d = variacao(atual, anterior);
    const base = periodo.dias === 1 ? "vs. ontem (dia inteiro)" : "vs. período anterior";
    return d === null ? (atual ? "novo" : null) : `${d > 0 ? "▲" : d < 0 ? "▼" : "="} ${Math.abs(d)}% ${base}`;
  };
  const cartoes: [string, string | number, string | null][] = [
    ["Visitas (sessões)", v.sessoes, delta(v.sessoes, antes?.sessoes)],
    ["Páginas vistas", v.paginasVistas, delta(v.paginasVistas, antes?.paginasVistas)],
    ["Cliques em links e botões", v.cliques, delta(v.cliques, antes?.cliques)],
    ["Iniciaram checkout", v.checkouts, delta(v.checkouts, antes?.checkouts)],
    ["Pedidos pagos", v.pedidos, delta(v.pedidos, antes?.pedidos)],
    ["Conversão", pcto(v.conversao), null],
  ];
  const f = a.funil;
  const etapa = (rotulo: string, n: number) => [rotulo, n, pcto(f.sessoes ? Math.round((n / f.sessoes) * 1000) / 10 : null)];
  const horaPico = [...a.horas].sort((x, y) => y.sessoes - x.sessoes)[0];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuAdmin ativa="performance" />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Performance do site</h1>
          <p className="mt-1 max-w-3xl text-texto-suave">
            Como as pessoas usam o site: visitas, cliques, páginas, produtos, tempo de tela, de onde vêm e a velocidade real. Medição própria e anônima
            (sem cookie, IP nem terceiros). As respostas da pesquisa ficam em “Pesquisa e dados (FAPEMA)”.
            {v.periodo ? ` Medido de ${brData(v.periodo.de)} a ${brData(v.periodo.ate)} (horário de São Luís).` : " Ainda sem dados no período."}
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
        {cartoes.map(([k, valor, d]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{valor}</p>
            {d ? <p className="mt-1 text-[11px] text-texto-suave">{d}</p> : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-texto-suave">
        Visita (sessão) = primeira página de cada visita. Conversão = pedidos pagos ÷ visitas, só de pedidos feitos depois que a medição começou.
        O app do Instagram às vezes não informa a origem e a visita cai em “Direto”: use links com{" "}
        <code>?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=nome-da-campanha</code>. Robôs e buscadores são descartados.
      </p>

      <Tabela
        titulo="Acessos por dia"
        nota="Dia no horário de São Luís (a virada é à meia-noite daqui, não do servidor)."
        cab={["Dia", "Visitas", "Páginas vistas", "Cliques", "Pedidos"]}
        linhas={v.porDia.map((d) => [`${brData(d.dia)} (${diaDaSemana(d.dia)})`, d.sessoes, d.paginasVistas, d.cliques, d.pedidos])}
      />

      <h2 className="mt-10 font-display text-xl font-bold">Funil e qualidade da visita</h2>
      <Tabela
        titulo="Funil por visita"
        nota="Cada linha conta visitas distintas que chegaram àquela etapa (só visitas com número, a partir desta versão). % = parte das visitas."
        cab={["Etapa", "Visitas", "% das visitas"]}
        linhas={[etapa("Entraram no site", f.sessoes), etapa("Viram um produto", f.produto), etapa("Colocaram no carrinho", f.carrinho), etapa("Iniciaram checkout", f.checkout), etapa("Compraram", f.compra)]}
      />
      <Tabela
        titulo="Qualidade da visita"
        nota="Rejeição = visitas que viram uma página só e saíram. Páginas e tempo por visita ajudam a ver se o conteúdo prende."
        cab={["Rejeição", "Páginas por visita", "Tempo por visita"]}
        linhas={[[pcto(a.qualidade.rejeicao), a.qualidade.paginasPorSessao ?? "—", a.qualidade.segPorSessao === null ? "—" : duracao(a.qualidade.segPorSessao)]]}
      />

      <h2 className="mt-10 font-display text-xl font-bold">De onde vêm e quanto rendem</h2>
      <Tabela
        titulo="Canais: visitas, receita e abandono de carrinho"
        nota="Pedidos e receita vêm dos pedidos pagos (canal guardado no pedido, últimos 30 dias). Abandono = visitas com carrinho que não compraram."
        cab={["Canal", "Visitas", "Pedidos", "Conversão", "Receita", "Ticket médio", "Com carrinho", "Sem compra", "Abandono"]}
        linhas={a.canais.map((c) => [c.canal, c.sessoes, c.pedidos, pcto(c.conversao), formatarReais(c.receita), c.ticket === null ? "—" : formatarReais(c.ticket), c.comCarrinho, c.semCompra, pcto(c.abandono)])}
      />
      <Tabela
        titulo="Campanhas (utm_campaign)"
        nota="Separa, por exemplo, bio, story e anúncio do mesmo canal. Só aparece quando o link tem utm_campaign."
        cab={["Canal", "Campanha", "Visitas"]}
        linhas={a.campanhas.map((c) => [c.canal, c.campanha, c.sessoes])}
      />

      <h2 className="mt-10 font-display text-xl font-bold">Produtos, páginas e cliques</h2>
      <Tabela
        titulo="Produtos mais vistos"
        nota="Vistas = abriu a página do produto (1 por visita). Carrinho = colocou no carrinho. Vendidas = unidades em pedidos pagos. % compra = vendidas ÷ vistas."
        cab={["Produto", "Vistas", "Carrinho", "% carrinho", "Vendidas", "% compra"]}
        linhas={v.produtos.slice(0, 30).map((p) => [p.produto, p.vistas, p.carrinho, pcto(p.pctCarrinho), p.vendidas, pcto(p.pctCompra)])}
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

      <h2 className="mt-10 font-display text-xl font-bold">Aparelho, horário e velocidade</h2>
      <Tabela
        titulo="Celular, tablet ou computador"
        cab={["Aparelho", "Visitas", "% das visitas"]}
        linhas={a.aparelhos.map((x) => [x.aparelho, x.sessoes, pcto(x.pct)])}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Tabela
          titulo="Horário das visitas (São Luís)"
          nota={horaPico && horaPico.sessoes ? `Pico às ${String(horaPico.hora).padStart(2, "0")}h.` : undefined}
          cab={["Hora", "Visitas"]}
          linhas={a.horas.filter((h) => h.sessoes > 0).map((h) => [`${String(h.hora).padStart(2, "0")}h`, h.sessoes])}
        />
        <Tabela
          titulo="Dia da semana"
          cab={["Dia", "Visitas"]}
          linhas={a.semana.filter((d) => d.sessoes > 0).map((d) => [DIAS_SEMANA[d.dia], d.sessoes])}
        />
      </div>
      <Tabela
        titulo="Velocidade real por aparelho"
        nota="Medida em quem usa o site (percentil 75). LCP = quando o conteúdo principal aparece; INP = resposta ao toque/clique; CLS = pulo do layout. Metas do Google: LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1."
        cab={["Aparelho", "LCP", "INP", "CLS", "Amostras"]}
        linhas={a.velocidadePorAparelho.map((x) => [x.aparelho, vital("LCP", x.lcp), vital("INP", x.inp), vital("CLS", x.cls), x.amostras])}
      />
      <Tabela
        titulo="Velocidade real por página (as mais medidas)"
        cab={["Página", "LCP", "INP", "CLS", "Amostras"]}
        linhas={a.velocidade.slice(0, 20).map((x) => [x.caminho, vital("LCP", x.lcp), vital("INP", x.inp), vital("CLS", x.cls), x.amostras])}
      />

      <h2 className="mt-10 font-display text-xl font-bold">Links quebrados</h2>
      <Tabela
        titulo="Páginas que deram 404"
        nota="Endereços que as pessoas abriram e não existem (link antigo, erro de digitação ou link quebrado em algum lugar)."
        cab={["Endereço", "Vezes"]}
        linhas={a.erros404.slice(0, 30).map((e) => [e.caminho, e.vezes])}
      />

      <h2 className="mt-10 font-display text-xl font-bold">Kambada Play: telas mais vistas e tempo de tela</h2>
      <p className="mt-1 text-sm text-texto-suave">
        Medição própria à parte (só a tela e os segundos, sem conta nem terceiros). Login, confirmação e conta não entram.
      </p>
      <Tabela
        titulo="Telas do Play"
        cab={["Tela", "Visitas", "Tempo médio", "Mediana", "Tempo total"]}
        linhas={telas.linhas.map((l) => [l.tela.replace("/kambadaplay", "") || "/ (início)", l.visitas, duracao(l.segMedio), duracao(l.segMediana), duracao(l.segTotal)])}
      />
    </section>
  );
}
