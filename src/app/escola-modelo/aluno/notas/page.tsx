import Link from "next/link";
import { LinkArquivo } from "@/components/escola/concurso/Arquivos";
import { Evolucao } from "@/components/escola/concurso/Evolucao";
import { COR_DISCIPLINA, Etiqueta, TituloDuo } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import { evolucaoDoAluno, minhaRedacao } from "@/lib/escola/concursoServico";
import { ATIVIDADES } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ASSUNTOS, atividadeDoQuiz } from "@/lib/escola/quizzes";
import { culturaDoAluno, meuDesempenho, missaoDoAluno, pontosDoAluno, type Status } from "@/lib/escola/servico";

export const metadata = { title: "Minhas notas" };

/** Símbolo + palavra + cor (a cor nunca sozinha: quem não distingue vermelho de verde lê o símbolo). */
const STATUS: Record<Status, { simbolo: string; rotulo: string; classe: string }> = {
  domina: { simbolo: "✓", rotulo: "já sabe", classe: "border-kambada-green bg-kambada-green/10" },
  quase: { simbolo: "↻", rotulo: "quase lá", classe: "border-kambada-amarelo bg-kambada-amarelo/10" },
  reforco: { simbolo: "✗", rotulo: "para treinar", classe: "border-kambada-red bg-kambada-red/10" },
  nada: { simbolo: "·", rotulo: "ainda não jogou", classe: "border-borda" },
};

/**
 * Minhas notas: o lugar único onde o aluno (e a família, pelo mesmo login)
 * vê a redação, a evolução da escrita no ano e cada matéria. O aluno é
 * comparado só com ele mesmo (sem turma, sem posição), com o ponto de partida
 * à vista e um próximo passo concreto.
 */
export default async function MinhasNotas() {
  const { aluno, turma } = await exigir("aluno");
  const [redacao, evolucao, materias, meus, feitos, treinar] = await Promise.all([
    minhaRedacao(aluno),
    evolucaoDoAluno(aluno.id),
    meuDesempenho(aluno, turma),
    pontosDoAluno(aluno.id),
    culturaDoAluno(aluno.id),
    missaoDoAluno(aluno, turma),
  ]);
  const maximo = CRITERIOS.length * NOTA_MAXIMA;
  const quizzes = ASSUNTOS.map((a) => ({ a, f: feitos[atividadeDoQuiz(a.id)] })).filter((x) => x.f);
  const cultura = ATIVIDADES.filter((a) => a.tipo !== "quiz");
  const fortes = materias.flatMap((m) => m.habilidades.filter((h) => h.status === "domina").map((h) => h.habilidade));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-3">
        <Etiqueta>{aluno.avatar} {aluno.apelido} · {turma.nome}</Etiqueta>
        <TituloDuo antes="Minhas" destaque="notas" />
        <p className="rounded-2xl bg-superficie p-4 text-sm">
          <b>Para a família:</b> esta página mostra o que a criança já aprendeu e o que ainda está treinando, sempre comparando com ela mesma ao longo do ano. Entre com o login do aluno para acompanhar.
        </p>
      </section>

      {/* 1. Redação: a nota da temporada e a evolução no ano */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-extrabold">✍️ Redação</h2>
        <div className="rounded-3xl border-2 border-borda p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">{CONCURSO.titulo}</p>
          {redacao.avaliacao ? (
            <div className="mt-2 space-y-3">
              <p className="font-display text-3xl font-extrabold">
                {redacao.avaliacao.total} <span className="text-lg text-texto-suave">de {maximo}</span>
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {CRITERIOS.map((c) => {
                  const n = redacao.avaliacao!.notas[c.id] ?? 0;
                  return (
                    <li key={c.id} className="rounded-2xl bg-superficie p-3 text-sm">
                      <span className="flex justify-between">
                        <b>{c.nome}</b>
                        <span>
                          {n} de {NOTA_MAXIMA}
                        </span>
                      </span>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-borda" aria-hidden>
                        <span className="block h-full rounded-full bg-kambada-amarelo" style={{ width: `${(n / NOTA_MAXIMA) * 100}%` }} />
                      </span>
                    </li>
                  );
                })}
              </ul>
              {redacao.avaliacao.comentario && (
                <p className="rounded-2xl bg-kambada-amarelo/15 p-4 text-sm">
                  <b>Do professor:</b> {redacao.avaliacao.comentario}
                </p>
              )}
              {redacao.correcao && <LinkArquivo a={redacao.correcao} rotulo="📝 A folha corrigida" />}
            </div>
          ) : (
            <p className="mt-2 text-sm">{redacao.enviada ? "A redação foi entregue. A nota aparece aqui quando o professor corrigir." : "A redação é escrita à mão, em sala. Depois que o professor corrigir, a nota aparece aqui."}</p>
          )}
          <Link href={rotaEscola("/aluno/concurso")} className="mt-3 inline-block text-sm font-semibold underline">
            Ver a proposta e o concurso →
          </Link>
        </div>
        <Evolucao pontos={evolucao} titulo="A escrita ao longo do ano" />
      </section>

      {/* 2. As matérias: onde está em cada habilidade */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-extrabold">🎯 Desafios das matérias</h2>
          <span className="text-sm text-texto-suave">{meus.pontos} pontos no total</span>
        </div>
        <p className="flex flex-wrap gap-3 text-xs text-texto-suave">
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <span key={s}>
              <b>{STATUS[s].simbolo}</b> {STATUS[s].rotulo}
            </span>
          ))}
          <span>(pelas últimas respostas de cada habilidade)</span>
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {materias.map((m) => (
            <div key={m.disciplina} className="rounded-3xl border-2 border-borda p-4">
              <p className="flex items-center justify-between gap-2 font-bold">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: COR_DISCIPLINA[m.disciplina] }} aria-hidden /> {m.disciplina}
                </span>
                <span className="text-xs font-normal text-texto-suave">{m.respostas} respostas</span>
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {m.habilidades.map((h) => (
                  <li key={h.habilidade} className={`rounded-full border-2 px-3 py-1 text-sm ${STATUS[h.status].classe}`}>
                    <b aria-hidden>{STATUS[h.status].simbolo}</b> {h.habilidade} <span className="sr-only">: {STATUS[h.status].rotulo}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Próximos passos: concretos, no máximo dois */}
      <section className="space-y-3 rounded-3xl bg-kambada-grafite p-5 text-white">
        <h2 className="font-display text-xl font-extrabold text-kambada-amarelo">Próximos passos</h2>
        <ul className="space-y-2 text-sm">
          {fortes.length > 0 && <li>💪 Já sabe: <b>{fortes.slice(0, 4).join(", ")}</b>{fortes.length > 4 ? " e mais" : ""}.</li>}
          {treinar.length > 0 ? (
            <li>
              🎯 Para treinar: <b>{treinar.map((p) => p.habilidade).join(", ")}</b>.{" "}
              <Link href={rotaEscola("/aluno/arraial?trilha=missao-reforco")} className="font-bold text-kambada-amarelo underline">
                Fazer a missão de reforço →
              </Link>
            </li>
          ) : (
            <li>
              🎯 Nada para reforçar agora.{" "}
              <Link href={rotaEscola("/aluno/desafios")} className="font-bold text-kambada-amarelo underline">
                Jogar outro desafio →
              </Link>
            </li>
          )}
        </ul>
      </section>

      {/* 4. Quiz e cultura */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-borda p-4">
          <h2 className="font-display text-lg font-extrabold">❓ Quiz</h2>
          {quizzes.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {quizzes.map(({ a, f }) => (
                <li key={a.id} className="flex justify-between">
                  <span>{a.emoji} {a.titulo}</span>
                  <span className="text-texto-suave">melhor: {f!.melhor ?? "—"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-texto-suave">Nenhum quiz ainda.</p>
          )}
          <Link href={rotaEscola("/aluno/quiz")} className="mt-3 inline-block text-sm font-semibold underline">Ir para o Quiz →</Link>
        </div>
        <div className="rounded-3xl border-2 border-borda p-4">
          <h2 className="font-display text-lg font-extrabold">🌴 Cultura do Maranhão</h2>
          <p className="mt-2 text-sm">
            <b>{cultura.filter((a) => feitos[a.id]).length} de {cultura.length}</b> atividades feitas (leituras, jogos e animações).
          </p>
          <Link href={rotaEscola("/aluno/cultura")} className="mt-3 inline-block text-sm font-semibold underline">Ir para a Cultura →</Link>
        </div>
      </section>
    </div>
  );
}
