import Link from "next/link";
import { BarraSituacao, Contagem, CulturaDaTurma, Exportar, JogosMaisJogados, ListaReforco, linkFicha } from "@/components/escola/Mapa";
import { Etiqueta, Micangas } from "@/components/escola/Marca";
import { GestaoEquipe, GestaoTurmas, IdentidadeEscola } from "@/components/escola/Coordenacao";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { CORES_ESCOLA, equipe, escolaPublica, mapaEscola, resumoDasTurmas } from "@/lib/escola/servico";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Coordenação" };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function CoordenacaoPagina() {
  const { membro } = await exigir("coordenacao", "gestor");
  const [turmas, eq, escola, mapa] = await Promise.all([resumoDasTurmas(membro), equipe(membro), escolaPublica(), mapaEscola(membro)]);
  const totalAlunos = turmas.reduce((s, t) => s + t.alunos, 0);
  const ativos = turmas.reduce((s, t) => s + t.ativos7d, 0);
  const professores = eq.membros.filter((m) => m.papel === "professor");

  return (
    <div className="space-y-10">
      <div>
        <Etiqueta>{membro.papel === "gestor" ? "Gestão Kambada vendo como a coordenação" : "Coordenação"} · {escola.nome}</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">Painel da <span className="destaque">coordenação</span></h1>
        <p className="text-texto-suave">Relatório geral da escola, equipe, turmas e identidade do portal.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [turmas.length, "turmas"],
          [totalAlunos, "alunos"],
          [professores.length, "professores"],
          [`${totalAlunos ? Math.round((ativos / totalAlunos) * 100) : 0}%`, "jogaram nos últimos 7 dias"],
        ].map(([n, r]) => (
          <div key={String(r)} className="rounded-2xl bg-kambada-grafite p-4 text-white ring-1 ring-white/10">
            <p className="font-display text-3xl font-extrabold text-kambada-amarelo">{n}</p>
            <p className="text-sm text-white/70">{r}</p>
          </div>
        ))}
      </div>

      <Secao titulo="Mapa da escola">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-texto-suave">
            {mapa.nomes ? "Com o nome dos alunos: só a escola vê." : "A gestão Kambada vê só apelidos: o nome de verdade é da escola."}
          </p>
          <Exportar planilha="/api/escola/exportar?escola=1" />
        </div>
        <Contagem contagem={mapa.contagem} />
        <ul className="space-y-3">
          {mapa.turmas.map((t) => (
            <li key={t.id} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[9rem_1fr_auto]">
              <span>
                <Link href={rotaEscola(`/professor/turma/${t.id}`)} className="font-semibold underline">
                  {t.nome}
                </Link>
                <span className="block text-xs text-texto-suave">{NOME_ETAPA[t.etapa]}</span>
              </span>
              <BarraSituacao contagem={t.contagem} />
              <span className="text-xs text-texto-suave">
                <b className="text-kambada-red">{t.contagem.reforco}</b> em reforço de {t.total}
              </span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Quem mais precisa de reforço na escola">
        <ListaReforco alunos={mapa.alunos.filter((a) => a.situacao !== "bem")} linkFicha={linkFicha} comTurma limite={8} />
      </Secao>

      <Secao titulo="Jogos mais jogados na escola">
        <JogosMaisJogados jogos={mapa.jogos} />
      </Secao>

      <Secao titulo="Cultura do Maranhão na escola">
        <CulturaDaTurma cultura={mapa.cultura} />
      </Secao>

      <Micangas className="mx-auto h-4 w-72 text-texto" />

      <Secao titulo="Professores">
        <GestaoEquipe membros={eq.membros} turmas={eq.turmas} />
      </Secao>

      <Secao titulo="Turmas">
        <GestaoTurmas turmas={eq.turmas} professores={professores} />
      </Secao>

      <Secao titulo="Identidade do portal">
        <IdentidadeEscola escola={escola} cores={CORES_ESCOLA} />
      </Secao>
    </div>
  );
}
