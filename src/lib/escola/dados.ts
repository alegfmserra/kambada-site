import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import type { Disciplina, EscolaPublica, Etapa, Permissao, Resultado } from "./tipos";
import { historicoDemo, redacoesDemo } from "./redacoesDemo";
import { comContasDeTeste, culturaDemo, gestorDemo, sementeDemo } from "./semente";

/**
 * Armazém do portal da escola (somente servidor).
 *
 * Protótipo: um arquivo JSON na pasta persistente (a mesma das contas do
 * Play), SEPARADO de tudo do Play oficial — `escola-modelo.json`. Nada aqui
 * lê ou grava contas, ranking ou perfis do Play.
 *
 * Quando uma escola de verdade assinar, isto migra para o banco (Supabase,
 * decisão de 19/10/2026) sem mudar as telas: as telas só falam com
 * `servico.ts`.
 */

export type Membro = {
  id: string;
  /** gestor = a Kambada, acima da escola (hub de gestão). */
  papel: "professor" | "coordenacao" | "gestor";
  nome: string;
  usuario: string;
  senhaHash: string;
  disciplinas: Disciplina[];
  /** Só professor. Ausente = todas ligadas. */
  permissoes?: Permissao[];
  /** false = acesso suspenso (não entra e a sessão aberta cai). Ausente = ativo. */
  ativo?: boolean;
  /** Acesso temporário (ISO): depois desta hora não entra e a sessão aberta cai. Ausente = sem prazo. */
  expiraEm?: string;
  /** Só em memória (nunca gravado): a coordenação vendo o portal como professor. */
  visaoDaCoordenacao?: true;
  criadoEm: string;
};

/** Registro de atividades da gestão (quem fez o quê), mostrado no hub. */
export type Evento = { em: string; quem: string; texto: string };

export type Turma = {
  id: string;
  nome: string;
  etapa: Etapa;
  /** Código que o aluno digita para entrar (4 algarismos, único na escola). */
  codigo: string;
  professorIds: string[];
  criadoEm: string;
};

export type Aluno = {
  id: string;
  turmaId: string;
  apelido: string;
  /**
   * Nome de verdade, opcional: SÓ a escola vê (coordenação e professores da
   * turma). Nunca vai ao ranking, às telas do aluno, aos cartões nem à
   * gestão Kambada. É o que liga o apelido à criança para o reforço.
   */
  nome?: string;
  avatar: string;
  /**
   * Senha de figuras (índices de FIGURAS). Guardada como está, de propósito:
   * é um código de sala, como o crachá, e o professor precisa reimprimir o
   * cartão. A proteção vem do código da turma + limite de erros por aluno.
   */
  figuras: number[];
  /** Só a conta de teste "aluno": entra também por usuário e senha (tela da equipe). */
  usuario?: string;
  senhaHash?: string;
  /** Acesso temporário (ISO): depois desta hora não entra e a sessão aberta cai. Ausente = sem prazo. */
  expiraEm?: string;
  /** Aluno de demonstração da coordenação (visão "aluno"): id do membro dono. */
  visitaDe?: string;
  criadoEm: string;
};

export type Registro = {
  alunoId: string;
  turmaId: string;
  trilhaId: string;
  questaoId: string;
  disciplina: Disciplina;
  habilidade: string;
  resultado: Resultado;
  /** Opção (índice original) escolhida no primeiro erro; null se acertou de primeira. */
  errou: number | null;
  pontos: number;
  em: string;
  /** "arraial" = respondida conversando com o povo da praça 3D (sem o campo: tela de desafio). */
  origem?: "arraial";
};

export type Partida = {
  id: string;
  alunoId: string;
  trilhaId: string;
  /** Ordem das questões nesta partida. */
  questoes: string[];
  /** Ordem embaralhada das opções de cada questão (índices originais). */
  ordens: number[][];
  atual: number;
  tentativa: 1 | 2;
  /** Opção (índice original) do primeiro erro da questão atual. */
  primeiroErro: number | null;
  pontos: number;
  inicio: string;
  fim?: string;
};

/** Atividade cultural feita pelo aluno (jogo, HQ, animação; ver lib/escola/cultura.ts). */
export type FeitoCultural = {
  alunoId: string;
  turmaId: string;
  atividade: string;
  /** Acertos nas perguntas da atividade (ausente = só leu/assistiu). */
  acertos?: number;
  total?: number;
  em: string;
};

/** Redação do concurso da temporada (ver lib/escola/concurso.ts). Uma por aluno e concurso. */
export type Redacao = {
  id: string;
  concursoId: string;
  alunoId: string;
  turmaId: string;
  texto: string;
  atualizadaEm: string;
  /** Enviada ao professor: o aluno não edita mais. */
  enviadaEm?: string;
  avaliacao?: { notas: Record<string, number>; comentario: string; por: string; em: string };
  /** Escolhida pelo professor entre as melhores da turma. */
  finalista?: boolean;
  /** Escolhida pela coordenação para representar a escola na etapa da rede. */
  representante?: boolean;
  /** Etapa da rede (gestão Kambada): 1º, 2º ou 3º lugar. */
  colocacao?: 1 | 2 | 3;
  /** Redação mandada em arquivo (PDF ou foto da escrita à mão). Ver lib/escola/arquivos.ts. */
  anexo?: ArquivoGuardado;
  /** Correção que o professor anexou (PDF ou foto da redação marcada). */
  correcao?: ArquivoGuardado & { por: string };
};

export type ArquivoGuardado = { id: string; nome: string; tipo: "application/pdf" | "image/jpeg" | "image/png"; tamanho: number; em: string };

export type Dados = {
  versao: 1;
  demo: boolean;
  escola: EscolaPublica;
  membros: Membro[];
  turmas: Turma[];
  alunos: Aluno[];
  registros: Registro[];
  partidas: Partida[];
  log?: Evento[];
  cultura?: FeitoCultural[];
  redacoes?: Redacao[];
  /** Temporadas ligadas/desligadas para a escola (sem registro = liberada). */
  liberacoes?: Record<string, boolean>;
  criadoEm: string;
};

export function arquivoEscola(): string {
  return process.env.ESCOLA_ARQUIVO ?? join(dirname(arquivoTokens()), "escola-modelo.json");
}

/**
 * Cópia em memória + fila de gravação no `globalThis`, e a memória só vale
 * enquanto o arquivo não mudar (data de modificação). O Next pode rodar
 * páginas e rotas de API em pacotes ou processos diferentes: sem essa
 * conferência, a página mostrava dados velhos (o aluno respondia e os pontos
 * não apareciam). Duas gravações ao mesmo tempo em processos diferentes ainda
 * podem se atropelar — aceitável no protótipo; o banco resolve.
 */
type Estado = { fila: Promise<unknown>; memoria: Dados | null; arquivo: string; mtime: number };
const G = globalThis as typeof globalThis & { __kambadaEscola?: Estado };
const estado: Estado = (G.__kambadaEscola ??= { fila: Promise.resolve(), memoria: null, arquivo: "", mtime: 0 });

function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const proximo = estado.fila.then(trabalho, trabalho);
  estado.fila = proximo.catch(() => undefined);
  return proximo;
}

async function mtimeDoArquivo(): Promise<number> {
  try {
    return (await stat(arquivoEscola())).mtimeMs;
  } catch {
    return 0;
  }
}

async function gravarNoDisco(d: Dados): Promise<void> {
  const destino = arquivoEscola();
  try {
    await mkdir(dirname(destino), { recursive: true });
    const tmp = `${destino}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(d), "utf8");
    await rename(tmp, destino);
    estado.mtime = await mtimeDoArquivo();
  } catch (erro) {
    // Protótipo: sem disco, segue em memória (some num reinício) e avisa no log.
    console.error(`[escola] não consegui gravar em ${destino}: ${String(erro)}`);
  }
}

/** Memória atualizada: relê o arquivo se ele mudou (ou se é outro arquivo); se não existe, nasce a demonstração. */
async function atual(): Promise<Dados> {
  const arquivo = arquivoEscola();
  const mtime = await mtimeDoArquivo();
  if (estado.memoria && estado.arquivo === arquivo && mtime === estado.mtime) return estado.memoria;
  estado.arquivo = arquivo;
  try {
    const d = JSON.parse(await readFile(arquivo, "utf8")) as Dados;
    if (d && d.versao === 1 && Array.isArray(d.alunos)) {
      // Arquivo de antes do hub (01/11/2026): ganha o acesso da gestão Kambada.
      if (!d.membros.some((m) => m.papel === "gestor")) d.membros.unshift(gestorDemo(new Date().toISOString()));
      // Demonstração de antes do mapa de reforço: os alunos fictícios ganham o nome fictício.
      if (d.demo && d.alunos.some((a) => a.nome === undefined)) {
        const nomes = new Map(sementeDemo().alunos.map((a) => [a.id, a.nome]));
        for (const a of d.alunos) a.nome ??= nomes.get(a.id);
      }
      if (d.demo) comContasDeTeste(d);
      // Demonstração de antes da área de cultura (02/11/2026): ganha o histórico fictício de cultura.
      if (d.demo && !d.cultura) d.cultura = culturaDemo(d.alunos);
      // Demonstração de antes do concurso de redação (05/11/2026): ganha as redações fictícias.
      if (d.demo && !d.redacoes) d.redacoes = redacoesDemo(d.alunos);
      // Demonstração de antes da folha de redação (06/11/2026): ganha as notas de São João e Consciência
      // Negra (evolução no ano) e perde os rascunhos digitados (o aluno não escreve mais na plataforma).
      if (d.demo && d.redacoes && !d.redacoes.some((r) => r.concursoId === "saojoao-2026")) {
        d.redacoes = [...historicoDemo(d.alunos), ...d.redacoes.filter((r) => r.enviadaEm)];
      }
      estado.memoria = d;
      estado.mtime = mtime;
      return d;
    }
  } catch {
    // primeira vez: nasce com a demonstração
  }
  estado.memoria = sementeDemo();
  await gravarNoDisco(estado.memoria);
  return estado.memoria;
}

/** Leitura (a cópia em memória, conferida contra o arquivo). */
export function lerDados(): Promise<Dados> {
  return naFila(atual);
}

/** Alteração em fila: um gravador por vez. `trabalho` muda `d` e devolve o resultado. */
export function alterar<T>(trabalho: (d: Dados) => T): Promise<T> {
  return naFila(async () => {
    const d = await atual();
    const r = trabalho(d);
    // Partidas terminadas há mais de 1 dia e as muito antigas saem do arquivo.
    const limite = Date.now() - 24 * 3600 * 1000;
    d.partidas = d.partidas.filter((p) => !p.fim || Date.parse(p.fim) > limite).slice(-500);
    await gravarNoDisco(d);
    return r;
  });
}

/** Volta tudo à demonstração (botão do hub). O acesso da gestão Kambada fica como está (senha trocada não volta). */
export function restaurar(quem?: string): Promise<void> {
  return naFila(async () => {
    const gestores = (await atual()).membros.filter((m) => m.papel === "gestor");
    const nova = sementeDemo();
    if (gestores.length) nova.membros = [...gestores, ...nova.membros.filter((m) => m.papel !== "gestor")];
    if (quem) nova.log = [{ em: new Date().toISOString(), quem, texto: "restaurou a demonstração" }];
    estado.memoria = nova;
    estado.arquivo = arquivoEscola();
    await gravarNoDisco(estado.memoria);
  });
}

/** Só para os testes. */
export function _zerarMemoria(): void {
  estado.memoria = null;
}
