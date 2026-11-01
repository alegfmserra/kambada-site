/**
 * Tipos do portal da escola (sem nada de servidor: o navegador pode importar).
 */

export type Papel = "aluno" | "professor" | "coordenacao" | "gestor";
export const NOME_PAPEL: Record<Papel, string> = { aluno: "Aluno", professor: "Professor", coordenacao: "Coordenação", gestor: "Gestão Kambada" };

/**
 * O que o gestor liga e desliga em cada professor (coordenação e gestão podem tudo).
 * Professor sem lista guardada = tudo ligado.
 */
export type Permissao = "relatorio" | "cadastrar-alunos" | "cartoes" | "remover-alunos";
export const PERMISSOES: { id: Permissao; rotulo: string; explica: string }[] = [
  { id: "relatorio", rotulo: "Ver relatório", explica: "relatório por habilidade e erros mais comuns das turmas dele" },
  { id: "cadastrar-alunos", rotulo: "Cadastrar alunos", explica: "criar apelidos novos nas turmas dele" },
  { id: "cartoes", rotulo: "Cartões e figuras", explica: "imprimir cartões e trocar a senha de figuras" },
  { id: "remover-alunos", rotulo: "Remover alunos", explica: "tirar aluno da turma (as respostas dele saem junto)" },
];
export const TODAS_PERMISSOES: Permissao[] = PERMISSOES.map((p) => p.id);

/** f1 = Infantil e Fundamental I · f2 = Fundamental II e Médio. */
export type Etapa = "f1" | "f2";
export const NOME_ETAPA: Record<Etapa, string> = {
  f1: "Infantil e Fundamental I",
  f2: "Fundamental II e Médio",
};

export type Disciplina = "Matemática" | "Português" | "Inglês";
export const DISCIPLINAS: Disciplina[] = ["Matemática", "Português", "Inglês"];

/** primeira = ✓ acertou de primeira · segunda = ↻ na segunda tentativa · reforco = ✗ precisa de reforço. */
export type Resultado = "primeira" | "segunda" | "reforco";
export const PONTOS: Record<Resultado, number> = { primeira: 100, segunda: 50, reforco: 0 };
export const SIMBOLO: Record<Resultado, string> = { primeira: "✓", segunda: "↻", reforco: "✗" };

/**
 * Senha de figuras do aluno: 3 figuras, em ordem, de um conjunto de 9.
 * Criança pequena não digita senha; o professor imprime o cartão.
 */
export const FIGURAS = ["🦀", "🐂", "🥁", "🌞", "🐟", "🌺", "⭐", "🪁", "🌴"] as const;
export const NOME_FIGURA = ["caranguejo", "boi", "tambor", "sol", "peixe", "flor", "estrela", "pipa", "palmeira"];
export const AVATARES = ["🦀", "🐂", "🦜", "🐢", "🐟", "🦋", "🐸", "🐝", "🦉", "🐊", "🐬", "🦩"];

export type EscolaPublica = {
  nome: string;
  sigla: string;
  cor: string;
  cidade: string;
  temporada: { emoji: string; titulo: string; texto: string };
};

export type AlunoPublico = { id: string; apelido: string; avatar: string };

/**
 * Situação do aluno no mapa de reforço (olha as últimas respostas de cada habilidade):
 * reforco = duas habilidades ou mais em ✗ · atencao = uma habilidade em ✗, ou três ou mais que só
 * acerta na segunda · bem = o resto de quem jogou · nada = ainda não jogou.
 * (✗ = errou as duas tentativas na maior parte das últimas respostas daquela habilidade.)
 */
export type Situacao = "reforco" | "atencao" | "bem" | "nada";
export const SITUACAO: Record<Situacao, { rotulo: string; cor: string; simbolo: string }> = {
  reforco: { rotulo: "Precisa de reforço", cor: "#D4432B", simbolo: "✗" },
  atencao: { rotulo: "Atenção", cor: "#E0AF14", simbolo: "↻" },
  bem: { rotulo: "Indo bem", cor: "#3B8D5D", simbolo: "✓" },
  nada: { rotulo: "Ainda não jogou", cor: "#9A9A9A", simbolo: "·" },
};
export const ORDEM_SITUACAO: Situacao[] = ["reforco", "atencao", "nada", "bem"];

/** Uma pergunta como vai ao navegador: sem a resposta certa. */
export type QuestaoPublica = {
  cena: string;
  enunciado: string;
  opcoes: string[];
  disciplina: Disciplina;
  habilidade: string;
};

export type TrilhaPublica = {
  id: string;
  titulo: string;
  emoji: string;
  disciplina: Disciplina;
  etapa: Etapa;
  resumo: string;
  total: number;
};
