import type { PontoDaEscrita } from "@/lib/escola/concursoServico";
import { CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import type { MapaAluno } from "@/lib/escola/servico";

const MAXIMO = CRITERIOS.length * NOTA_MAXIMA;

/** A habilidade que mais aparece no reforço, e em quantos alunos. */
function habilidadeMaisFraca(alunos: MapaAluno[]): { habilidade: string; disciplina: string; n: number } | null {
  const conta = new Map<string, { habilidade: string; disciplina: string; n: number }>();
  for (const a of alunos)
    for (const p of a.reforcoEm) {
      const k = `${p.disciplina}|${p.habilidade}`;
      const atual = conta.get(k) ?? { habilidade: p.habilidade, disciplina: p.disciplina, n: 0 };
      atual.n += 1;
      conta.set(k, atual);
    }
  return [...conta.values()].sort((x, y) => y.n - x.n)[0] ?? null;
}

/**
 * "Em 30 segundos": o painel em frases curtas, cada número com o "de quantos",
 * sem cor sozinha nem ranking entre turmas. Princípios em
 * site-novo/05-kambada-play/PLAY_paineis-referencias_2026-11-06.md.
 */
export function Resumo30s({
  alunos,
  ativos,
  escrita,
  ancoraReforco = "#reforco",
}: {
  alunos: MapaAluno[];
  ativos: number;
  escrita: (PontoDaEscrita & { avaliadas?: number })[];
  ancoraReforco?: string;
}) {
  const total = alunos.length;
  const reforco = alunos.filter((a) => a.situacao === "reforco").length;
  const atencao = alunos.filter((a) => a.situacao === "atencao").length;
  const semJogar = alunos.filter((a) => a.situacao === "nada").length;
  const fraca = habilidadeMaisFraca(alunos);
  const com = escrita.filter((p) => p.total !== null);
  const antes = com.length >= 2 ? com[com.length - 2] : null;
  const agora = com[com.length - 1] ?? null;

  const frases: React.ReactNode[] = [
    <>
      <b>{ativos} de {total}</b> alunos jogaram nos últimos 7 dias{semJogar ? <>; <b>{semJogar}</b> ainda não começaram</> : null}.
    </>,
    reforco + atencao === 0 ? (
      <>Nenhum aluno precisa de reforço agora.</>
    ) : (
      <>
        <b>{reforco} de {total}</b> precisam de reforço e <b>{atencao}</b> pedem atenção
        {fraca ? (
          <>
            . O ponto que mais aparece: <b>{fraca.habilidade}</b> ({fraca.disciplina}, {fraca.n} {fraca.n === 1 ? "aluno" : "alunos"})
          </>
        ) : null}
        .{" "}
        <a href={ancoraReforco} className="font-semibold underline">Ver quem →</a>
      </>
    ),
    agora ? (
      <>
        Redação: média <b>{agora.total} de {MAXIMO}</b> em {agora.temporada}
        {agora.avaliadas !== undefined ? <> ({agora.avaliadas} corrigidas)</> : null}
        {antes && antes.total !== null ? (
          <>
            , {agora.total! > antes.total ? "subiu" : agora.total! < antes.total ? "caiu" : "igual"} em relação a {antes.temporada} ({antes.total})
          </>
        ) : null}
        .
      </>
    ) : (
      <>Redação: nenhuma corrigida ainda.</>
    ),
  ];

  return (
    <section aria-labelledby="resumo-30s" className="rounded-3xl bg-kambada-grafite p-5 text-white ring-1 ring-white/10">
      <h2 id="resumo-30s" className="font-display text-lg font-extrabold text-kambada-amarelo">Em 30 segundos</h2>
      <ul className="mt-2 space-y-2 text-[15px] leading-relaxed [&_a]:text-kambada-amarelo">
        {frases.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>•</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
