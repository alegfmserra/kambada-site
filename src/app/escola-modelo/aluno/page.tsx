import Link from "next/link";
import { Etiqueta, FalaKambadinha } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import { minhaRedacao } from "@/lib/escola/concursoServico";
import { ATIVIDADES } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ASSUNTOS, atividadeDoQuiz } from "@/lib/escola/quizzes";
import { MISSAO, culturaDoAluno, escolaPublica, missaoDoAluno, pontosDoAluno, ranking, trilhasDoAluno } from "@/lib/escola/servico";
import { temporadaAberta } from "@/lib/escola/liberacao";
import { trilhaDoAluno } from "@/lib/escola/temporadaServico";
import { PASSO, TEMPORADA_DESTAQUE, temporadaPorId } from "@/lib/escola/temporadas";

export const metadata = { title: "Início" };

const MEDALHA = ["🥇", "🥈", "🥉"];

/**
 * Início do aluno: as cinco portas do portal (Desafios, Quiz, Cultura, Minhas
 * notas, Ranking), cada uma dizendo onde a criança está, e o próximo passo
 * da temporada. Uma tela só, poucos números, cada um com o "de quantos".
 */
export default async function AlunoInicio() {
  const { aluno, turma } = await exigir("aluno");
  const [meus, rank, escola, feitos, redacao, trilha, treinar, destaqueAberto] = await Promise.all([
    pontosDoAluno(aluno.id),
    ranking(turma.id),
    escolaPublica(),
    culturaDoAluno(aluno.id),
    minhaRedacao(aluno),
    trilhaDoAluno(aluno, temporadaPorId(TEMPORADA_DESTAQUE)!),
    missaoDoAluno(aluno, turma),
    temporadaAberta(TEMPORADA_DESTAQUE),
  ]);
  const trilhas = trilhasDoAluno(turma);
  const perguntas = trilhas.reduce((s, t) => s + t.total, 0);
  const feitas = trilhas.reduce((s, t) => s + (meus.porTrilha[t.id]?.feitas ?? 0), 0);
  const cultura = ATIVIDADES.filter((a) => a.tipo !== "quiz");
  const culturaFeita = cultura.filter((a) => feitos[a.id]).length;
  const quizzes = ASSUNTOS.filter((a) => feitos[atividadeDoQuiz(a.id)]).length;
  const posicao = rank.alunos.findIndex((a) => a.id === aluno.id) + 1;
  const proximo = destaqueAberto ? trilha.passos.find((p) => p.estado === "aberto" && p.caminho) : undefined;
  const desafioAberto = trilhas.find((t) => (meus.porTrilha[t.id]?.feitas ?? 0) < t.total);

  // Uma ação principal, já escolhida: a criança não precisa decidir para começar.
  const continuar = treinar.length
    ? { emoji: "🎯", titulo: "Missão de reforço", texto: `Treinar ${treinar[0].habilidade} no Arraial`, href: `/aluno/arraial?trilha=${MISSAO}` }
    : desafioAberto
      ? { emoji: desafioAberto.emoji, titulo: desafioAberto.titulo, texto: (meus.porTrilha[desafioAberto.id]?.feitas ?? 0) ? "Continuar de onde parou" : "Começar este desafio", href: `/aluno/${desafioAberto.id}` }
      : proximo?.caminho
        ? { emoji: PASSO[proximo.tipo].emoji, titulo: proximo.titulo, texto: `Próximo passo do ${CONCURSO.temporada}`, href: proximo.caminho }
        : { emoji: "❓", titulo: "Quiz", texto: "Escolhe um assunto", href: "/aluno/quiz" };

  const PORTAS = [
    { emoji: "🎯", titulo: "Desafios", texto: "Matemática, Português e Inglês.", status: `${feitas} de ${perguntas} perguntas feitas`, href: "/aluno/desafios" },
    { emoji: "❓", titulo: "Quiz", texto: "8 perguntas sobre um assunto.", status: `${quizzes} de ${ASSUNTOS.length} assuntos já jogados`, href: "/aluno/quiz" },
    { emoji: "🌴", titulo: "Cultura", texto: "Ler, jogar e assistir o Maranhão.", status: `${culturaFeita} de ${cultura.length} atividades feitas`, href: "/aluno/cultura" },
    {
      emoji: "📊",
      titulo: "Minhas notas",
      texto: "Redação e matérias. A família vê aqui.",
      status: redacao.avaliacao ? `Redação: ${redacao.avaliacao.total} de ${CRITERIOS.length * NOTA_MAXIMA}` : redacao.enviada ? "Redação entregue, esperando a nota" : "Redação: ainda sem nota",
      href: "/aluno/notas",
    },
    { emoji: "🏆", titulo: "Ranking", texto: "Os pontos das turmas.", status: posicao > 0 ? `Tu é o ${posicao}º da turma` : "Joga para entrar no ranking", href: "/ranking" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-kambada-grafite p-6 text-white ring-1 ring-white/10 sm:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[16rem] flex-1 space-y-4">
            <Etiqueta escuro>{turma.nome} · {escola.temporada.titulo}</Etiqueta>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {aluno.avatar} <span className="text-kambada-amarelo">{aluno.apelido}</span>
            </h1>
            <FalaKambadinha escuro>Éguas, que bom te ver! Bora continuar?</FalaKambadinha>
          </div>
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center">
            <p className="font-display text-5xl font-extrabold text-kambada-amarelo">{meus.pontos}</p>
            <p className="text-sm text-white/75">pontos</p>
          </div>
        </div>
        <Link
          href={rotaEscola(continuar.href)}
          className="mt-6 flex items-center gap-4 rounded-2xl bg-kambada-amarelo p-4 text-kambada-grafite transition-transform hover:-translate-y-0.5 sm:p-5"
        >
          <span className="text-5xl" aria-hidden>{continuar.emoji}</span>
          <span className="flex-1">
            <b className="block font-display text-2xl">{continuar.titulo}</b>
            <span className="text-sm font-semibold">{continuar.texto}</span>
          </span>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-kambada-grafite text-2xl text-kambada-amarelo" aria-hidden>▶</span>
        </Link>
      </section>

      <h2 className="sr-only">Ou escolhe outra coisa</h2>

      <nav aria-label="O que fazer no portal">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PORTAS.map((p) => (
            <li key={p.titulo}>
              <Link
                href={rotaEscola(p.href)}
                className="flex h-full flex-col rounded-3xl border-2 border-borda p-4 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo"
              >
                <span className="text-4xl" aria-hidden>{p.emoji}</span>
                <b className="mt-2 font-display text-xl">{p.titulo}</b>
                <span className="mt-1 flex-1 text-sm text-texto-suave">{p.texto}</span>
                <span className="mt-3 rounded-xl bg-superficie px-3 py-2 text-xs font-semibold">{p.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {destaqueAberto && (
      <section className="space-y-3 rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Etiqueta>
            {CONCURSO.emoji} Temporada de {CONCURSO.temporada}
          </Etiqueta>
          <span className="text-sm font-semibold">
            {trilha.feitos} de {trilha.total} passos feitos
          </span>
        </div>
        <p className="font-display text-xl font-bold">O Fofão e o carnaval de rua: assiste, lê, joga, responde e escreve.</p>
        <div className="flex flex-wrap gap-2">
          {proximo?.caminho && (
            <Link href={rotaEscola(proximo.caminho)} className="rounded-full bg-kambada-amarelo px-5 py-2.5 font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
              Próximo passo: {PASSO[proximo.tipo].emoji} {proximo.titulo} →
            </Link>
          )}
          <Link href={rotaEscola(`/aluno/temporada/${TEMPORADA_DESTAQUE}`)} className="rounded-full border-2 border-borda px-5 py-2.5 font-bold hover:border-kambada-amarelo">
            Ver a trilha inteira
          </Link>
        </div>
      </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Etiqueta>Ranking do {turma.nome}</Etiqueta>
          <Link href={rotaEscola("/ranking")} className="text-sm font-semibold underline">Ver todas as turmas</Link>
        </div>
        <ol className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda">
          {rank.alunos.slice(0, 5).map((a, i) => (
            <li key={a.id} className={`flex items-center gap-3 px-4 py-3 ${a.id === aluno.id ? "bg-kambada-amarelo/15 font-bold" : ""}`}>
              <span className="w-6 text-center">{MEDALHA[i] ?? `${i + 1}º`}</span>
              <span aria-hidden>{a.avatar}</span>
              <span className="flex-1">{a.nome}</span>
              <span className="font-semibold">{a.pontos}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
