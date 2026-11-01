import type { Metadata } from "next";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import MenuAdmin from "@/components/admin/MenuAdmin";
import { conversaoPorOrigem, reunirDados, resumoGeral } from "@/lib/admin/dados";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { formatarReais } from "@/lib/loja/dinheiro";

export const metadata: Metadata = { title: "Dados do site", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Dados do site num lugar só (Alexandre, 21/10/2026): pesquisa de satisfação
 * (com o indicativo de assinatura do Play e as sugestões de conteúdo), contas,
 * pedidos, cupons e Kambada Play — e o botão que baixa tudo numa planilha.
 */

const CARTAO = "rounded-2xl border border-borda bg-superficie p-5";

function Contagem({ titulo, dados }: { titulo: string; dados: Record<string, number> }) {
  const total = Object.values(dados).reduce((a, b) => a + b, 0);
  const linhas = Object.entries(dados).sort((a, b) => b[1] - a[1]);
  return (
    <div className={CARTAO}>
      <h3 className="font-display font-bold">{titulo}</h3>
      {linhas.length === 0 ? (
        <p className="mt-2 text-sm text-texto-suave">Sem respostas ainda.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {linhas.map(([k, v]) => (
            <li key={k} className="flex items-center gap-2">
              <span className="w-44 shrink-0">{k}</span>
              <span className="h-2 rounded-full bg-kambada-amarelo" style={{ width: `${Math.max(4, (v / total) * 160)}px` }} />
              <span className="font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function PaginaDados() {
  if (!adminConfigurado()) return <p className="px-4 py-16 text-center">A área de controle ainda não tem senha (ADMIN_SENHA).</p>;
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Dados do site</h1>
        <FormularioLogin />
      </section>
    );
  }

  const d = await reunirDados();
  const r = resumoGeral(d);
  const sugestoes = d.respostas.filter((x) => x.sugestao || x.problema || x.comentario).slice(-15).reverse();
  const numeros: [string, string | number][] = [
    ["Pedidos válidos", r.pedidosValidos],
    ["Faturado no site", formatarReais(r.faturado)],
    ["Contas criadas", r.contas],
    ["Confirmadas · aceitam novidades", `${r.contasConfirmadas} · ${r.aceitamNovidades}`],
    ["Respostas da pesquisa", r.respostas],
    ["Nota média do site", r.notaMedia ?? "—"],
    ["Jogadores no Play", r.jogadoresPlay],
    ["Cupons ativos", r.cuponsAtivos],
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuAdmin ativa="dados" />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Dados do site</h1>
          <p className="mt-1 text-texto-suave">Tudo o que o site guarda, num lugar só. Uso interno — contém dados pessoais (LGPD).</p>
        </div>
        <a href="/admin/exportar" className="rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
          ⬇ Baixar tudo (Excel)
        </a>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {numeros.map(([k, v]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{v}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-xl font-bold">Pesquisa de satisfação do site</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Contagem titulo="Assinaria o Kambada Play? (indicativo de pagamento)" dados={r.assinaria} />
        <Contagem titulo="Quanto o Play vale para a pessoa" dados={r.valorPlay} />
        <Contagem titulo="Como conheceu a Kambada" dados={r.origem} />
        <Contagem titulo="O que mais curtiu no site" dados={r.curtiu} />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Indicadores MIT / MaraInTech (FAPEMA)</h2>
      <p className="mt-1 text-sm text-texto-suave">Vêm do bloco “Ajude a validar o Kambada Play” da pesquisa. Cada número mostra o n (quem respondeu aquela pergunta).</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["F1.2 Falta material (n)", `${r.mit.F1_2_confirmaDor.pct ?? "—"}% (${r.mit.F1_2_confirmaDor.n})`],
            ["F2.2 Sem ajuda (n)", `${r.mit.F2_2_conseguiu.pctSemAjuda ?? "—"}% (${r.mit.F2_2_conseguiu.n})`],
            ["F2.3 NPS do Play (n)", `${r.mit.F2_3_nps.nps ?? "—"} (${r.mit.F2_3_nps.n})`],
            ["F2.5 Topam testar", r.mit.F2_5_topaTeste.sim],
            ["F3.2 Gestores (de quem respondeu)", `${r.mit.F3_2_F3_7_instituicoes.comCargoDirecao} (${r.mit.F3_2_F3_7_instituicoes.respondeuCargoDirecao})`],
            ["F3.7 Instituições distintas", r.mit.F3_2_F3_7_instituicoes.distintas],
            ["Gestores com contato", r.mit.F3_2_F3_7_instituicoes.comContato],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{v}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Contagem titulo="F1.2 Falta material sobre a cultura do Maranhão?" dados={r.mit.F1_2_confirmaDor.distribuicao} />
        <Contagem titulo="F1.3 Frequência de busca (últimos 12 meses)" dados={r.mit.F1_3_frequencia.distribuicao} />
        <Contagem titulo="F2.7 / I7 Aprendeu algo novo com o Play" dados={r.mit.F2_7_I7_aprendeu.distribuicao} />
        <Contagem titulo="I6 Tipo de instituição (quem dirige)" dados={r.mit.I6_tipoInstituicao} />
        <Contagem titulo="F3.2 Interesse em piloto" dados={r.mit.F3_2_F3_7_instituicoes.interessePiloto} />
        <Contagem titulo="F1.4 Pessoas atendidas pelas instituições" dados={r.mit.F1_4_alcanceInstituicoes} />
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Só quem usou o Play ({r.usuariosPlay})</h2>
      <p className="mt-1 text-sm text-texto-suave">Conta do Play ligada ou resposta dada de dentro de jogo/HQ. É o grupo que vale para NPS, “sem ajuda” e “falta material” no ICTG.</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Falta material (n)", `${r.mitPlay.F1_2_confirmaDor.pct ?? "—"}% (${r.mitPlay.F1_2_confirmaDor.n})`],
            ["Sem ajuda (n)", `${r.mitPlay.F2_2_conseguiu.pctSemAjuda ?? "—"}% (${r.mitPlay.F2_2_conseguiu.n})`],
            ["NPS do Play (n)", `${r.mitPlay.F2_3_nps.nps ?? "—"} (${r.mitPlay.F2_3_nps.n})`],
          ] as [string, string][]
        ).map(([k, v]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{v}</p>
          </li>
        ))}
      </ul>
      <form action="/admin/exportar-ictg" method="get" className={`${CARTAO} mt-3 flex flex-wrap items-end gap-3`}>
        <label className="text-sm">De<input type="date" name="de" className="ml-2 rounded-lg border border-borda bg-fundo px-2 py-1" /></label>
        <label className="text-sm">Até<input type="date" name="ate" className="ml-2 rounded-lg border border-borda bg-fundo px-2 py-1" /></label>
        <button type="submit" className="rounded-full bg-kambada-amarelo px-5 py-2 text-sm font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro">Baixar para o ICTG (anonimizado)</button>
        <p className="w-full text-xs text-texto-suave">CSV sem nome, e-mail, contato nem instituição; com data, o marcador “usou o Play” e as respostas. Deixe as datas em branco para tudo.</p>
      </form>

      <h2 className="mt-10 font-display text-xl font-bold">Partidas do Play (F2.2)</h2>
      <p className="mt-1 text-sm text-texto-suave">Iniciadas × concluídas, contadas pelo servidor — sem medição de terceiros no Play. É a taxa de quem começou e chegou ao fim (não mede “sem ajuda”).</p>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Iniciadas", r.partidas.iniciadas],
            ["Concluídas", r.partidas.concluidas],
            ["Taxa de conclusão", `${r.partidas.taxaConclusao ?? "—"}%`],
            ["Contas que concluíram ≥ 1", `${r.partidas.contas.concluiramAoMenosUma} de ${r.partidas.contas.iniciaram}`],
          ] as [string, string | number][]
        ).map(([k, v]) => (
          <li key={k} className={CARTAO}>
            <p className="text-xs text-texto-suave">{k}</p>
            <p className="font-display text-2xl font-bold">{v}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {Object.entries(r.partidas.porJogo).map(([j, v]) => (
          <div key={j} className={CARTAO}>
            <h3 className="font-display font-bold capitalize">{j}</h3>
            <p className="mt-1 text-sm">{v.iniciadas} iniciadas · {v.concluidas} concluídas · {v.taxa ?? "—"}%</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Teste de preço da assinatura (F3.4)</h2>
      <p className="mt-1 text-sm text-texto-suave">Cada pessoa vê um valor sorteado (“Se custasse R$ X por mês, você assinaria?”). É intenção declarada; só vale como evidência com n suficiente em cada preço.</p>
      <div className={`${CARTAO} mt-3 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-texto-suave">
            <tr><th className="py-1">Preço/mês</th><th>n</th><th>Sim</th><th>Talvez</th><th>Não</th><th>% sim</th><th>% sim+talvez</th><th>n (usou o Play)</th><th>% sim (usou o Play)</th></tr>
          </thead>
          <tbody>
            {r.testePreco.map((l, i) => (
              <tr key={l.preco} className="border-t border-borda">
                <td className="py-1">{formatarReais(l.preco)}</td><td>{l.n}</td><td>{l.sim}</td><td>{l.talvez}</td><td>{l.nao}</td><td>{l.pctSim ?? "—"}</td><td>{l.pctSimTalvez ?? "—"}</td>
                <td>{r.testePrecoPlay[i].n}</td><td>{r.testePrecoPlay[i].pctSim ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Loja e compra</h2>
      <p className="mt-1 text-sm text-texto-suave">O que as pessoas dizem sobre achar, comprar e o que as faria levar uma peça.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Contagem titulo={`O que faria levar uma peça hoje (n=${r.loja.levariaHoje.n})`} dados={r.loja.levariaHoje.distribuicao} />
        <Contagem titulo={`Já comprou? (n=${r.loja.comprou.n})`} dados={r.loja.comprou.distribuicao} />
        <Contagem titulo={`Compraria para (n=${r.loja.compraPara.n})`} dados={r.loja.compraPara.distribuicao} />
        <Contagem titulo={`Canal preferido (n=${r.loja.canalPreferido.n})`} dados={r.loja.canalPreferido.distribuicao} />
        <Contagem titulo={`Achou fácil o que procurava? (n=${r.loja.achou.n})`} dados={r.loja.achou.distribuicao} />
      </div>
      {r.loja.pecasDesejadas.length > 0 && (
        <div className={`${CARTAO} mt-3`}>
          <h3 className="font-display font-bold">Peças que sentem falta</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">{r.loja.pecasDesejadas.map((t, i) => (<li key={i}>{t}</li>))}</ul>
        </div>
      )}

      <h2 className="mt-10 font-display text-xl font-bold">Conversão por origem</h2>
      <p className="mt-1 text-sm text-texto-suave">De onde vieram as contas do Play, os pedidos e as respostas da pesquisa (marcadores utm_* nos links ou o site de referência). Visitas por canal: Google Analytics 4 e GoatCounter.</p>
      <div className={`${CARTAO} mt-3 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-texto-suave">
            <tr><th className="py-1">Origem</th><th>Contas Play</th><th>Pedidos</th><th>Receita</th><th>Pesquisas</th><th>Instituições interessadas</th></tr>
          </thead>
          <tbody>
            {conversaoPorOrigem(d).map((l) => (<tr key={l.origem} className="border-t border-borda"><td className="py-1">{l.origem}</td><td>{l.contas}</td><td>{l.pedidos}</td><td>{formatarReais(l.receita)}</td><td>{l.respostas}</td><td>{l.instituicoesInteressadas}</td></tr>))}
          </tbody>
        </table>
      </div>
      <div className={`${CARTAO} mt-3`}>
        <h3 className="font-display font-bold">Últimas sugestões de conteúdo, problemas e comentários</h3>
        {sugestoes.length === 0 ? (
          <p className="mt-2 text-sm text-texto-suave">Nada escrito ainda.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {sugestoes.map((x) => (
              <li key={x.em} className="border-t border-borda pt-2">
                <span className="text-xs text-texto-tenue">{new Date(x.em).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })} · {x.pagina ?? ""}</span>
                {x.sugestao && <p><strong>Sugestão:</strong> {x.sugestao}</p>}
                {x.problema && <p><strong>Problema:</strong> {x.problema}</p>}
                {x.comentario && <p><strong>Comentário:</strong> {x.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Contas (loja e Kambada Play)</h2>
      <div className={`${CARTAO} mt-3 overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-texto-suave">
            <tr><th className="py-1">Nome</th><th>E-mail</th><th>Criada</th><th>Confirmada</th><th>Novidades</th></tr>
          </thead>
          <tbody>
            {[...d.contas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 30).map((c) => (
              <tr key={c.id} className="border-t border-borda">
                <td className="py-1">{c.nome}</td>
                <td>{c.email}</td>
                <td>{new Date(c.criadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}</td>
                <td>{c.confirmadoEm ? "sim" : "não"}</td>
                <td>{c.novidades && !c.descadastradoEm ? "sim" : "não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.contas.length > 30 && <p className="mt-2 text-xs text-texto-suave">Mostrando as 30 mais recentes de {d.contas.length}. Todas estão na planilha.</p>}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Ainda não existe</h2>
      <ul className={`${CARTAO} mt-3 list-disc space-y-1 pl-9 text-sm`}>
        <li><strong>Pagamentos das assinaturas do Play:</strong> a cobrança ainda não foi ligada — quando for, os pagamentos entram aqui e na planilha.</li>
        <li><strong>Pesquisa de satisfação com o atendimento</strong> e <strong>pesquisa de intenção de posts</strong>: ainda não criadas.</li>
      </ul>
    </section>
  );
}
