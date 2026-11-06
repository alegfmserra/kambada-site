import Link from "next/link";
import { rotaEscola } from "@/lib/escola/host";
import { NOME_TIPO, VERBO_TIPO } from "@/lib/escola/cultura";
import type { MapaAluno, Ponto, UsoCultura, UsoJogo } from "@/lib/escola/servico";
import { ORDEM_SITUACAO, SITUACAO, type Situacao } from "@/lib/escola/tipos";
import { COR_DISCIPLINA } from "./Marca";

/**
 * Mapa de reforço: o jeito simples de ler a turma (ou a escola).
 * Quatro números em cor, uma barra, a lista de quem precisa e em quê, e os jogos mais jogados.
 */

export function SeloSituacao({ s }: { s: Situacao }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: SITUACAO[s].cor }}>
      {SITUACAO[s].simbolo} {SITUACAO[s].rotulo}
    </span>
  );
}

export function Contagem({ contagem }: { contagem: Record<Situacao, number> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ORDEM_SITUACAO.map((s) => (
        <div key={s} className="rounded-2xl border-2 p-4" style={{ borderColor: SITUACAO[s].cor }}>
          <p className="font-display text-4xl font-extrabold" style={{ color: SITUACAO[s].cor }}>
            {contagem[s]}
          </p>
          <p className="text-sm font-semibold">{SITUACAO[s].rotulo}</p>
        </div>
      ))}
    </div>
  );
}

/** Uma barra só, nas 4 cores (para as linhas de turma da coordenação). */
export function BarraSituacao({ contagem }: { contagem: Record<Situacao, number> }) {
  const total = ORDEM_SITUACAO.reduce((s, x) => s + contagem[x], 0) || 1;
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-superficie" role="img" aria-label={ORDEM_SITUACAO.map((s) => `${contagem[s]} ${SITUACAO[s].rotulo}`).join(", ")}>
      {ORDEM_SITUACAO.map((s) =>
        contagem[s] ? <span key={s} style={{ width: `${(contagem[s] / total) * 100}%`, background: SITUACAO[s].cor }} title={`${contagem[s]} ${SITUACAO[s].rotulo}`} /> : null,
      )}
    </div>
  );
}

function Habilidades({ lista, cor }: { lista: Ponto[]; cor: string }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {lista.map((p) => (
        <span key={`${p.disciplina}|${p.habilidade}`} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold" style={{ borderColor: cor }}>
          <span className="h-2 w-2 rounded-full" style={{ background: COR_DISCIPLINA[p.disciplina] }} aria-hidden />
          {p.habilidade}
        </span>
      ))}
    </span>
  );
}

/** Nome (só para a escola) em destaque e o apelido embaixo; para quem não vê nomes, só o apelido. */
export function QuemE({ a }: { a: Pick<MapaAluno, "apelido" | "avatar" | "nome"> }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-2xl" aria-hidden>{a.avatar}</span>
      <span className="leading-tight">
        <b className="block">{a.nome || a.apelido}</b>
        {a.nome ? <span className="text-xs text-texto-suave">apelido {a.apelido}</span> : a.nome === "" && <span className="text-xs text-texto-suave">sem nome cadastrado</span>}
      </span>
    </span>
  );
}

function LinhaAluno({ a, href, comTurma }: { a: MapaAluno; href: string | null; comTurma: boolean }) {
  const conteudo = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <QuemE a={a} />
        <span className="flex flex-wrap items-center gap-2">
          {comTurma && <span className="text-xs font-semibold text-texto-suave">{a.turma}</span>}
          <SeloSituacao s={a.situacao} />
        </span>
      </div>
      {a.reforcoEm.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <b className="text-kambada-red">Reforço em</b> <Habilidades lista={a.reforcoEm} cor="#D4432B" />
        </p>
      )}
      {a.quaseEm.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <b className="text-kambada-amarelo-escuro">Quase lá em</b> <Habilidades lista={a.quaseEm} cor="#E0AF14" />
        </p>
      )}
      {a.diasSemJogar !== null && a.diasSemJogar >= 7 && <p className="mt-1.5 text-xs font-semibold text-texto-suave">⏸ não joga há {a.diasSemJogar} dias</p>}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block rounded-2xl border-2 border-borda p-3 transition-colors hover:border-kambada-amarelo">
          {conteudo}
        </Link>
      ) : (
        <div className="rounded-2xl border-2 border-borda p-3">{conteudo}</div>
      )}
    </li>
  );
}

/** Lista por urgência; quem vai bem fica recolhido no fim. `linkFicha` monta o endereço da ficha do aluno. */
export function ListaReforco({ alunos, linkFicha, comTurma = false, limite }: { alunos: MapaAluno[]; linkFicha?: (a: MapaAluno) => string; comTurma?: boolean; limite?: number }) {
  const precisam = alunos.filter((a) => a.situacao !== "bem");
  const vaoBem = alunos.filter((a) => a.situacao === "bem");
  const mostrar = limite ? precisam.slice(0, limite) : precisam;
  const href = (a: MapaAluno) => (linkFicha ? linkFicha(a) : null);
  return (
    <div className="space-y-3">
      {mostrar.length === 0 ? (
        <p className="rounded-2xl bg-kambada-green/10 p-4 font-semibold">Ninguém precisando de reforço agora. 🎉</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {mostrar.map((a) => (
            <LinhaAluno key={a.id} a={a} href={href(a)} comTurma={comTurma} />
          ))}
        </ul>
      )}
      {limite && precisam.length > limite && <p className="text-sm text-texto-suave">E mais {precisam.length - limite}. A planilha traz todos.</p>}
      {vaoBem.length > 0 && (
        <details className="rounded-2xl bg-superficie p-3">
          <summary className="cursor-pointer text-sm font-bold">
            <span style={{ color: SITUACAO.bem.cor }}>✓</span> Indo bem ({vaoBem.length})
          </summary>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {vaoBem.map((a) => (
              <LinhaAluno key={a.id} a={a} href={href(a)} comTurma={comTurma} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function PontosFracos({ lista, total }: { lista: (Ponto & { alunos: number })[]; total: number }) {
  if (!lista.length) return <p className="text-sm text-texto-suave">Nenhuma habilidade com a turma em ✗.</p>;
  return (
    <ul className="space-y-2">
      {lista.map((p) => (
        <li key={`${p.disciplina}|${p.habilidade}`} className="grid grid-cols-[minmax(8rem,14rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_DISCIPLINA[p.disciplina] }} aria-hidden />
            {p.habilidade}
          </span>
          <span className="h-3 overflow-hidden rounded-full bg-superficie">
            <span className="block h-full rounded-full bg-kambada-red" style={{ width: `${(p.alunos / (total || 1)) * 100}%` }} />
          </span>
          <span className="whitespace-nowrap text-xs font-bold">{p.alunos} de {total}</span>
        </li>
      ))}
    </ul>
  );
}

export function JogosMaisJogados({ jogos }: { jogos: UsoJogo[] }) {
  return (
    <ul className="space-y-3">
      {jogos.map((j) => (
        <li key={j.trilhaId} className="space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">
              <span aria-hidden>{j.emoji}</span> {j.titulo} <span className="text-xs text-texto-suave">· {j.disciplina}</span>
            </span>
            <span className="text-xs text-texto-suave">
              <b className="text-texto">{j.alunos} de {j.podiam}</b> jogaram · {j.respostas} respostas{j.noArraial > 0 && ` (${j.noArraial} no Arraial 3D)`} · {j.primeira}% certo de primeira
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-superficie">
            <div className="h-full rounded-full" style={{ width: `${(j.alunos / (j.podiam || 1)) * 100}%`, background: COR_DISCIPLINA[j.disciplina] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Cultura do Maranhão: quantos jogaram, leram e assistiram cada atividade, e quanto acertaram nas perguntas. */
export function CulturaDaTurma({ cultura }: { cultura: UsoCultura[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {cultura.map((c) => (
        <li key={c.id} className="space-y-1 rounded-2xl border-2 border-borda p-3">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">
              <span aria-hidden>{c.emoji}</span> {c.titulo}
            </span>
            <span className="text-xs text-texto-suave">{NOME_TIPO[c.tipo]}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-superficie">
            <div className="h-full rounded-full bg-kambada-amarelo" style={{ width: `${(c.alunos / (c.podiam || 1)) * 100}%` }} />
          </div>
          <p className="text-xs text-texto-suave">
            <b className="text-texto">{c.alunos} de {c.podiam}</b> {VERBO_TIPO[c.tipo]}
            {c.vezes > c.alunos && ` · ${c.vezes} vezes`}
            {c.acertos !== null && ` · ${c.acertos}% de acertos`}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Botões de exportar (planilha baixa direto; PDF abre a versão para imprimir). */
export function Exportar({ planilha, imprimir }: { planilha: string; imprimir?: string }) {
  const classe = "inline-flex items-center gap-2 rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={planilha} className={classe} download>
        ⬇ Planilha (Excel)
      </a>
      {imprimir && (
        <Link href={imprimir} className={classe} target="_blank">
          🖨 PDF / imprimir
        </Link>
      )}
    </div>
  );
}

/** Endereço da ficha do aluno (relatório individual). */
export const linkFicha = (a: MapaAluno) => rotaEscola(`/professor/turma/${a.turmaId}/aluno/${a.id}`);
