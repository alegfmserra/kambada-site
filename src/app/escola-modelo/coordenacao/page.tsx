import Link from "next/link";
import { BarraSituacao, Contagem, CulturaDaTurma, Exportar, JogosMaisJogados, ListaReforco, linkFicha } from "@/components/escola/Mapa";
import { Etiqueta, Micangas } from "@/components/escola/Marca";
import { GestaoEquipe, GestaoTurmas, IdentidadeEscola } from "@/components/escola/Coordenacao";
import { Resumo30s } from "@/components/escola/Resumo30s";
import { EscolhaDaEscola } from "@/components/escola/concurso/Avaliar";
import { Evolucao } from "@/components/escola/concurso/Evolucao";
import { CONCURSO } from "@/lib/escola/concurso";
import { evolucaoDaEscola, finalistasDaEscola, resumoDoConcurso } from "@/lib/escola/concursoServico";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { CORES_ESCOLA, equipe, escolaPublica, mapaEscola, resumoDasTurmas } from "@/lib/escola/servico";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Coordenação" };

function Secao({ id, titulo, children }: { id?: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

/** Seções de consulta e de administração: fechadas, para a tela abrir só com o que pede decisão. */
function Gaveta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-3xl border-2 border-borda p-4 open:space-y-3">
      <summary className="cursor-pointer list-none font-display text-lg font-bold">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden>▸</span>
        {titulo}
      </summary>
      {children}
    </details>
  );
}

/**
 * Painel da coordenação, de cima para baixo pela ordem da decisão:
 * 1) o resumo em frases; 2) onde está cada turma; 3) quem precisa de reforço;
 * 4) a escrita no ano e o concurso. O resto (jogos, cultura, equipe, turmas,
 * identidade) fica em gavetas fechadas.
 */
export default async function CoordenacaoPagina() {
  const { membro } = await exigir("coordenacao", "gestor");
  const [turmas, eq, escola, mapa, concurso, finalistas, escrita] = await Promise.all([
    resumoDasTurmas(membro),
    equipe(membro),
    escolaPublica(),
    mapaEscola(membro),
    resumoDoConcurso(membro),
    finalistasDaEscola(membro),
    evolucaoDaEscola(membro),
  ]);
  const ativos = turmas.reduce((s, t) => s + t.ativos7d, 0);
  const professores = eq.membros.filter((m) => m.papel === "professor");

  return (
    <div className="space-y-10">
      <div>
        <Etiqueta>{membro.papel === "gestor" ? "Gestão Kambada vendo como a coordenação" : "Coordenação"} · {escola.nome}</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">Painel da <span className="destaque">coordenação</span></h1>
        <p className="text-texto-suave">
          {turmas.length} turmas · {mapa.alunos.length} alunos · {professores.length} professores
        </p>
      </div>

      <Resumo30s alunos={mapa.alunos} ativos={ativos} escrita={escrita} />

      <Secao titulo="Onde está cada turma">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-texto-suave">
            Cada aluno conta uma vez, pela situação dele. {mapa.nomes ? "Com o nome dos alunos: só a escola vê." : "A gestão Kambada vê só apelidos: o nome de verdade é da escola."}
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
                <b className="text-texto">{t.contagem.reforco} de {t.total}</b> em reforço
              </span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="reforco" titulo="Quem mais precisa de reforço">
        <ListaReforco alunos={mapa.alunos.filter((a) => a.situacao !== "bem")} linkFicha={linkFicha} comTurma limite={8} />
      </Secao>

      <Evolucao pontos={escrita} titulo="A escrita da escola ao longo do ano (média)" />

      <Secao titulo={`${CONCURSO.emoji} ${CONCURSO.titulo}`}>
        <p className="text-sm text-texto-suave">
          O professor corrige pela grade e escolhe até {CONCURSO.finalistasPorTurma} finalistas por turma. Aqui a coordenação escolhe, entre as finalistas, a redação que representa a escola na rede Kambada (lá ela aparece só com o apelido).
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {concurso.map((t) => (
            <li key={t.turmaId}>
              <Link href={rotaEscola(`/professor/turma/${t.turmaId}/redacoes`)} className="block rounded-2xl border-2 border-borda p-3 text-sm hover:border-kambada-amarelo">
                <b>{t.turma}</b>
                <span className="block text-texto-suave">
                  {t.avaliadas} de {t.alunos} corrigidas · {t.finalistas} finalistas
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {finalistas.map((f) => (
          <div key={f.etapa} className="space-y-2">
            <p className="font-bold">Finalistas · {NOME_ETAPA[f.etapa]}</p>
            {f.redacoes.length ? (
              <ul className="space-y-2">
                {f.redacoes.map((r) => (
                  <EscolhaDaEscola key={r.id} r={r} modo="representante" />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-texto-suave">Nenhuma finalista ainda nesta etapa.</p>
            )}
          </div>
        ))}
      </Secao>

      <Micangas className="mx-auto h-4 w-72 text-texto" />

      <div className="space-y-3">
        <Gaveta titulo="Jogos mais jogados">
          <JogosMaisJogados jogos={mapa.jogos} />
        </Gaveta>
        <Gaveta titulo="Cultura do Maranhão na escola">
          <CulturaDaTurma cultura={mapa.cultura} />
        </Gaveta>
        <Gaveta titulo={`Professores (${professores.length})`}>
          <GestaoEquipe membros={eq.membros} turmas={eq.turmas} />
        </Gaveta>
        <Gaveta titulo={`Turmas (${turmas.length})`}>
          <GestaoTurmas turmas={eq.turmas} professores={professores} />
        </Gaveta>
        <Gaveta titulo="Identidade do portal">
          <IdentidadeEscola escola={escola} cores={CORES_ESCOLA} />
        </Gaveta>
      </div>
    </div>
  );
}
