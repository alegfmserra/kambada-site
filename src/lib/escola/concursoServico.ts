import { idAleatorio } from "../play/jogos/seguranca";
import { CONCURSO, CRITERIOS, LIMITE_CARACTERES, NOTA_MAXIMA, contarPalavras } from "./concurso";
import { alterar, lerDados, type Aluno, type Dados, type Membro, type Redacao, type Turma } from "./dados";
import { ErroEscola, anotar, nomeParaQuem, podeVerTurma, soGestao, soGestor } from "./servico";
import type { Etapa } from "./tipos";

/**
 * Concurso de redação (somente servidor). Fases:
 * aluno escreve e envia → professor avalia (grade) e escolhe até 3 finalistas
 * da turma → coordenação escolhe a representante da escola por etapa →
 * gestão Kambada dá 1º, 2º e 3º lugar entre as escolas (etapa da rede).
 *
 * Privacidade: o texto sai da escola só com o apelido (etapa da rede e
 * resultado); o nome de verdade, como no resto do portal, só a escola vê.
 */

const daVez = (d: Dados) => (d.redacoes ??= []).filter((r) => r.concursoId === CONCURSO.id);
const total = (r: Redacao) => (r.avaliacao ? Object.values(r.avaliacao.notas).reduce((s, n) => s + n, 0) : null);
const etapaDa = (d: Dados, r: Redacao): Etapa => d.turmas.find((t) => t.id === r.turmaId)?.etapa ?? "f1";

// ---------------------------------------------------------------------------
// Aluno
// ---------------------------------------------------------------------------

export type MinhaRedacao = {
  texto: string;
  enviada: boolean;
  /** A nota e o comentário só aparecem depois que o professor avalia. */
  avaliacao: { notas: Record<string, number>; comentario: string; total: number } | null;
  finalista: boolean;
  representante: boolean;
  colocacao: number | null;
};

export async function minhaRedacao(aluno: Aluno): Promise<MinhaRedacao> {
  const d = await lerDados();
  const r = (d.redacoes ?? []).find((x) => x.concursoId === CONCURSO.id && x.alunoId === aluno.id);
  return {
    texto: r?.texto ?? "",
    enviada: !!r?.enviadaEm,
    avaliacao: r?.avaliacao ? { notas: r.avaliacao.notas, comentario: r.avaliacao.comentario, total: total(r)! } : null,
    finalista: !!r?.finalista,
    representante: !!r?.representante,
    colocacao: r?.colocacao ?? null,
  };
}

/** Salva o rascunho ou envia ao professor (depois de enviada, não muda mais). */
export async function salvarRedacao(aluno: Aluno, turma: Turma, textoBruto: unknown, enviar: unknown): Promise<MinhaRedacao> {
  if (typeof textoBruto !== "string") throw new ErroEscola("Texto inválido.");
  const texto = textoBruto.replace(/\r\n/g, "\n").slice(0, LIMITE_CARACTERES);
  const proposta = CONCURSO.propostas[turma.etapa];
  if (enviar === true) {
    const n = contarPalavras(texto);
    if (n < proposta.minPalavras) throw new ErroEscola(`Escreve pelo menos ${proposta.minPalavras} palavras (tu tem ${n}).`);
    if (n > proposta.maxPalavras) throw new ErroEscola(`O limite é ${proposta.maxPalavras} palavras (tu tem ${n}).`);
  }
  await alterar((d) => {
    const lista = (d.redacoes ??= []);
    let r = lista.find((x) => x.concursoId === CONCURSO.id && x.alunoId === aluno.id);
    if (r?.enviadaEm) throw new ErroEscola("Tua redação já foi enviada ao professor.");
    const agora = new Date().toISOString();
    if (!r) {
      r = { id: `r-${idAleatorio(8)}`, concursoId: CONCURSO.id, alunoId: aluno.id, turmaId: aluno.turmaId, texto, atualizadaEm: agora };
      lista.push(r);
    }
    r.texto = texto;
    r.atualizadaEm = agora;
    if (enviar === true) r.enviadaEm = agora;
  });
  return minhaRedacao(aluno);
}

export type Premiada = { etapa: Etapa; colocacao: number; apelido: string; avatar: string; turma: string; escola: string };

/** Resultado da etapa da rede (público para os alunos: só apelido, turma e escola). */
export async function resultadoDoConcurso(): Promise<Premiada[]> {
  const d = await lerDados();
  return daVez(d)
    .filter((r) => r.colocacao)
    .map((r) => {
      const a = d.alunos.find((x) => x.id === r.alunoId);
      return { etapa: etapaDa(d, r), colocacao: r.colocacao!, apelido: a?.apelido ?? "?", avatar: a?.avatar ?? "", turma: d.turmas.find((t) => t.id === r.turmaId)?.nome ?? "", escola: d.escola.nome };
    })
    .sort((x, y) => x.etapa.localeCompare(y.etapa) || x.colocacao - y.colocacao);
}

// ---------------------------------------------------------------------------
// Escola: professor, coordenação; e a rede: gestão Kambada
// ---------------------------------------------------------------------------

export type RedacaoNaEscola = {
  id: string;
  alunoId: string;
  apelido: string;
  avatar: string;
  /** Nome de verdade: só a escola (null para a gestão Kambada). */
  nome: string | null;
  turma: string;
  turmaId: string;
  etapa: Etapa;
  texto: string;
  palavras: number;
  enviada: boolean;
  avaliacao: { notas: Record<string, number>; comentario: string; total: number } | null;
  finalista: boolean;
  representante: boolean;
  colocacao: number | null;
};

function naEscola(m: Membro, d: Dados, r: Redacao): RedacaoNaEscola {
  const a = d.alunos.find((x) => x.id === r.alunoId)!;
  const t = d.turmas.find((x) => x.id === r.turmaId);
  return {
    id: r.id,
    alunoId: a.id,
    apelido: a.apelido,
    avatar: a.avatar,
    nome: nomeParaQuem(m, a),
    turma: t?.nome ?? "",
    turmaId: r.turmaId,
    etapa: t?.etapa ?? "f1",
    texto: r.texto,
    palavras: contarPalavras(r.texto),
    enviada: !!r.enviadaEm,
    avaliacao: r.avaliacao ? { notas: r.avaliacao.notas, comentario: r.avaliacao.comentario, total: total(r)! } : null,
    finalista: !!r.finalista,
    representante: !!r.representante,
    colocacao: r.colocacao ?? null,
  };
}

/** Melhor nota primeiro; depois as enviadas sem nota; rascunhos no fim. */
const ordem = (x: RedacaoNaEscola, y: RedacaoNaEscola) =>
  Number(y.enviada) - Number(x.enviada) || (y.avaliacao?.total ?? -1) - (x.avaliacao?.total ?? -1) || x.apelido.localeCompare(y.apelido, "pt-BR");

export type RedacoesDaTurma = {
  turma: { id: string; nome: string; etapa: Etapa };
  redacoes: RedacaoNaEscola[];
  /** Alunos da turma que ainda não começaram. */
  semTexto: { apelido: string; avatar: string; nome: string | null }[];
};

export async function redacoesDaTurma(m: Membro, turmaId: string): Promise<RedacoesDaTurma> {
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  const daTurma = daVez(d).filter((r) => r.turmaId === t.id && d.alunos.some((a) => a.id === r.alunoId));
  const comTexto = new Set(daTurma.map((r) => r.alunoId));
  return {
    turma: { id: t.id, nome: t.nome, etapa: t.etapa },
    redacoes: daTurma.map((r) => naEscola(m, d, r)).sort(ordem),
    semTexto: d.alunos.filter((a) => a.turmaId === t.id && !comTexto.has(a.id)).map((a) => ({ apelido: a.apelido, avatar: a.avatar, nome: nomeParaQuem(m, a) })),
  };
}

function redacaoDaEscola(d: Dados, m: Membro, id: unknown): Redacao {
  const r = typeof id === "string" ? daVez(d).find((x) => x.id === id) : undefined;
  const t = r && d.turmas.find((x) => x.id === r.turmaId);
  if (!r || !t || !podeVerTurma(m, t)) throw new ErroEscola("Redação não encontrada.", 404);
  return r;
}

/** Professor da turma (ou coordenação/gestão): nota de 1 a 5 em cada critério e um comentário para o aluno. */
export async function avaliarRedacao(m: Membro, id: unknown, notas: unknown, comentario: unknown): Promise<void> {
  if (!notas || typeof notas !== "object") throw new ErroEscola("Dê a nota de cada critério.");
  const limpas: Record<string, number> = {};
  for (const c of CRITERIOS) {
    const n = (notas as Record<string, unknown>)[c.id];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > NOTA_MAXIMA) throw new ErroEscola(`Dê a nota de 1 a ${NOTA_MAXIMA} em “${c.nome}”.`);
    limpas[c.id] = n;
  }
  const texto = typeof comentario === "string" ? comentario.trim().slice(0, 600) : "";
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    if (!r.enviadaEm) throw new ErroEscola("O aluno ainda não enviou esta redação.");
    r.avaliacao = { notas: limpas, comentario: texto, por: m.id, em: new Date().toISOString() };
  });
}

/** Professor: até 3 finalistas por turma (só redação avaliada). */
export async function marcarFinalista(m: Membro, id: unknown, ligado: unknown): Promise<void> {
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    if (ligado === true) {
      if (!r.avaliacao) throw new ErroEscola("Avalie a redação antes de escolher como finalista.");
      const ja = daVez(d).filter((x) => x.turmaId === r.turmaId && x.finalista && x.id !== r.id).length;
      if (ja >= CONCURSO.finalistasPorTurma) throw new ErroEscola(`Cada turma tem até ${CONCURSO.finalistasPorTurma} finalistas. Tire uma antes.`);
      r.finalista = true;
    } else {
      r.finalista = false;
      r.representante = false;
      delete r.colocacao;
    }
  });
}

export type FinalistasDaEscola = { etapa: Etapa; redacoes: RedacaoNaEscola[] }[];

/** Coordenação: as finalistas de todas as turmas, por etapa. */
export async function finalistasDaEscola(m: Membro): Promise<FinalistasDaEscola> {
  soGestao(m);
  const d = await lerDados();
  const fin = daVez(d).filter((r) => r.finalista).map((r) => naEscola(m, d, r)).sort(ordem);
  return (["f1", "f2"] as Etapa[]).map((etapa) => ({ etapa, redacoes: fin.filter((r) => r.etapa === etapa) }));
}

/** Coordenação: a redação que representa a escola na etapa (uma por etapa). */
export async function escolherRepresentante(m: Membro, id: unknown): Promise<void> {
  soGestao(m);
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    if (!r.finalista) throw new ErroEscola("Só uma finalista da turma pode representar a escola.");
    const etapa = etapaDa(d, r);
    for (const x of daVez(d)) if (x.representante && etapaDa(d, x) === etapa && x.id !== r.id) {
      x.representante = false;
      delete x.colocacao;
    }
    r.representante = true;
    anotar(d, m, `escolheu a redação de ${d.alunos.find((a) => a.id === r.alunoId)?.apelido} para representar a escola no concurso`);
  });
}

/** Gestão Kambada: as representantes das escolas (só apelido; o nome é da escola). */
export async function etapaDaRede(m: Membro): Promise<FinalistasDaEscola> {
  soGestor(m);
  const d = await lerDados();
  const rep = daVez(d).filter((r) => r.representante).map((r) => naEscola(m, d, r)).sort(ordem);
  return (["f1", "f2"] as Etapa[]).map((etapa) => ({ etapa, redacoes: rep.filter((r) => r.etapa === etapa) }));
}

/** Gestão Kambada: 1º, 2º ou 3º lugar (ou tirar a colocação). Cada colocação só uma vez por etapa. */
export async function darColocacao(m: Membro, id: unknown, colocacao: unknown): Promise<void> {
  soGestor(m);
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    if (!r.representante) throw new ErroEscola("Só a representante de uma escola concorre na etapa da rede.");
    if (colocacao === null) {
      delete r.colocacao;
      return;
    }
    if (colocacao !== 1 && colocacao !== 2 && colocacao !== 3) throw new ErroEscola("Colocação inválida.");
    const etapa = etapaDa(d, r);
    for (const x of daVez(d)) if (x.colocacao === colocacao && etapaDa(d, x) === etapa && x.id !== r.id) delete x.colocacao;
    r.colocacao = colocacao;
    anotar(d, m, `deu o ${colocacao}º lugar no concurso de redação (${etapa.toUpperCase()})`);
  });
}

/** Números do concurso para o painel (quantos escreveram, enviaram e foram avaliados, por turma). */
export async function resumoDoConcurso(m: Membro): Promise<{ turma: string; turmaId: string; alunos: number; escreveram: number; enviaram: number; avaliadas: number; finalistas: number }[]> {
  const d = await lerDados();
  return d.turmas
    .filter((t) => podeVerTurma(m, t))
    .map((t) => {
      const r = daVez(d).filter((x) => x.turmaId === t.id);
      return {
        turma: t.nome,
        turmaId: t.id,
        alunos: d.alunos.filter((a) => a.turmaId === t.id).length,
        escreveram: r.filter((x) => x.texto.trim()).length,
        enviaram: r.filter((x) => x.enviadaEm).length,
        avaliadas: r.filter((x) => x.avaliacao).length,
        finalistas: r.filter((x) => x.finalista).length,
      };
    });
}
