/** Tipos compartilhados entre servidor e navegador (sem código de servidor). */

export type JogoId = "quiz" | "memoria";

/** Teto de pontos por partida (no nível difícil, com multiplicador). */
export const JOGOS: Record<JogoId, { nome: string; maximo: number }> = {
  quiz: { nome: "Éguas! Quem é quem?", maximo: 3000 },
  memoria: { nome: "Memória das estampas", maximo: 2000 },
};

// --- Níveis de dificuldade -------------------------------------------------

export type Nivel = "facil" | "medio" | "dificil";

export const NIVEIS: { id: Nivel; rotulo: string; descricao: string }[] = [
  { id: "facil", rotulo: "Fácil", descricao: "Para começar com calma." },
  { id: "medio", rotulo: "Médio", descricao: "Mais rápido, mais pontos." },
  { id: "dificil", rotulo: "Difícil", descricao: "Só pra quem é maranhense que só." },
];

export function nivelValido(v: unknown): Nivel {
  return v === "facil" || v === "dificil" ? v : "medio";
}

/** Quiz: tempo de bônus, multiplicador de pontos e desconto por erro. */
export const QUIZ_NIVEL: Record<Nivel, { tempoBonusS: number; multiplicador: number; penalidadeErro: number }> = {
  facil: { tempoBonusS: 20, multiplicador: 1, penalidadeErro: 0 },
  medio: { tempoBonusS: 15, multiplicador: 1.5, penalidadeErro: 0 },
  dificil: { tempoBonusS: 10, multiplicador: 2, penalidadeErro: 25 },
};

/** Memória: pares na mesa, multiplicador e se as cartas se embaralham depois de erros seguidos. */
export const MEMORIA_NIVEL: Record<Nivel, { pares: number; multiplicador: number; embaralhaApos: number | null }> = {
  facil: { pares: 6, multiplicador: 1, embaralhaApos: null },
  medio: { pares: 8, multiplicador: 1.5, embaralhaApos: null },
  dificil: { pares: 12, multiplicador: 2, embaralhaApos: 3 },
};

// --- Avatares e placar ----------------------------------------------------

export type AvatarId = "kambadinha" | "boi" | "tambor" | "guara" | "estrela" | "serpente";

export const AVATARES: { id: AvatarId; rotulo: string; glifo: string }[] = [
  { id: "kambadinha", rotulo: "Kambadinha", glifo: "🦀" },
  { id: "boi", rotulo: "Boi", glifo: "🐂" },
  { id: "tambor", rotulo: "Tambor", glifo: "🥁" },
  { id: "guara", rotulo: "Guará", glifo: "🦩" },
  { id: "estrela", rotulo: "Estrela", glifo: "⭐" },
  { id: "serpente", rotulo: "Serpente", glifo: "🐍" },
];

export function glifoDoAvatar(id: string): string {
  return AVATARES.find((a) => a.id === id)?.glifo ?? "🦀";
}

export type LinhaPlacar = {
  posicao: number;
  apelido: string;
  avatar: AvatarId;
  pontos: number;
  /** Quanto cada jogo rendeu (só no placar geral). */
  porJogo?: Partial<Record<JogoId, number>>;
};

export type PeriodoPlacar = "semana" | "mes" | "total";

/** Prêmio semanal: 1º lugar 10%, 2º e 3º lugares 5%. */
export const PREMIOS_SEMANAIS = [10, 5, 5] as const;

/** Mínimo de pontos na semana para o prêmio valer (evita cupom por uma partida qualquer). */
export const PONTOS_MINIMOS_PREMIO = 300;

export const REGRAS_PREMIO = {
  validadeCupomDias: 30,
  prazoParaResgatarDias: 14,
};

// --- Quiz ---------------------------------------------------------------

export const QUIZ_PERGUNTAS_POR_PARTIDA = 10;

export type PerguntaPublica = {
  indice: number; // 0 a 9
  total: number;
  enunciado: string;
  opcoes: string[];
};

export type RespostaQuiz = {
  certa: boolean;
  correta: number; // índice da opção certa, nas opções mostradas
  pontosDaPergunta: number;
  pontos: number; // acumulado
  explicacao: string;
  proxima?: PerguntaPublica;
  estado?: string;
  /** Quando acaba: prova assinada para enviar ao placar. */
  prova?: string;
  acertos?: number;
};
