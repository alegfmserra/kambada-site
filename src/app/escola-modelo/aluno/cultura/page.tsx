import Link from "next/link";
import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { ATIVIDADES, NOME_TIPO, type TipoCultura } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { culturaDoAluno } from "@/lib/escola/servico";
import { Progresso } from "@/components/escola/temporada/Trilha";
import { temporadasDoAluno } from "@/lib/escola/temporadaServico";

export const metadata = { title: "Cultura do Maranhão" };

const SECOES: { tipo: TipoCultura; titulo: string; texto: string }[] = [
  { tipo: "jogo", titulo: "Jogos", texto: "Brincar e aprender a festa: o Arraial em 3D, a história do Boi e os sotaques." },
  { tipo: "hq", titulo: "Quadrinhos", texto: "As histórias do Kambadinha, com perguntas para conversar depois." },
  { tipo: "animacao", titulo: "Animações", texto: "Assistir, ver de novo e brincar com o que você viu." },
  { tipo: "artigo", titulo: "Artigos", texto: "O texto que explica a temporada e dá ideias para a redação." },
  { tipo: "quiz", titulo: "Quizzes", texto: "Mostre o que aprendeu na temporada." },
];

const COR: Record<TipoCultura, string> = { jogo: "#FFCC29", hq: "#D4432B", animacao: "#518FC2", artigo: "#3B8D5D", quiz: "#E0AF14" };

const SELO = { pronta: "trilha completa", montagem: "em montagem", breve: "em breve" } as const;

/** Área de cultura do aluno: jogos, HQs e animações que contam o Maranhão. */
export default async function CulturaDoAluno() {
  const { aluno } = await exigir("aluno");
  const [feitos, temporadas] = await Promise.all([culturaDoAluno(aluno.id), temporadasDoAluno(aluno)]);
  const quantos = ATIVIDADES.filter((a) => feitos[a.id]).length;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Etiqueta>Cultura do Maranhão</Etiqueta>
        <TituloDuo antes="Brincar, ler e assistir a" destaque="nossa cultura" />
        <FalaKambadinha>
          {quantos === 0
            ? "Éguas! Aqui tem festa de São João, Bumba-meu-boi, tambor de crioula e os guarás do mangue. Escolhe por onde começar!"
            : `Tu já fez ${quantos} de ${ATIVIDADES.length}. Bora completar a coleção?`}
        </FalaKambadinha>
        <div className="h-2 overflow-hidden rounded-full bg-superficie" role="img" aria-label={`${quantos} de ${ATIVIDADES.length} atividades feitas`}>
          <div className="h-full rounded-full bg-kambada-amarelo" style={{ width: `${(quantos / ATIVIDADES.length) * 100}%` }} />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Temporadas do ano</h2>
          <p className="text-sm text-texto-suave">Cada temporada tem a mesma trilha: assistir, ler, entender, brincar, mostrar o que sabe e escrever.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {temporadas.map(({ temporada: t, ...tr }, i) => {
            const conteudo = (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span className="text-4xl" aria-hidden>{t.emoji}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tr.situacao === "breve" ? "bg-superficie" : tr.situacao === "pronta" ? "bg-kambada-green/20" : "bg-kambada-amarelo/25"}`}>
                    {i === 0 ? "⭐ em destaque · " : ""}
                    {SELO[tr.situacao]}
                  </span>
                </span>
                <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-texto-suave">{t.mes}</span>
                <b className="block font-display text-xl">{t.titulo}</b>
                <span className="block text-sm text-texto-suave">{t.tema}</span>
                {tr.total > 0 && (
                  <span className="mt-3 block">
                    <Progresso trilha={{ temporada: t, ...tr }} />
                  </span>
                )}
              </>
            );
            return (
              <li key={t.id} className={i === 0 ? "sm:col-span-2" : ""}>
                {t.passos.length ? (
                  <Link href={rotaEscola(`/aluno/temporada/${t.id}`)} className={`block h-full rounded-3xl border-2 p-5 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo ${i === 0 ? "border-kambada-amarelo bg-kambada-amarelo/10" : "border-borda"}`}>
                    {conteudo}
                  </Link>
                ) : (
                  <div className="h-full rounded-3xl border-2 border-dashed border-borda p-5 opacity-70">{conteudo}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <h2 className="font-display text-2xl font-extrabold">Todas as atividades</h2>
      {SECOES.map((s) => (
        <section key={s.tipo} className="space-y-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold">{s.titulo}</h2>
            <p className="text-sm text-texto-suave">{s.texto}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ATIVIDADES.filter((a) => a.tipo === s.tipo).map((a) => {
              const f = feitos[a.id];
              return (
                <li key={a.id}>
                  <Link
                    href={rotaEscola(a.caminho)}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-borda transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo"
                  >
                    {a.slug ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa do Play (arquivo direto)
                      <img
                        src={a.tipo === "hq" ? `/kambadaplay/hq/${a.slug}/01.webp` : `/kambadaplay/videos/${a.slug}.jpg`}
                        alt=""
                        className={`w-full object-cover ${a.tipo === "hq" ? "h-44 object-top" : "aspect-video"}`}
                      />
                    ) : (
                      <span className="grid h-44 place-items-center text-6xl" style={{ background: `${COR[a.tipo]}26` }} aria-hidden>
                        {a.emoji}
                      </span>
                    )}
                    <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: COR[a.tipo] }} aria-hidden />
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">{NOME_TIPO[a.tipo]}</p>
                      <h3 className="mt-1 font-display text-lg font-extrabold">{a.titulo}</h3>
                      <p className="mt-1 flex-1 text-sm text-texto-suave">{a.resumo}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-texto-suave">{f ? `✓ feito${f.melhor ? ` · melhor: ${f.melhor}` : ""}` : "novo"}</span>
                        <span className="rounded-full bg-kambada-amarelo px-3 py-1 font-bold text-kambada-grafite">
                          {f ? "De novo" : a.tipo === "jogo" ? "Jogar" : a.tipo === "hq" || a.tipo === "artigo" ? "Ler" : a.tipo === "quiz" ? "Responder" : "Assistir"} →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
