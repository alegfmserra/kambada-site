/** Tipos compartilhados entre servidor e navegador (sem código de servidor). */

export type JogoId = "quiz" | "memoria";

export const JOGOS: Record<JogoId, { nome: string; maximo: number }> = {
  quiz: { nome: "Éguas! Quem é quem?", maximo: 1500 },
  memoria: { nome: "Memória das estampas", maximo: 1000 },
};

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
export const QUIZ_TEMPO_BONUS_S = 15;

export type PerguntaPublica = {
  indice: number; // 0 a 9
  total: number;
  enunciado: string;
  opcoes: string[];
};

export type EstadoQuiz = { estado: string }; // token assinado, opaco para o navegador

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
