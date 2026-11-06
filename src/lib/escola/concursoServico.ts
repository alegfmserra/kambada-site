import { idAleatorio } from "../play/jogos/seguranca";
import { CONCURSO, CRITERIOS, HISTORICO, NOTA_MAXIMA, contarPalavras } from "./concurso";
import { apagarArquivo, guardarArquivo, lerArquivo } from "./arquivos";
import { alterar, lerDados, type Aluno, type ArquivoGuardado, type Dados, type Membro, type Redacao } from "./dados";
import { ErroEscola, anotar, nomeParaQuem, podeVerTurma, soGestao, soGestor } from "./servico";
import type { Etapa } from "./tipos";

/**
 * Concurso de redação (somente servidor). Fases:
 * o aluno escreve À MÃO, na folha do Kambada Play que o professor imprime →
 * o professor anexa a folha (PDF ou foto) no portal, avalia (grade) e
 * escolhe até 3 finalistas da turma → coordenação escolhe a representante
 * da escola por etapa → gestão Kambada dá 1º, 2º e 3º lugar entre as
 * escolas (etapa da rede). A nota de cada temporada vira a linha do tempo da
 * escrita do aluno no ano (`evolucaoDoAluno`).
 *
 * A criança não envia arquivo nem escreve na plataforma (regra do Play: sem
 * upload na área infantil); ela só vê a nota, o comentário e a correção.
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
  anexo: ArquivoGuardado | null;
  /** A correção do professor só aparece depois que ele avalia. */
  correcao: ArquivoGuardado | null;
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
    anexo: r?.anexo ?? null,
    correcao: r?.avaliacao && r.correcao ? r.correcao : null,
  };
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
  anexo: ArquivoGuardado | null;
  correcao: ArquivoGuardado | null;
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
    anexo: r.anexo ?? null,
    correcao: r.correcao ?? null,
  };
}

/** Melhor nota primeiro; depois as enviadas sem nota; rascunhos no fim. */
const ordem = (x: RedacaoNaEscola, y: RedacaoNaEscola) =>
  Number(y.enviada) - Number(x.enviada) || (y.avaliacao?.total ?? -1) - (x.avaliacao?.total ?? -1) || x.apelido.localeCompare(y.apelido, "pt-BR");

export type RedacoesDaTurma = {
  turma: { id: string; nome: string; etapa: Etapa };
  redacoes: RedacaoNaEscola[];
  /** Alunos da turma sem redação anexada nesta temporada. */
  semRedacao: { alunoId: string; apelido: string; avatar: string; nome: string | null }[];
};

export async function redacoesDaTurma(m: Membro, turmaId: string): Promise<RedacoesDaTurma> {
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  const daTurma = daVez(d).filter((r) => r.turmaId === t.id && r.enviadaEm && d.alunos.some((a) => a.id === r.alunoId));
  const comRedacao = new Set(daTurma.map((r) => r.alunoId));
  return {
    turma: { id: t.id, nome: t.nome, etapa: t.etapa },
    redacoes: daTurma.map((r) => naEscola(m, d, r)).sort(ordem),
    semRedacao: d.alunos
      .filter((a) => a.turmaId === t.id && !comRedacao.has(a.id))
      .sort((x, y) => x.apelido.localeCompare(y.apelido, "pt-BR"))
      .map((a) => ({ alunoId: a.id, apelido: a.apelido, avatar: a.avatar, nome: nomeParaQuem(m, a) })),
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
        escreveram: r.filter((x) => x.enviadaEm).length,
        enviaram: r.filter((x) => x.enviadaEm).length,
        avaliadas: r.filter((x) => x.avaliacao).length,
        finalistas: r.filter((x) => x.finalista).length,
      };
    });
}

// ---------------------------------------------------------------------------
// Arquivos: a redação em PDF/foto (aluno) e a correção (professor)
// ---------------------------------------------------------------------------

/**
 * Professor da turma (ou coordenação): anexa a redação que o aluno escreveu
 * na folha (PDF ou foto). Anexar = entregue. Trocar o arquivo depois mantém
 * a nota já dada.
 */
export async function anexarRedacaoDoAluno(m: Membro, alunoId: unknown, bytes: Uint8Array, nome: string): Promise<void> {
  if (m.papel === "gestor") throw new ErroEscola("A redação é da escola.", 403);
  const d0 = await lerDados();
  const aluno = typeof alunoId === "string" ? d0.alunos.find((a) => a.id === alunoId) : undefined;
  const t0 = aluno && d0.turmas.find((t) => t.id === aluno.turmaId);
  if (!aluno || !t0 || !podeVerTurma(m, t0)) throw new ErroEscola("Aluno não encontrado.", 404);
  const arq = await guardarArquivo(bytes, nome);
  let antigo: string | undefined;
  await alterar((d) => {
    const lista = (d.redacoes ??= []);
    let r = lista.find((x) => x.concursoId === CONCURSO.id && x.alunoId === aluno.id);
    if (!r) {
      r = { id: `r-${idAleatorio(8)}`, concursoId: CONCURSO.id, alunoId: aluno.id, turmaId: aluno.turmaId, texto: "", atualizadaEm: arq.em };
      lista.push(r);
    }
    antigo = r.anexo?.id;
    r.anexo = arq;
    r.atualizadaEm = arq.em;
    r.enviadaEm ??= arq.em;
  }).catch(async (e) => {
    await apagarArquivo(arq.id);
    throw e;
  });
  await apagarArquivo(antigo);
}

/** Tira a redação anexada por engano. Sem nota ainda, a redação sai inteira; com nota, sai só o arquivo. */
export async function tirarRedacaoDoAluno(m: Membro, id: unknown): Promise<void> {
  if (m.papel === "gestor") throw new ErroEscola("A redação é da escola.", 403);
  const apagar: (string | undefined)[] = [];
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    apagar.push(r.anexo?.id);
    delete r.anexo;
    if (!r.avaliacao) {
      apagar.push(r.correcao?.id);
      d.redacoes = d.redacoes!.filter((x) => x !== r);
    }
  });
  for (const a of apagar) await apagarArquivo(a);
}

/** Professor da turma (ou coordenação): anexa a correção da redação enviada. O aluno vê depois da avaliação. */
export async function anexarCorrecao(m: Membro, id: unknown, bytes: Uint8Array, nome: string): Promise<void> {
  if (m.papel === "gestor") throw new ErroEscola("A correção é da escola.", 403);
  redacaoDaEscola(await lerDados(), m, id);
  const arq = await guardarArquivo(bytes, nome);
  let antigo: string | undefined;
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    if (!r.enviadaEm) throw new ErroEscola("O aluno ainda não enviou esta redação.");
    antigo = r.correcao?.id;
    r.correcao = { ...arq, por: m.id };
  }).catch(async (e) => {
    await apagarArquivo(arq.id);
    throw e;
  });
  await apagarArquivo(antigo);
}

export async function tirarCorrecao(m: Membro, id: unknown): Promise<void> {
  if (m.papel === "gestor") throw new ErroEscola("A correção é da escola.", 403);
  let antigo: string | undefined;
  await alterar((d) => {
    const r = redacaoDaEscola(d, m, id);
    antigo = r.correcao?.id;
    delete r.correcao;
  });
  await apagarArquivo(antigo);
}

/**
 * Quem pode abrir um arquivo: o aluno dono da redação (o anexo sempre; a
 * correção depois da avaliação); a equipe da escola que vê a turma; a gestão
 * Kambada só o anexo das representantes (etapa da rede).
 */
export async function abrirArquivo(quem: { papel: "aluno"; aluno: Aluno } | { papel: "professor" | "coordenacao" | "gestor"; membro: Membro }, arquivoId: unknown): Promise<{ arquivo: ArquivoGuardado; bytes: Buffer }> {
  if (typeof arquivoId !== "string") throw new ErroEscola("Arquivo não encontrado.", 404);
  const d = await lerDados();
  const r = daVez(d).find((x) => x.anexo?.id === arquivoId || x.correcao?.id === arquivoId);
  if (!r) throw new ErroEscola("Arquivo não encontrado.", 404);
  const ehAnexo = r.anexo?.id === arquivoId;
  let pode = false;
  if (quem.papel === "aluno") pode = r.alunoId === quem.aluno.id && (ehAnexo || !!r.avaliacao);
  else if (quem.papel === "gestor") pode = ehAnexo && !!r.representante;
  else {
    const t = d.turmas.find((x) => x.id === r.turmaId);
    pode = !!t && podeVerTurma(quem.membro, t);
  }
  if (!pode) throw new ErroEscola("Arquivo não encontrado.", 404);
  const arquivo = ehAnexo ? r.anexo! : r.correcao!;
  return { arquivo, bytes: await lerArquivo(arquivo.id) };
}

// ---------------------------------------------------------------------------
// Evolução da escrita ao longo do ano (uma redação por temporada)
// ---------------------------------------------------------------------------

export type PontoDaEscrita = { id: string; temporada: string; mes: string; notas: Record<string, number> | null; total: number | null };

const totalDe = (notas: Record<string, number>) => Object.values(notas).reduce((s, n) => s + n, 0);

/** As notas do aluno em cada redação do ano, na ordem das temporadas (escola e o próprio aluno). */
export async function evolucaoDoAluno(alunoId: string): Promise<PontoDaEscrita[]> {
  const d = await lerDados();
  return HISTORICO.map((h) => {
    const r = (d.redacoes ?? []).find((x) => x.concursoId === h.id && x.alunoId === alunoId && x.avaliacao);
    return { id: h.id, temporada: h.temporada, mes: h.mes, notas: r?.avaliacao?.notas ?? null, total: r?.avaliacao ? totalDe(r.avaliacao.notas) : null };
  });
}

/** Média da turma em cada redação do ano (para a aba de redações e a coordenação). */
export async function evolucaoDaTurma(m: Membro, turmaId: string): Promise<(PontoDaEscrita & { avaliadas: number })[]> {
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  return HISTORICO.map((h) => {
    const rs = (d.redacoes ?? []).filter((x) => x.concursoId === h.id && x.turmaId === t.id && x.avaliacao);
    const media = (c: string) => Math.round((rs.reduce((s, r) => s + (r.avaliacao!.notas[c] ?? 0), 0) / rs.length) * 10) / 10;
    const notas = rs.length ? Object.fromEntries(CRITERIOS.map((c) => [c.id, media(c.id)])) : null;
    return { id: h.id, temporada: h.temporada, mes: h.mes, notas, total: notas ? Math.round(totalDe(notas) * 10) / 10 : null, avaliadas: rs.length };
  });
}
