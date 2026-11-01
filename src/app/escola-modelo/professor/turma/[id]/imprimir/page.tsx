import { notFound } from "next/navigation";
import { BotaoImprimir } from "@/components/escola/BotaoImprimir";
import { Contagem, JogosMaisJogados, PontosFracos } from "@/components/escola/Mapa";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola, escolaPublica, mapaTurma } from "@/lib/escola/servico";
import { NOME_ETAPA, SITUACAO } from "@/lib/escola/tipos";

export const metadata = { title: "Relatório da turma (PDF)" };

const hab = (l: { habilidade: string }[]) => l.map((p) => p.habilidade).join(", ");

/** Relatório da turma para imprimir ou "Salvar como PDF" (A4, fundo claro). */
export default async function ImprimirTurma({ params }: { params: Promise<{ id: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  let mapa;
  try {
    mapa = await mapaTurma(membro, id);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const escola = await escolaPublica();
  const hoje = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Fortaleza" }).format(new Date());

  return (
    <div className="space-y-6">
      <style>{`@media print { .escola-root > header, .escola-root > footer, .escola-root > p, .nao-imprime { display:none!important } .escola-root > div { padding:0!important; max-width:none!important } @page { size: A4; margin: 12mm } li, tr { break-inside: avoid } }`}</style>
      <div className="nao-imprime flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-superficie p-4">
        <p className="text-sm">Para gerar o PDF: <b>Imprimir</b> → destino <b>“Salvar como PDF”</b>.</p>
        <BotaoImprimir />
      </div>

      <header className="flex items-end justify-between gap-4 border-b-4 border-kambada-amarelo pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-suave">{escola.nome} · Kambada Play</p>
          <h1 className="font-display text-3xl font-extrabold">Relatório do {mapa.turma.nome}</h1>
          <p className="text-sm text-texto-suave">{NOME_ETAPA[mapa.turma.etapa]} · {hoje}</p>
        </div>
        {mapa.nomes && <p className="max-w-[14rem] text-right text-[11px] text-texto-suave">Documento interno da escola: contém o nome dos alunos.</p>}
      </header>

      <Contagem contagem={mapa.contagem} />

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold">Alunos, do mais urgente ao que vai bem</h2>
        <table className="w-full text-sm">
          <thead className="bg-kambada-amarelo text-left text-kambada-grafite">
            <tr>
              <th className="px-2 py-1.5">Situação</th>
              <th className="px-2 py-1.5">{mapa.nomes ? "Aluno (apelido)" : "Apelido"}</th>
              <th className="px-2 py-1.5">Precisa de reforço em</th>
              <th className="px-2 py-1.5">Quase lá em</th>
              <th className="px-2 py-1.5 text-right">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {mapa.alunos.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap px-2 py-1.5 font-bold" style={{ color: SITUACAO[a.situacao].cor }}>
                  {SITUACAO[a.situacao].simbolo} {SITUACAO[a.situacao].rotulo}
                </td>
                <td className="px-2 py-1.5">
                  {a.nome ? (
                    <>
                      <b>{a.nome}</b> <span className="text-texto-suave">({a.apelido})</span>
                    </>
                  ) : (
                    <b>{a.apelido}</b>
                  )}
                  {a.diasSemJogar !== null && a.diasSemJogar >= 7 && <span className="block text-xs text-texto-suave">não joga há {a.diasSemJogar} dias</span>}
                </td>
                <td className="px-2 py-1.5">{hab(a.reforcoEm) || "—"}</td>
                <td className="px-2 py-1.5">{hab(a.quaseEm) || "—"}</td>
                <td className="px-2 py-1.5 text-right">{a.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">Onde a turma mais erra</h2>
          <PontosFracos lista={mapa.pontosFracos} total={mapa.alunos.length} />
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">Jogos mais jogados</h2>
          <JogosMaisJogados jogos={mapa.jogos} />
        </section>
      </div>
      <p className="text-[11px] text-texto-suave">
        A situação olha as últimas respostas de cada habilidade: é um retrato para o professor planejar o reforço, não nota nem diagnóstico.
      </p>
    </div>
  );
}
