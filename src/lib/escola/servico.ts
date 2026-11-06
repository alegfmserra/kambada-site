import { randomInt } from "node:crypto";
import { idAleatorio } from "../play/jogos/seguranca";
import { alterar, lerDados, restaurar, type Aluno, type Dados, type Evento, type Membro, type Partida, type Registro, type Turma } from "./dados";
import { TRILHAS, habilidades, publica, questaoPorId, trilhaPorId, trilhasDaEtapa, type Questao } from "./desafios";
import { gerarHash, marca, senhaConfere, senhaInicial } from "./senha";
import { ATIVIDADES, atividadePorId, type TipoCultura } from "./cultura";
import { MISSAO } from "./missao";
import type { SessaoEscola } from "./sessao";
import {
  AVATARES,
  DISCIPLINAS,
  NOME_PAPEL,
  ORDEM_SITUACAO,
  PERMISSOES,
  PONTOS,
  TODAS_PERMISSOES,
  type AlunoPublico,
  type Disciplina,
  type EscolaPublica,
  type Etapa,
  type Papel,
  type Permissao,
  type QuestaoPublica,
  type Resultado,
  type Situacao,
  type TrilhaPublica,
} from "./tipos";

/**
 * Regras do portal da escola (somente servidor). As telas e a API só falam
 * com este arquivo; o armazenamento (hoje JSON) fica em `dados.ts`.
 *
 * Quem pode o quê:
 *  - aluno: joga as trilhas da etapa da turma e vê o ranking;
 *  - professor: cadastra apelidos nas SUAS turmas, imprime cartões e vê o relatório delas;
 *  - coordenação: cadastra professores e turmas, vê todas as turmas e o relatório geral;
 *  - gestão Kambada (hub): tudo o que a coordenação faz, mais cadastrar a coordenação,
 *    ligar e desligar permissões de cada professor, suspender acesso, restaurar a
 *    demonstração e ver o registro de atividades.
 * O que o professor pode fazer nas turmas dele depende das permissões (`podeFazer`).
 */

export class ErroEscola extends Error {
  constructor(mensagem: string, readonly status = 400) {
    super(mensagem);
  }
}

// ---------------------------------------------------------------------------
// Quem está na sessão
// ---------------------------------------------------------------------------

export function marcaDoAluno(a: Aluno): string {
  return marca(`${a.id}|${a.figuras.join("-")}`);
}
export function marcaDoMembro(m: Membro): string {
  return marca(m.senhaHash);
}

export type Quem =
  | { papel: "aluno"; aluno: Aluno; turma: Turma }
  | { papel: "professor"; membro: Membro }
  | { papel: "coordenacao"; membro: Membro }
  | { papel: "gestor"; membro: Membro };

export async function quemEsta(s: SessaoEscola | null): Promise<Quem | null> {
  if (!s) return null;
  const d = await lerDados();
  if (s.p === "aluno") {
    const aluno = d.alunos.find((a) => a.id === s.id);
    const turma = aluno && d.turmas.find((t) => t.id === aluno.turmaId);
    if (!aluno || !turma || marcaDoAluno(aluno) !== s.m) return null;
    return { papel: "aluno", aluno, turma };
  }
  const membro = d.membros.find((m) => m.id === s.id);
  if (!membro || membro.papel !== s.p || membro.ativo === false || marcaDoMembro(membro) !== s.m) return null;
  return { papel: membro.papel, membro } as Quem;
}

export async function escolaPublica(): Promise<EscolaPublica & { demo: boolean }> {
  const d = await lerDados();
  return { ...d.escola, demo: d.demo };
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

const publicoAluno = (a: Aluno): AlunoPublico => ({ id: a.id, apelido: a.apelido, avatar: a.avatar });

export async function turmaPorCodigo(codigo: unknown): Promise<{ turma: string; alunos: AlunoPublico[] } | null> {
  if (typeof codigo !== "string" || !/^\d{4}$/.test(codigo.trim())) return null;
  const d = await lerDados();
  const turma = d.turmas.find((t) => t.codigo === codigo.trim());
  if (!turma) return null;
  const alunos = d.alunos
    .filter((a) => a.turmaId === turma.id)
    .sort((x, y) => x.apelido.localeCompare(y.apelido, "pt-BR"))
    .map(publicoAluno);
  return { turma: turma.nome, alunos };
}

export async function entrarAluno(codigo: unknown, alunoId: unknown, figuras: unknown): Promise<Aluno | null> {
  if (typeof codigo !== "string" || typeof alunoId !== "string" || !Array.isArray(figuras) || figuras.length !== 3) return null;
  const d = await lerDados();
  const turma = d.turmas.find((t) => t.codigo === codigo.trim());
  const aluno = turma && d.alunos.find((a) => a.id === alunoId && a.turmaId === turma.id);
  if (!aluno) return null;
  return aluno.figuras.every((f, i) => f === figuras[i]) ? aluno : null;
}

export async function entrarMembro(usuario: unknown, senha: unknown): Promise<Membro | null> {
  if (typeof usuario !== "string" || typeof senha !== "string" || usuario.length > 60 || senha.length > 100) return null;
  const d = await lerDados();
  const m = d.membros.find((x) => x.usuario === usuario.trim().toLowerCase());
  // Sem usuário, compara mesmo assim: o tempo não revela se o usuário existe.
  const ok = senhaConfere(senha, m?.senhaHash ?? "scrypt$00$00");
  return m && ok ? m : null;
}

/** Conta de teste de aluno com usuário e senha (as crianças de verdade entram pelo código e pelas figuras). */
export async function entrarAlunoConta(usuario: unknown, senha: unknown): Promise<{ aluno: Aluno } | null> {
  if (typeof usuario !== "string" || typeof senha !== "string" || usuario.length > 60 || senha.length > 100) return null;
  const d = await lerDados();
  const a = d.alunos.find((x) => x.usuario && x.usuario === usuario.trim().toLowerCase());
  if (!a?.senhaHash || !senhaConfere(senha, a.senhaHash)) return null;
  return { aluno: a };
}

// ---------------------------------------------------------------------------
// Desafios (partida)
// ---------------------------------------------------------------------------

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function questaoPublica(q: Questao, ordem: number[]): QuestaoPublica {
  const t = questaoPorId(q.id)!.trilha;
  return { cena: q.cena, enunciado: q.enunciado, opcoes: ordem.map((i) => q.opcoes[i]), disciplina: t.disciplina, habilidade: q.habilidade };
}

export type EstadoPartida = {
  partida: string;
  trilha: TrilhaPublica;
  indice: number;
  total: number;
  tentativa: 1 | 2;
  questao: QuestaoPublica;
  pontos: number;
  /** Retomada na 2ª tentativa: a opção já riscada (na ordem da tela) e a dica. */
  descartada?: number;
  dica?: string;
};

export function trilhasDoAluno(turma: Turma): TrilhaPublica[] {
  return trilhasDaEtapa(turma.etapa).map(publica);
}

// ---------------------------------------------------------------------------
// Missão de reforço: perguntas escolhidas pelo que o aluno ainda erra
// ---------------------------------------------------------------------------

export { MISSAO };
const MISSAO_MAX = 10;
const MISSAO_MIN = 5;

/** Habilidades a treinar, da etapa da turma: as em ✗ primeiro, depois as que só acerta na segunda (↻). */
function paraTreinar(d: Dados, aluno: Aluno, turma: Turma): Ponto[] {
  const meus = d.registros.filter((r) => r.alunoId === aluno.id);
  const reforco: Ponto[] = [];
  const quase: Ponto[] = [];
  for (const disciplina of disciplinasDaEtapa(turma.etapa))
    for (const habilidade of habilidades(disciplina, turma.etapa)) {
      const c = celula(meus.filter((r) => r.disciplina === disciplina && r.habilidade === habilidade));
      if (c.status === "reforco") reforco.push({ disciplina, habilidade });
      if (c.status === "quase") quase.push({ disciplina, habilidade });
    }
  return [...reforco, ...quase];
}

/**
 * Perguntas da missão: revezando entre as habilidades a treinar (até 10),
 * primeiro as que o aluno errou da última vez, depois as que acertou na
 * segunda e as que ainda não viu. Com menos de 5, completa com outras
 * perguntas da etapa que ele ainda não acerta de primeira.
 */
function perguntasDaMissao(d: Dados, aluno: Aluno, turma: Turma): Questao[] {
  const alvo = paraTreinar(d, aluno, turma);
  if (!alvo.length) return [];
  const ultimo = new Map<string, Resultado>();
  for (const r of d.registros) if (r.alunoId === aluno.id) ultimo.set(r.questaoId, r.resultado);
  const PESO: Record<Resultado, number> = { reforco: 0, segunda: 1, primeira: 3 };
  // Errou da última vez < acertou na segunda < ainda não viu < acertou de primeira.
  const peso = (q: Questao) => {
    const r = ultimo.get(q.id);
    return r ? PESO[r] : 2;
  };
  const daEtapa = trilhasDaEtapa(turma.etapa).flatMap((t) => t.questoes.map((q) => ({ q, disciplina: t.disciplina })));
  const ordenar = (lista: Questao[]) => embaralhar(lista).sort((x, y) => peso(x) - peso(y));
  const filas = alvo.map((p) => ordenar(daEtapa.filter((x) => x.disciplina === p.disciplina && x.q.habilidade === p.habilidade).map((x) => x.q)));
  const escolhidas: Questao[] = [];
  while (escolhidas.length < MISSAO_MAX && filas.some((f) => f.length))
    for (const f of filas) if (f.length && escolhidas.length < MISSAO_MAX) escolhidas.push(f.shift()!);
  if (escolhidas.length < MISSAO_MIN) {
    const resto = ordenar(daEtapa.map((x) => x.q).filter((q) => !escolhidas.includes(q) && peso(q) < 3));
    escolhidas.push(...resto.slice(0, MISSAO_MIN - escolhidas.length));
  }
  return escolhidas;
}

/** O que a missão vai treinar agora (para o cartão do aluno e a ficha do professor). */
export async function missaoDoAluno(aluno: Aluno, turma: Turma): Promise<Ponto[]> {
  return paraTreinar(await lerDados(), aluno, turma).slice(0, 5);
}

/** Cartão da missão antes de a partida existir (a partida traz o resumo de verdade). */
export function missaoPublica(turma: Turma, alvo: Ponto[]): TrilhaPublica {
  const hab = alvo.map((p) => p.habilidade);
  return {
    id: MISSAO,
    titulo: "Missão de reforço",
    emoji: "🎯",
    disciplina: alvo[0]?.disciplina ?? "Matemática",
    etapa: turma.etapa,
    resumo: hab.length ? `Treinar ${hab.slice(0, -1).join(", ")}${hab.length > 1 ? " e " : ""}${hab[hab.length - 1]}` : "",
    total: MISSAO_MAX,
  };
}

function trilhaPublicaDa(p: Partida, turma: Turma): TrilhaPublica {
  if (p.trilhaId !== MISSAO) return publica(trilhaPorId(p.trilhaId)!);
  const qs = p.questoes.map((id) => questaoPorId(id)!);
  const hab = [...new Set(qs.map((x) => x.questao.habilidade))];
  return {
    id: MISSAO,
    titulo: "Missão de reforço",
    emoji: "🎯",
    disciplina: qs[0].trilha.disciplina,
    etapa: turma.etapa,
    resumo: `Treinar ${hab.slice(0, -1).join(", ")}${hab.length > 1 ? " e " : ""}${hab[hab.length - 1]}`,
    total: p.questoes.length,
  };
}

function estadoDa(p: Partida, turma: Turma): EstadoPartida {
  const q = questaoPorId(p.questoes[p.atual])!.questao;
  const estado: EstadoPartida = { partida: p.id, trilha: trilhaPublicaDa(p, turma), indice: p.atual, total: p.questoes.length, tentativa: p.tentativa, questao: questaoPublica(q, p.ordens[p.atual]), pontos: p.pontos };
  if (p.tentativa === 2 && p.primeiroErro !== null) {
    estado.descartada = p.ordens[p.atual].indexOf(p.primeiroErro);
    estado.dica = q.dica;
  }
  return estado;
}

export async function iniciarPartida(aluno: Aluno, turma: Turma, trilhaId: unknown): Promise<EstadoPartida> {
  const missao = trilhaId === MISSAO;
  const trilha = missao ? undefined : trilhaPorId(trilhaId);
  if (!missao && (!trilha || trilha.etapa !== turma.etapa)) throw new ErroEscola("Esse desafio não é da sua turma.", 404);
  const id = missao ? MISSAO : trilha!.id;
  return alterar((d) => {
    let p = d.partidas.find((x) => x.alunoId === aluno.id && x.trilhaId === id && !x.fim);
    if (!p) {
      const qs = missao ? perguntasDaMissao(d, aluno, turma) : embaralhar(trilha!.questoes);
      if (!qs.length) throw new ErroEscola("Tu tá mandando bem: nenhuma habilidade para reforçar agora! Joga um desafio da turma.", 404);
      p = {
        id: idAleatorio(),
        alunoId: aluno.id,
        trilhaId: id,
        questoes: qs.map((q) => q.id),
        ordens: qs.map((q) => embaralhar(q.opcoes.map((_, i) => i))),
        atual: 0,
        tentativa: 1,
        primeiroErro: null,
        pontos: 0,
        inicio: new Date().toISOString(),
      };
      d.partidas.push(p);
    }
    return estadoDa(p, turma);
  });
}

export type Resposta = {
  certo: boolean;
  /** Só quando a questão fecha. */
  resultado?: Resultado;
  pontosGanhos?: number;
  /** Primeiro erro: a dica e a opção que sai da tela. */
  dica?: string;
  descartada?: number;
  /** Questão fechada: explicação e a opção certa (na ordem da tela). */
  explica?: string;
  correta?: number;
  proxima?: EstadoPartida;
  fim?: { pontos: number; primeira: number; segunda: number; reforco: number };
};

export async function responder(aluno: Aluno, partidaId: unknown, escolha: unknown, origem?: unknown): Promise<Resposta> {
  if (typeof partidaId !== "string" || typeof escolha !== "number" || !Number.isInteger(escolha)) throw new ErroEscola("Resposta inválida.");
  return alterar((d) => {
    const p = d.partidas.find((x) => x.id === partidaId && x.alunoId === aluno.id && !x.fim);
    if (!p) throw new ErroEscola("Esse desafio já terminou. Comece de novo.", 404);
    // Na missão de reforço cada pergunta é de uma trilha; o registro leva a trilha de origem.
    const { trilha, questao: q } = questaoPorId(p.questoes[p.atual])!;
    const ordem = p.ordens[p.atual];
    if (escolha < 0 || escolha >= ordem.length) throw new ErroEscola("Resposta inválida.");
    const original = ordem[escolha];

    if (original !== q.correta && p.tentativa === 1) {
      p.tentativa = 2;
      p.primeiroErro = original;
      return { certo: false, dica: q.dica, descartada: escolha };
    }
    // A opção do primeiro erro já saiu da tela: repeti-la não conta.
    if (original === p.primeiroErro) throw new ErroEscola("Essa opção já foi tentada.");

    const resultado: Resultado = original === q.correta ? (p.tentativa === 1 ? "primeira" : "segunda") : "reforco";
    const reg: Registro = {
      alunoId: aluno.id,
      turmaId: aluno.turmaId,
      trilhaId: trilha.id,
      questaoId: q.id,
      disciplina: trilha.disciplina,
      habilidade: q.habilidade,
      resultado,
      errou: resultado === "primeira" ? null : p.primeiroErro,
      pontos: PONTOS[resultado],
      em: new Date().toISOString(),
      ...(origem === "arraial" ? { origem: "arraial" as const } : {}),
    };
    d.registros.push(reg);
    p.pontos += reg.pontos;
    const resposta: Resposta = { certo: resultado !== "reforco", resultado, pontosGanhos: reg.pontos, explica: q.explica, correta: ordem.indexOf(q.correta) };

    p.atual += 1;
    p.tentativa = 1;
    p.primeiroErro = null;
    if (p.atual >= p.questoes.length) {
      p.fim = new Date().toISOString();
      const desta = d.registros.filter((r) => r.alunoId === aluno.id && p.questoes.includes(r.questaoId) && r.em >= p.inicio);
      resposta.fim = {
        pontos: p.pontos,
        primeira: desta.filter((r) => r.resultado === "primeira").length,
        segunda: desta.filter((r) => r.resultado === "segunda").length,
        reforco: desta.filter((r) => r.resultado === "reforco").length,
      };
    } else {
      const turma = d.turmas.find((t) => t.id === aluno.turmaId)!;
      resposta.proxima = estadoDa(p, turma);
    }
    return resposta;
  });
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Pontos do aluno = a MELHOR pontuação em cada questão (refazer a trilha para
 * melhorar vale; repetir o que já acertou não soma de novo).
 */
function pontosPorAluno(registros: Registro[]): Map<string, number> {
  const melhor = new Map<string, number>();
  for (const r of registros) {
    const k = `${r.alunoId}|${r.questaoId}`;
    melhor.set(k, Math.max(melhor.get(k) ?? 0, r.pontos));
  }
  const total = new Map<string, number>();
  for (const [k, v] of melhor) {
    const id = k.split("|")[0];
    total.set(id, (total.get(id) ?? 0) + v);
  }
  return total;
}

export type LinhaRanking = { id: string; nome: string; avatar?: string; pontos: number; detalhe?: string };

export async function ranking(turmaId?: string): Promise<{ turmas: LinhaRanking[]; alunos: LinhaRanking[] }> {
  const d = await lerDados();
  const pts = pontosPorAluno(d.registros);
  const turmas = d.turmas
    .map((t) => {
      const membros = d.alunos.filter((a) => a.turmaId === t.id);
      const soma = membros.reduce((s, a) => s + (pts.get(a.id) ?? 0), 0);
      const media = membros.length ? Math.round(soma / membros.length) : 0;
      return { id: t.id, nome: t.nome, pontos: soma, detalhe: `${media} por aluno` };
    })
    .sort((a, b) => b.pontos - a.pontos);
  const alunos = d.alunos
    .filter((a) => !turmaId || a.turmaId === turmaId)
    .map((a) => ({ id: a.id, nome: a.apelido, avatar: a.avatar, pontos: pts.get(a.id) ?? 0, detalhe: d.turmas.find((t) => t.id === a.turmaId)?.nome }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 20);
  return { turmas, alunos };
}

export async function pontosDoAluno(alunoId: string): Promise<{ pontos: number; porTrilha: Record<string, { feitas: number; primeira: number }> }> {
  const d = await lerDados();
  const meus = d.registros.filter((r) => r.alunoId === alunoId);
  const porTrilha: Record<string, { feitas: number; primeira: number }> = {};
  const vistas = new Map<string, Resultado>();
  for (const r of meus) vistas.set(r.questaoId, r.resultado); // o último resultado de cada questão
  for (const [qid, res] of vistas) {
    const tid = questaoPorId(qid)?.trilha.id;
    if (!tid) continue;
    porTrilha[tid] ??= { feitas: 0, primeira: 0 };
    porTrilha[tid].feitas += 1;
    if (res === "primeira") porTrilha[tid].primeira += 1;
  }
  return { pontos: pontosPorAluno(meus).get(alunoId) ?? 0, porTrilha };
}

// ---------------------------------------------------------------------------
// Relatório por habilidade
// ---------------------------------------------------------------------------

/** domina = ✓ verde · quase = ↻ amarelo · reforco = ✗ vermelho · nada = ainda não jogou. */
export type Status = "domina" | "quase" | "reforco" | "nada";
export type Celula = { status: Status; primeira: number; segunda: number; reforco: number };

/** Olha as últimas 6 respostas da habilidade: o relatório mostra onde o aluno está AGORA. */
export function celula(regs: Registro[]): Celula {
  const ult = regs.slice(-6);
  const c = {
    primeira: ult.filter((r) => r.resultado === "primeira").length,
    segunda: ult.filter((r) => r.resultado === "segunda").length,
    reforco: ult.filter((r) => r.resultado === "reforco").length,
  };
  if (!ult.length) return { status: "nada", ...c };
  const nota = (c.primeira + c.segunda * 0.5) / ult.length;
  return { status: nota >= 0.75 ? "domina" : nota >= 0.45 ? "quase" : "reforco", ...c };
}

export type ErroComum = { questao: string; habilidade: string; escolha: string; diagnostico: string; quantos: number; apelidos: string[] };

export type RelatorioTurma = {
  turma: { id: string; nome: string; etapa: Etapa; codigo: string };
  disciplina: Disciplina;
  habilidades: string[];
  linhas: { aluno: AlunoPublico; celulas: Record<string, Celula> }[];
  resumo: { habilidade: string; domina: number; quase: number; reforco: number; nada: number }[];
  erros: ErroComum[];
  participacao: { ativos7d: number; total: number; respostas7d: number };
};

export function disciplinasDaEtapa(etapa: Etapa): Disciplina[] {
  return DISCIPLINAS.filter((x) => TRILHAS.some((t) => t.etapa === etapa && t.disciplina === x));
}

function montarRelatorio(d: Dados, turma: Turma, disciplina: Disciplina): RelatorioTurma {
  const habs = habilidades(disciplina, turma.etapa);
  const alunos = d.alunos.filter((a) => a.turmaId === turma.id).sort((x, y) => x.apelido.localeCompare(y.apelido, "pt-BR"));
  const regs = d.registros.filter((r) => r.turmaId === turma.id && r.disciplina === disciplina);
  const linhas = alunos.map((a) => {
    const meus = regs.filter((r) => r.alunoId === a.id);
    return { aluno: publicoAluno(a), celulas: Object.fromEntries(habs.map((h) => [h, celula(meus.filter((r) => r.habilidade === h))])) };
  });
  const resumo = habs.map((h) => {
    const cont = { domina: 0, quase: 0, reforco: 0, nada: 0 };
    for (const l of linhas) cont[l.celulas[h].status] += 1;
    return { habilidade: h, ...cont };
  });

  // Erros mais comuns: questão + opção errada escolhida no primeiro erro.
  const grupos = new Map<string, { qid: string; opc: number; ids: Set<string> }>();
  for (const r of regs) {
    if (r.errou === null) continue;
    const k = `${r.questaoId}|${r.errou}`;
    const g = grupos.get(k) ?? { qid: r.questaoId, opc: r.errou, ids: new Set<string>() };
    g.ids.add(r.alunoId);
    grupos.set(k, g);
  }
  const erros = [...grupos.values()]
    .sort((a, b) => b.ids.size - a.ids.size)
    .slice(0, 5)
    .map((g) => {
      const q = questaoPorId(g.qid)!.questao;
      return {
        questao: q.enunciado,
        habilidade: q.habilidade,
        escolha: q.opcoes[g.opc],
        diagnostico: q.diagnostico?.[g.opc] ?? "Escolha errada.",
        quantos: g.ids.size,
        apelidos: [...g.ids].map((id) => d.alunos.find((a) => a.id === id)?.apelido ?? "?").sort(),
      };
    });

  const semana = Date.now() - 7 * 86400000;
  const todasDaTurma = d.registros.filter((r) => r.turmaId === turma.id && Date.parse(r.em) > semana);
  return {
    turma: { id: turma.id, nome: turma.nome, etapa: turma.etapa, codigo: turma.codigo },
    disciplina,
    habilidades: habs,
    linhas,
    resumo,
    erros,
    participacao: { ativos7d: new Set(todasDaTurma.map((r) => r.alunoId)).size, total: alunos.length, respostas7d: todasDaTurma.length },
  };
}

export function podeVerTurma(m: Membro, t: Turma): boolean {
  return m.papel !== "professor" || t.professorIds.includes(m.id);
}

/** Coordenação e gestão podem tudo; o professor, o que estiver ligado (sem lista = tudo). */
export function podeFazer(m: Membro, p: Permissao): boolean {
  return m.papel !== "professor" || (m.permissoes ?? TODAS_PERMISSOES).includes(p);
}

function exigirPermissao(m: Membro, p: Permissao) {
  if (!podeFazer(m, p)) throw new ErroEscola(`Seu acesso não inclui “${PERMISSOES.find((x) => x.id === p)!.rotulo}”. Fale com a coordenação.`, 403);
}

export async function relatorioTurma(m: Membro, turmaId: string, disciplina?: string): Promise<RelatorioTurma> {
  exigirPermissao(m, "relatorio");
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  const possiveis = disciplinasDaEtapa(t.etapa);
  const disc = possiveis.find((x) => x === disciplina) ?? possiveis[0];
  return montarRelatorio(d, t, disc);
}

export type ResumoTurma = {
  id: string;
  nome: string;
  etapa: Etapa;
  codigo: string;
  alunos: number;
  professores: string[];
  ativos7d: number;
  porDisciplina: { disciplina: Disciplina; domina: number; quase: number; reforco: number; nada: number }[];
};

export async function resumoDasTurmas(m: Membro): Promise<ResumoTurma[]> {
  const d = await lerDados();
  return d.turmas
    .filter((t) => podeVerTurma(m, t))
    .map((t) => {
      const porDisciplina = disciplinasDaEtapa(t.etapa).map((disc) => {
        const rel = montarRelatorio(d, t, disc);
        const cont = { domina: 0, quase: 0, reforco: 0, nada: 0 };
        for (const r of rel.resumo) {
          cont.domina += r.domina;
          cont.quase += r.quase;
          cont.reforco += r.reforco;
          cont.nada += r.nada;
        }
        return { disciplina: disc, ...cont };
      });
      const semana = Date.now() - 7 * 86400000;
      return {
        id: t.id,
        nome: t.nome,
        etapa: t.etapa,
        codigo: t.codigo,
        alunos: d.alunos.filter((a) => a.turmaId === t.id).length,
        professores: t.professorIds.map((id) => d.membros.find((x) => x.id === id)?.nome ?? "?"),
        ativos7d: new Set(d.registros.filter((r) => r.turmaId === t.id && Date.parse(r.em) > semana).map((r) => r.alunoId)).size,
        porDisciplina,
      };
    });
}

// ---------------------------------------------------------------------------
// Gestão (professor e coordenação)
// ---------------------------------------------------------------------------

/** Na tela da equipe: o nome de verdade vem só para a escola (null para a gestão Kambada). */
export type AlunoComFiguras = AlunoPublico & { figuras: number[]; nome: string | null };

/** Nome de verdade do aluno: só a escola (coordenação e professores da turma). A Kambada e o público veem o apelido. */
export function veNomes(m: Membro): boolean {
  return m.papel !== "gestor";
}

export const nomeParaQuem = (m: Membro, a: Aluno): string | null => (veNomes(m) ? (a.nome ?? "") : null);
const paraEquipe = (m: Membro, a: Aluno, figuras = a.figuras): AlunoComFiguras => ({ ...publicoAluno(a), figuras, nome: nomeParaQuem(m, a) });

function nomeDeAlunoValido(bruto: unknown): string | undefined {
  if (bruto === undefined || bruto === null) return undefined;
  const n = typeof bruto === "string" ? bruto.replace(/\s+/g, " ").trim() : "";
  if (!n) return undefined;
  if (n.length < 2 || n.length > 80 || !/^[\p{L}\p{M} '.-]+$/u.test(n)) throw new ErroEscola("Nome com 2 a 80 letras (só a escola vê).");
  return n;
}

export async function alunosDaTurma(m: Membro, turmaId: string): Promise<{ turma: Turma; alunos: AlunoComFiguras[] }> {
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  const alunos = d.alunos
    .filter((a) => a.turmaId === t.id)
    .sort((x, y) => x.apelido.localeCompare(y.apelido, "pt-BR"))
    .map((a) => paraEquipe(m, a));
  return { turma: t, alunos };
}

/** Apelido: 3 a 20 letras, números, _ ou -; sem espaço (não é lugar de nome completo). */
export function apelidoValido(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const a = bruto.trim();
  if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(a)) return null;
  return a;
}

const figurasNovas = () => [randomInt(9), randomInt(9), randomInt(9)];

export async function criarAluno(m: Membro, turmaId: string, apelidoBruto: unknown, nomeBruto?: unknown): Promise<AlunoComFiguras> {
  const apelido = apelidoValido(apelidoBruto);
  exigirPermissao(m, "cadastrar-alunos");
  const nome = veNomes(m) ? nomeDeAlunoValido(nomeBruto) : undefined;
  if (!apelido) throw new ErroEscola("Apelido com 3 a 20 letras ou números, sem espaço. Nada de nome completo.");
  return alterar((d) => {
    const t = d.turmas.find((x) => x.id === turmaId);
    if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
    const daTurma = d.alunos.filter((a) => a.turmaId === t.id);
    if (daTurma.some((a) => a.apelido.toLowerCase() === apelido.toLowerCase())) throw new ErroEscola("Já existe esse apelido na turma.");
    if (daTurma.length >= 60) throw new ErroEscola("Limite de 60 alunos por turma.");
    const a: Aluno = { id: `a-${idAleatorio(6)}`, turmaId: t.id, apelido, ...(nome ? { nome } : {}), avatar: AVATARES[randomInt(AVATARES.length)], figuras: figurasNovas(), criadoEm: new Date().toISOString() };
    d.alunos.push(a);
    anotar(d, m, `cadastrou o aluno ${a.apelido} no ${t.nome}`);
    // Sem "Cartões e figuras", quem cadastrou não vê a senha de figuras.
    return paraEquipe(m, a, podeFazer(m, "cartoes") ? a.figuras : []);
  });
}

/** Liga o apelido à criança (ou apaga o nome). Só a escola, com "Cadastrar alunos". */
export async function nomearAluno(m: Membro, alunoId: unknown, nomeBruto: unknown): Promise<AlunoComFiguras> {
  if (!veNomes(m)) throw new ErroEscola("O nome dos alunos é só da escola.", 403);
  exigirPermissao(m, "cadastrar-alunos");
  const nome = nomeDeAlunoValido(nomeBruto);
  return alterar((d) => {
    const a = alunoGerenciavel(d, m, alunoId);
    if (nome) a.nome = nome;
    else delete a.nome;
    // No registro vai só o apelido: o nome não circula nem no histórico.
    anotar(d, m, `atualizou o nome (só a escola vê) de ${a.apelido}`);
    return paraEquipe(m, a, podeFazer(m, "cartoes") ? a.figuras : []);
  });
}

function alunoGerenciavel(d: Dados, m: Membro, alunoId: unknown): Aluno {
  const a = d.alunos.find((x) => x.id === alunoId);
  const t = a && d.turmas.find((x) => x.id === a.turmaId);
  if (!a || !t || !podeVerTurma(m, t)) throw new ErroEscola("Aluno não encontrado.", 404);
  return a;
}

/** Nova senha de figuras: a antiga deixa de valer e a sessão do aluno cai. */
export async function novasFiguras(m: Membro, alunoId: unknown): Promise<AlunoComFiguras> {
  exigirPermissao(m, "cartoes");
  return alterar((d) => {
    const a = alunoGerenciavel(d, m, alunoId);
    a.figuras = figurasNovas();
    anotar(d, m, `trocou as figuras de ${a.apelido}`);
    return paraEquipe(m, a);
  });
}

export async function removerAluno(m: Membro, alunoId: unknown): Promise<void> {
  exigirPermissao(m, "remover-alunos");
  await alterar((d) => {
    const a = alunoGerenciavel(d, m, alunoId);
    anotar(d, m, `removeu o aluno ${a.apelido}`);
    d.alunos = d.alunos.filter((x) => x.id !== a.id);
    // Os dados são da escola: saiu o aluno, saem as respostas dele.
    d.registros = d.registros.filter((r) => r.alunoId !== a.id);
    d.partidas = d.partidas.filter((p) => p.alunoId !== a.id);
  });
}

/** Coordenação ou gestão Kambada. */
export function soGestao(m: Membro) {
  if (m.papel === "professor") throw new ErroEscola("Só a coordenação faz isso.", 403);
}

/** Só a gestão Kambada (hub). */
export function soGestor(m: Membro) {
  if (m.papel !== "gestor") throw new ErroEscola("Só a gestão Kambada faz isso.", 403);
}

/** Linha no registro de atividades do hub (as 300 mais recentes). */
export function anotar(d: Dados, m: Membro, texto: string) {
  d.log = [...(d.log ?? []), { em: new Date().toISOString(), quem: m.nome, texto }].slice(-300);
}

export type MembroPublico = {
  id: string;
  nome: string;
  usuario: string;
  papel: Papel;
  disciplinas: Disciplina[];
  turmas: string[];
  permissoes: Permissao[];
  ativo: boolean;
};

export async function equipe(m: Membro): Promise<{ membros: MembroPublico[]; turmas: { id: string; nome: string; etapa: Etapa; codigo: string; professorIds: string[] }[] }> {
  soGestao(m);
  const d = await lerDados();
  return {
    membros: d.membros
      // A coordenação não vê (nem mexe) no acesso da Kambada.
      .filter((x) => m.papel === "gestor" || x.papel !== "gestor")
      .map((x) => ({
        id: x.id,
        nome: x.nome,
        usuario: x.usuario,
        papel: x.papel,
        disciplinas: x.disciplinas,
        turmas: d.turmas.filter((t) => t.professorIds.includes(x.id)).map((t) => t.nome),
        permissoes: x.papel === "professor" ? (x.permissoes ?? TODAS_PERMISSOES) : TODAS_PERMISSOES,
        ativo: x.ativo !== false,
      })),
    turmas: d.turmas.map((t) => ({ id: t.id, nome: t.nome, etapa: t.etapa, codigo: t.codigo, professorIds: t.professorIds })),
  };
}

function usuarioValido(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const u = bruto.trim().toLowerCase();
  return /^[a-z0-9._-]{3,30}$/.test(u) ? u : null;
}

function nomeValido(bruto: unknown): string {
  const n = typeof bruto === "string" ? bruto.replace(/\s+/g, " ").trim() : "";
  if (n.length < 2 || n.length > 60) throw new ErroEscola("Nome com 2 a 60 letras.");
  return n;
}

const listaDisciplinas = (v: unknown): Disciplina[] => (Array.isArray(v) ? DISCIPLINAS.filter((x) => v.includes(x)) : []);
const listaPermissoes = (v: unknown): Permissao[] => (Array.isArray(v) ? TODAS_PERMISSOES.filter((x) => v.includes(x)) : TODAS_PERMISSOES);

export type NovoMembro = { nome: unknown; usuario: unknown; papel?: unknown; disciplinas?: unknown; turmas?: unknown; permissoes?: unknown };

/**
 * Cadastra professor (coordenação ou gestão) ou coordenação (só gestão).
 * A senha inicial volta uma vez só, para a tela mostrar.
 */
export async function criarMembro(m: Membro, novo: NovoMembro): Promise<{ usuario: string; senha: string }> {
  soGestao(m);
  const papel = novo.papel === "coordenacao" ? "coordenacao" : "professor";
  if (papel === "coordenacao") soGestor(m);
  const n = nomeValido(novo.nome);
  const u = usuarioValido(novo.usuario);
  if (!u) throw new ErroEscola("Usuário com 3 a 30 letras minúsculas, números, ponto ou traço (ex.: prof.ana).");
  const turmas = Array.isArray(novo.turmas) ? novo.turmas.filter((x): x is string => typeof x === "string") : [];
  // Só a gestão escolhe permissões na criação; a coordenação cria com tudo ligado.
  const permissoes = papel === "professor" && m.papel === "gestor" && novo.permissoes !== undefined ? listaPermissoes(novo.permissoes) : undefined;
  const senha = senhaInicial();
  const senhaHash = gerarHash(senha);
  await alterar((d) => {
    if (d.membros.some((x) => x.usuario === u)) throw new ErroEscola("Esse usuário já existe.");
    if (d.membros.length >= 200) throw new ErroEscola("Limite de 200 pessoas na equipe.");
    const id = `m-${idAleatorio(6)}`;
    d.membros.push({ id, papel, nome: n, usuario: u, senhaHash, disciplinas: listaDisciplinas(novo.disciplinas), ...(permissoes ? { permissoes } : {}), criadoEm: new Date().toISOString() });
    if (papel === "professor") for (const t of d.turmas) if (turmas.includes(t.id) && !t.professorIds.includes(id)) t.professorIds.push(id);
    anotar(d, m, `cadastrou ${NOME_PAPEL[papel].toLowerCase()} ${n} (${u})`);
  });
  return { usuario: u, senha };
}

export function criarProfessor(m: Membro, nome: unknown, usuario: unknown, disciplinas: unknown, turmaIds: unknown): Promise<{ usuario: string; senha: string }> {
  return criarMembro(m, { nome, usuario, papel: "professor", disciplinas, turmas: turmaIds });
}

/** Pessoa da equipe que `m` pode administrar: coordenação mexe em professor; gestão, em professor e coordenação (nunca em si mesma). */
function membroGerenciavel(d: Dados, m: Membro, id: unknown): Membro {
  const x = d.membros.find((y) => y.id === id);
  const ok = x && x.id !== m.id && x.papel !== "gestor" && (x.papel === "professor" || m.papel === "gestor");
  if (!x || !ok) throw new ErroEscola("Pessoa não encontrada.", 404);
  return x;
}

/** Gestão: nome, usuário, disciplinas e permissões (estas, só de professor). */
export async function editarMembro(m: Membro, id: unknown, dados: Record<string, unknown>): Promise<void> {
  soGestor(m);
  const nome = nomeValido(dados.nome);
  const u = usuarioValido(dados.usuario);
  if (!u) throw new ErroEscola("Usuário com 3 a 30 letras minúsculas, números, ponto ou traço.");
  await alterar((d) => {
    const x = membroGerenciavel(d, m, id);
    if (d.membros.some((y) => y.usuario === u && y.id !== x.id)) throw new ErroEscola("Esse usuário já existe.");
    x.nome = nome;
    x.usuario = u;
    x.disciplinas = listaDisciplinas(dados.disciplinas);
    if (x.papel === "professor" && dados.permissoes !== undefined) x.permissoes = listaPermissoes(dados.permissoes);
    anotar(d, m, `editou ${nome} (${u})`);
  });
}

/** Gestão: liga ou desliga UMA permissão de um professor. */
export async function permissao(m: Membro, id: unknown, perm: unknown, ligada: unknown): Promise<void> {
  soGestor(m);
  const p = TODAS_PERMISSOES.find((x) => x === perm);
  if (!p) throw new ErroEscola("Permissão inválida.");
  await alterar((d) => {
    const x = membroGerenciavel(d, m, id);
    if (x.papel !== "professor") throw new ErroEscola("Permissões são só de professor; a coordenação pode tudo.");
    const atuais = (x.permissoes ?? TODAS_PERMISSOES).filter((y) => y !== p);
    x.permissoes = TODAS_PERMISSOES.filter((y) => atuais.includes(y) || (y === p && ligada === true));
    anotar(d, m, `${ligada === true ? "ligou" : "desligou"} “${PERMISSOES.find((y) => y.id === p)!.rotulo}” de ${x.nome}`);
  });
}

/** Gestão: suspende ou reativa o acesso (suspenso não entra e a sessão aberta cai na hora). */
export async function ativarMembro(m: Membro, id: unknown, ativo: unknown): Promise<void> {
  soGestor(m);
  await alterar((d) => {
    const x = membroGerenciavel(d, m, id);
    x.ativo = ativo === true;
    anotar(d, m, `${x.ativo ? "reativou" : "suspendeu"} o acesso de ${x.nome}`);
  });
}

export async function vincular(m: Membro, professorId: unknown, turmaId: unknown, ligado: unknown): Promise<void> {
  soGestao(m);
  await alterar((d) => {
    const p = d.membros.find((x) => x.id === professorId && x.papel === "professor");
    const t = d.turmas.find((x) => x.id === turmaId);
    if (!p || !t) throw new ErroEscola("Professor ou turma não encontrado.", 404);
    t.professorIds = t.professorIds.filter((x) => x !== p.id);
    if (ligado === true) t.professorIds.push(p.id);
    anotar(d, m, `${ligado === true ? "vinculou" : "desvinculou"} ${p.nome} ${ligado === true ? "ao" : "do"} ${t.nome}`);
  });
}

export async function removerMembro(m: Membro, id: unknown): Promise<void> {
  soGestao(m);
  await alterar((d) => {
    const x = membroGerenciavel(d, m, id);
    d.membros = d.membros.filter((y) => y.id !== x.id);
    for (const t of d.turmas) t.professorIds = t.professorIds.filter((y) => y !== x.id);
    anotar(d, m, `removeu ${x.nome} (${x.usuario}) da equipe`);
  });
}

export async function novaSenhaMembro(m: Membro, id: unknown): Promise<{ usuario: string; senha: string }> {
  soGestao(m);
  const senha = senhaInicial();
  const senhaHash = gerarHash(senha);
  const usuario = await alterar((d) => {
    const x = membroGerenciavel(d, m, id);
    x.senhaHash = senhaHash;
    anotar(d, m, `gerou senha nova para ${x.nome}`);
    return x.usuario;
  });
  return { usuario, senha };
}

function codigoNovo(d: Dados): string {
  for (;;) {
    const c = String(randomInt(1000, 10000));
    if (!d.turmas.some((t) => t.codigo === c)) return c;
  }
}

function nomeTurmaValido(bruto: unknown): string {
  const n = typeof bruto === "string" ? bruto.replace(/\s+/g, " ").trim() : "";
  if (n.length < 2 || n.length > 30) throw new ErroEscola("Nome da turma com 2 a 30 caracteres (ex.: 3º ano C).");
  return n;
}

export async function criarTurma(m: Membro, nome: unknown, etapa: unknown, professorIds: unknown): Promise<{ id: string; codigo: string }> {
  soGestao(m);
  const n = nomeTurmaValido(nome);
  if (etapa !== "f1" && etapa !== "f2") throw new ErroEscola("Escolha a etapa da turma.");
  const profs = Array.isArray(professorIds) ? professorIds.filter((x): x is string => typeof x === "string") : [];
  return alterar((d) => {
    if (d.turmas.length >= 100) throw new ErroEscola("Limite de 100 turmas.");
    if (d.turmas.some((t) => t.nome.toLowerCase() === n.toLowerCase())) throw new ErroEscola("Já existe uma turma com esse nome.");
    const t: Turma = { id: `t-${idAleatorio(6)}`, nome: n, etapa, codigo: codigoNovo(d), professorIds: profs.filter((id) => d.membros.some((x) => x.id === id && x.papel === "professor")), criadoEm: new Date().toISOString() };
    d.turmas.push(t);
    anotar(d, m, `criou a turma ${t.nome} (código ${t.codigo})`);
    return { id: t.id, codigo: t.codigo };
  });
}

/** Renomeia a turma e muda a etapa (os desafios que os alunos veem mudam junto; as respostas antigas ficam). */
export async function editarTurma(m: Membro, turmaId: unknown, nome: unknown, etapa: unknown): Promise<void> {
  soGestao(m);
  const n = nomeTurmaValido(nome);
  if (etapa !== "f1" && etapa !== "f2") throw new ErroEscola("Escolha a etapa da turma.");
  await alterar((d) => {
    const t = d.turmas.find((x) => x.id === turmaId);
    if (!t) throw new ErroEscola("Turma não encontrada.", 404);
    if (d.turmas.some((x) => x.id !== t.id && x.nome.toLowerCase() === n.toLowerCase())) throw new ErroEscola("Já existe uma turma com esse nome.");
    t.nome = n;
    t.etapa = etapa;
    anotar(d, m, `editou a turma ${n}`);
  });
}

/** Código novo: o antigo deixa de abrir a turma (os cartões impressos precisam ser refeitos). */
export async function novoCodigoTurma(m: Membro, turmaId: unknown): Promise<{ codigo: string }> {
  soGestao(m);
  return alterar((d) => {
    const t = d.turmas.find((x) => x.id === turmaId);
    if (!t) throw new ErroEscola("Turma não encontrada.", 404);
    t.codigo = codigoNovo(d);
    anotar(d, m, `trocou o código do ${t.nome} para ${t.codigo}`);
    return { codigo: t.codigo };
  });
}

export async function removerTurma(m: Membro, turmaId: unknown): Promise<void> {
  soGestao(m);
  await alterar((d) => {
    const t = d.turmas.find((x) => x.id === turmaId);
    if (!t) throw new ErroEscola("Turma não encontrada.", 404);
    const ids = new Set(d.alunos.filter((a) => a.turmaId === t.id).map((a) => a.id));
    d.turmas = d.turmas.filter((x) => x.id !== t.id);
    d.alunos = d.alunos.filter((a) => !ids.has(a.id));
    d.registros = d.registros.filter((r) => !ids.has(r.alunoId));
    d.partidas = d.partidas.filter((p) => !ids.has(p.alunoId));
    anotar(d, m, `apagou a turma ${t.nome} (${ids.size} alunos)`);
  });
}

const CORES = ["#F5821F", "#C2410C", "#15803D", "#1D4ED8", "#7C3AED", "#BE185D", "#0F766E", "#B45309"];
export const CORES_ESCOLA = CORES;

export async function editarEscola(m: Membro, dados: Record<string, unknown>): Promise<void> {
  soGestao(m);
  const nome = typeof dados.nome === "string" ? dados.nome.replace(/\s+/g, " ").trim() : "";
  const sigla = typeof dados.sigla === "string" ? dados.sigla.trim().toUpperCase() : "";
  if (nome.length < 3 || nome.length > 60) throw new ErroEscola("Nome da escola com 3 a 60 caracteres.");
  if (!/^[A-ZÀ-Ý0-9]{1,4}$/u.test(sigla)) throw new ErroEscola("Sigla com 1 a 4 letras.");
  const cor = typeof dados.cor === "string" && CORES.includes(dados.cor) ? dados.cor : null;
  await alterar((d) => {
    d.escola.nome = nome;
    d.escola.sigla = sigla;
    if (cor) d.escola.cor = cor;
    anotar(d, m, "mudou a identidade do portal");
  });
}

export async function trocarSenha(m: Membro, atual: unknown, nova: unknown): Promise<Membro> {
  if (typeof atual !== "string" || !senhaConfere(atual, m.senhaHash)) throw new ErroEscola("Senha atual não confere.");
  if (typeof nova !== "string" || nova.length < 8 || nova.length > 100) throw new ErroEscola("A senha nova precisa de 8 caracteres ou mais.");
  const senhaHash = gerarHash(nova);
  return alterar((d) => {
    const x = d.membros.find((y) => y.id === m.id);
    if (!x) throw new ErroEscola("Conta não encontrada.", 404);
    x.senhaHash = senhaHash;
    return x;
  });
}

export async function restaurarDemonstracao(m: Membro): Promise<void> {
  soGestor(m);
  await restaurar(m.nome);
}

// ---------------------------------------------------------------------------
// Hub da gestão Kambada
// ---------------------------------------------------------------------------

export type VisaoGeral = {
  turmas: number;
  alunos: number;
  professores: number;
  coordenacao: number;
  suspensos: number;
  respostas7d: number;
  ativos7d: number;
  log: Evento[];
};

export async function visaoGeral(m: Membro): Promise<VisaoGeral> {
  soGestor(m);
  const d = await lerDados();
  const semana = Date.now() - 7 * 86400000;
  const recentes = d.registros.filter((r) => Date.parse(r.em) > semana);
  return {
    turmas: d.turmas.length,
    alunos: d.alunos.length,
    professores: d.membros.filter((x) => x.papel === "professor").length,
    coordenacao: d.membros.filter((x) => x.papel === "coordenacao").length,
    suspensos: d.membros.filter((x) => x.ativo === false).length,
    respostas7d: recentes.length,
    ativos7d: new Set(recentes.map((r) => r.alunoId)).size,
    log: [...(d.log ?? [])].reverse().slice(0, 40),
  };
}

// ---------------------------------------------------------------------------
// Mapa de reforço e uso dos jogos (quem precisa de ajuda, em quê, e o que a turma joga)
// ---------------------------------------------------------------------------

export type Ponto = { disciplina: Disciplina; habilidade: string };

export type MapaAluno = {
  id: string;
  apelido: string;
  avatar: string;
  /** Só para a escola; null para a gestão Kambada. */
  nome: string | null;
  turma: string;
  turmaId: string;
  situacao: Situacao;
  reforcoEm: Ponto[];
  quaseEm: Ponto[];
  pontos: number;
  respostas: number;
  /** Última resposta (ISO) e há quantos dias foi. */
  ultima: string | null;
  diasSemJogar: number | null;
};

export type UsoJogo = {
  trilhaId: string;
  titulo: string;
  emoji: string;
  disciplina: Disciplina;
  /** Alunos que jogaram ao menos uma pergunta, de quantos podiam jogar. */
  alunos: number;
  podiam: number;
  respostas: number;
  /** % de respostas certas de primeira. */
  primeira: number;
  /** Respostas dadas no Arraial 3D (o resto veio da tela de desafio). */
  noArraial: number;
};

const DIA = 86400000;

function mapaDoAluno(m: Membro, d: Dados, a: Aluno, t: Turma, pts: Map<string, number>, agora: number): MapaAluno {
  const meus = d.registros.filter((r) => r.alunoId === a.id);
  const reforcoEm: Ponto[] = [];
  const quaseEm: Ponto[] = [];
  let jogou = false;
  for (const disc of disciplinasDaEtapa(t.etapa)) {
    for (const h of habilidades(disc, t.etapa)) {
      const c = celula(meus.filter((r) => r.disciplina === disc && r.habilidade === h));
      if (c.status !== "nada") jogou = true;
      if (c.status === "reforco") reforcoEm.push({ disciplina: disc, habilidade: h });
      if (c.status === "quase") quaseEm.push({ disciplina: disc, habilidade: h });
    }
  }
  const ultima = meus.reduce<string | null>((u, r) => (!u || r.em > u ? r.em : u), null);
  // Reforço = duas habilidades ou mais em ✗. Atenção = uma em ✗, ou três ou mais que só acerta
  // na segunda. Um ↻ aqui e ali é normal (é para isso que existe a segunda chance).
  const situacao: Situacao = !jogou ? "nada" : reforcoEm.length >= 2 ? "reforco" : reforcoEm.length === 1 || quaseEm.length >= 3 ? "atencao" : "bem";
  return {
    id: a.id,
    apelido: a.apelido,
    avatar: a.avatar,
    nome: nomeParaQuem(m, a),
    turma: t.nome,
    turmaId: t.id,
    situacao,
    reforcoEm,
    quaseEm,
    pontos: pts.get(a.id) ?? 0,
    respostas: meus.length,
    ultima,
    diasSemJogar: ultima ? Math.floor((agora - Date.parse(ultima)) / DIA) : null,
  };
}

/** Mais urgente primeiro: reforço (quem tem mais habilidades em ✗), atenção, quem não jogou, quem vai bem. */
function porUrgencia(x: MapaAluno, y: MapaAluno): number {
  const o = ORDEM_SITUACAO.indexOf(x.situacao) - ORDEM_SITUACAO.indexOf(y.situacao);
  if (o) return o;
  return y.reforcoEm.length - x.reforcoEm.length || y.quaseEm.length - x.quaseEm.length || x.apelido.localeCompare(y.apelido, "pt-BR");
}

function contar(alunos: MapaAluno[]): Record<Situacao, number> {
  const c: Record<Situacao, number> = { reforco: 0, atencao: 0, bem: 0, nada: 0 };
  for (const a of alunos) c[a.situacao] += 1;
  return c;
}

/** Quanto cada jogo foi jogado por um grupo de alunos (só os jogos que eles podem jogar). */
function usoDosJogos(d: Dados, alunos: Aluno[], turmas: Turma[]): UsoJogo[] {
  const ids = new Set(alunos.map((a) => a.id));
  const etapaDe = new Map(turmas.map((t) => [t.id, t.etapa]));
  const regs = d.registros.filter((r) => ids.has(r.alunoId));
  return TRILHAS.map((tr) => {
    const podiam = alunos.filter((a) => etapaDe.get(a.turmaId) === tr.etapa).length;
    const desta = regs.filter((r) => r.trilhaId === tr.id);
    return {
      trilhaId: tr.id,
      titulo: tr.titulo,
      emoji: tr.emoji,
      disciplina: tr.disciplina,
      alunos: new Set(desta.map((r) => r.alunoId)).size,
      podiam,
      respostas: desta.length,
      primeira: desta.length ? Math.round((desta.filter((r) => r.resultado === "primeira").length / desta.length) * 100) : 0,
      noArraial: desta.filter((r) => r.origem === "arraial").length,
    };
  })
    .filter((u) => u.podiam > 0)
    .sort((x, y) => y.alunos - x.alunos || y.respostas - x.respostas);
}

export type MapaTurma = {
  turma: { id: string; nome: string; etapa: Etapa; codigo: string };
  nomes: boolean;
  alunos: MapaAluno[];
  contagem: Record<Situacao, number>;
  jogos: UsoJogo[];
  /** Cultura do Maranhão: quem jogou, leu e assistiu. */
  cultura: UsoCultura[];
  /** Habilidades com mais alunos em ✗ (onde a turma inteira precisa de retomada). */
  pontosFracos: (Ponto & { alunos: number })[];
};

function montarMapa(m: Membro, d: Dados, t: Turma): MapaTurma {
  const pts = pontosPorAluno(d.registros);
  const agora = Date.now();
  const daTurma = d.alunos.filter((a) => a.turmaId === t.id);
  const alunos = daTurma.map((a) => mapaDoAluno(m, d, a, t, pts, agora)).sort(porUrgencia);
  const fracos = new Map<string, Ponto & { alunos: number }>();
  for (const a of alunos)
    for (const p of a.reforcoEm) {
      const k = `${p.disciplina}|${p.habilidade}`;
      fracos.set(k, { ...p, alunos: (fracos.get(k)?.alunos ?? 0) + 1 });
    }
  return {
    turma: { id: t.id, nome: t.nome, etapa: t.etapa, codigo: t.codigo },
    nomes: veNomes(m),
    alunos,
    contagem: contar(alunos),
    jogos: usoDosJogos(d, daTurma, [t]),
    cultura: usoDaCultura(d, daTurma),
    pontosFracos: [...fracos.values()].sort((x, y) => y.alunos - x.alunos).slice(0, 5),
  };
}

export async function mapaTurma(m: Membro, turmaId: string): Promise<MapaTurma> {
  exigirPermissao(m, "relatorio");
  const d = await lerDados();
  const t = d.turmas.find((x) => x.id === turmaId);
  if (!t || !podeVerTurma(m, t)) throw new ErroEscola("Turma não encontrada.", 404);
  return montarMapa(m, d, t);
}

// ---------------------------------------------------------------------------
// Cultura (jogos, HQs e animações da área do aluno)
// ---------------------------------------------------------------------------

/** O aluno terminou uma atividade de cultura (com os acertos, quando ela tem perguntas). */
export async function registrarCultura(aluno: Aluno, atividade: unknown, acertos?: unknown, total?: unknown): Promise<void> {
  const at = atividadePorId(atividade);
  if (!at) throw new ErroEscola("Atividade desconhecida.");
  const t = typeof total === "number" && Number.isInteger(total) && total > 0 && total <= 50 ? total : undefined;
  const a = t !== undefined && typeof acertos === "number" && Number.isInteger(acertos) ? Math.max(0, Math.min(t, acertos)) : undefined;
  await alterar((d) => {
    d.cultura ??= [];
    d.cultura.push({ alunoId: aluno.id, turmaId: aluno.turmaId, atividade: at.id, ...(t !== undefined && a !== undefined ? { acertos: a, total: t } : {}), em: new Date().toISOString() });
    d.cultura = d.cultura.slice(-20000);
  });
}

/** Para os cartões do aluno: quantas vezes fez cada atividade e a melhor marca. */
export async function culturaDoAluno(alunoId: string): Promise<Record<string, { vezes: number; melhor?: string }>> {
  const d = await lerDados();
  const r: Record<string, { vezes: number; melhor?: string; pct?: number }> = {};
  for (const c of d.cultura ?? []) {
    if (c.alunoId !== alunoId) continue;
    const x = (r[c.atividade] ??= { vezes: 0 });
    x.vezes += 1;
    if (c.total) {
      const pct = c.acertos! / c.total;
      if (x.pct === undefined || pct > x.pct) {
        x.pct = pct;
        x.melhor = `${c.acertos} de ${c.total}`;
      }
    }
  }
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { vezes: v.vezes, ...(v.melhor ? { melhor: v.melhor } : {}) }]));
}

export type UsoCultura = {
  id: string;
  titulo: string;
  emoji: string;
  tipo: TipoCultura;
  /** Alunos que fizeram ao menos uma vez, de quantos podiam. */
  alunos: number;
  podiam: number;
  vezes: number;
  /** % de acertos nas perguntas (null = atividade sem perguntas ou ninguém fez). */
  acertos: number | null;
};

function usoDaCultura(d: Dados, alunos: Aluno[]): UsoCultura[] {
  const ids = new Set(alunos.map((a) => a.id));
  const feitos = (d.cultura ?? []).filter((c) => ids.has(c.alunoId));
  return ATIVIDADES.map((at) => {
    const desta = feitos.filter((c) => c.atividade === at.id);
    const comNota = desta.filter((c) => c.total);
    const soma = comNota.reduce((t, c) => t + c.total!, 0);
    return {
      id: at.id,
      titulo: at.titulo,
      emoji: at.emoji,
      tipo: at.tipo,
      alunos: new Set(desta.map((c) => c.alunoId)).size,
      podiam: alunos.length,
      vezes: desta.length,
      acertos: soma ? Math.round((comNota.reduce((t, c) => t + c.acertos!, 0) / soma) * 100) : null,
    };
  });
}

export type MapaEscola = {
  nomes: boolean;
  turmas: { id: string; nome: string; etapa: Etapa; total: number; contagem: Record<Situacao, number> }[];
  contagem: Record<Situacao, number>;
  /** Todos os alunos da escola, do mais urgente ao que vai bem. */
  alunos: MapaAluno[];
  jogos: UsoJogo[];
  cultura: UsoCultura[];
};

/** Coordenação e gestão: o mapa da escola inteira. */
export async function mapaEscola(m: Membro): Promise<MapaEscola> {
  soGestao(m);
  const d = await lerDados();
  const mapas = d.turmas.map((t) => montarMapa(m, d, t));
  const alunos = mapas.flatMap((x) => x.alunos).sort(porUrgencia);
  return {
    nomes: veNomes(m),
    turmas: mapas.map((x) => ({ id: x.turma.id, nome: x.turma.nome, etapa: x.turma.etapa, total: x.alunos.length, contagem: x.contagem })),
    contagem: contar(alunos),
    alunos,
    jogos: usoDosJogos(d, d.alunos, d.turmas),
    cultura: usoDaCultura(d, d.alunos),
  };
}

export type RespostaDaFicha = {
  em: string;
  jogo: string;
  disciplina: Disciplina;
  habilidade: string;
  pergunta: string;
  resultado: Resultado;
  escolheu: string | null;
  diagnostico: string | null;
};

export type FichaAluno = {
  aluno: MapaAluno;
  turmaId: string;
  habilidades: { disciplina: Disciplina; habilidade: string; celula: Celula }[];
  jogos: { titulo: string; emoji: string; disciplina: Disciplina; respostas: number; primeira: number }[];
  respostas: RespostaDaFicha[];
};

/** Tudo de um aluno: onde está em cada habilidade, o que jogou e as últimas respostas (com o erro e o que ele revela). */
export async function fichaAluno(m: Membro, alunoId: string): Promise<FichaAluno> {
  exigirPermissao(m, "relatorio");
  const d = await lerDados();
  const a = d.alunos.find((x) => x.id === alunoId);
  const t = a && d.turmas.find((x) => x.id === a.turmaId);
  if (!a || !t || !podeVerTurma(m, t)) throw new ErroEscola("Aluno não encontrado.", 404);
  const meus = d.registros.filter((r) => r.alunoId === a.id);
  const habs = disciplinasDaEtapa(t.etapa).flatMap((disc) =>
    habilidades(disc, t.etapa).map((h) => ({ disciplina: disc, habilidade: h, celula: celula(meus.filter((r) => r.disciplina === disc && r.habilidade === h)) })),
  );
  const jogos = trilhasDaEtapa(t.etapa)
    .map((tr) => {
      const desta = meus.filter((r) => r.trilhaId === tr.id);
      return { titulo: tr.titulo, emoji: tr.emoji, disciplina: tr.disciplina, respostas: desta.length, primeira: desta.filter((r) => r.resultado === "primeira").length };
    })
    .sort((x, y) => y.respostas - x.respostas);
  const respostas = [...meus]
    .sort((x, y) => y.em.localeCompare(x.em))
    .slice(0, 25)
    .map((r) => {
      const q = questaoPorId(r.questaoId);
      return {
        em: r.em,
        jogo: q?.trilha.titulo ?? r.trilhaId,
        disciplina: r.disciplina,
        habilidade: r.habilidade,
        pergunta: q?.questao.enunciado ?? "",
        resultado: r.resultado,
        escolheu: r.errou !== null && q ? q.questao.opcoes[r.errou] : null,
        diagnostico: r.errou !== null && q ? (q.questao.diagnostico?.[r.errou] ?? null) : null,
      };
    });
  return { aluno: mapaDoAluno(m, d, a, t, pontosPorAluno(d.registros), Date.now()), turmaId: t.id, habilidades: habs, jogos, respostas };
}
