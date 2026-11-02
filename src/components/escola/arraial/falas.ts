import { extras, npcs, type Falante } from "@/content/play/arraial";

/**
 * Arraial da escola: a mesma praça 3D do Kambada Play, mas quem tem o "!"
 * em cima pergunta o conteúdo da turma (as questões da trilha, com dica e
 * segunda chance). As falas aqui só abrem a conversa; a pergunta vem do
 * servidor. O Play público não usa este arquivo.
 */

/** Quem pergunta, na ordem do percurso da praça (é a ordem das fitinhas ao retomar). */
export const ORDEM = ["fogueira", "barraca", "brincante", "boi", "noivos"] as const;

const ABERTURA: Record<string, string[]> = {
  fogueira: [
    "Chega perto, mas respeita o fogo! Eu sou o Seu Chico da Fogueira.",
    "No arraial da escola, quem quer fitinha mostra o que aprendeu na sala. Vamos ver!",
  ],
  barraca: [
    "Ei! Aqui na barraca da Kambada a gente vende matraca pintada à mão.",
    "E barraqueiro bom faz conta e lê direitinho. Me ajuda nessa?",
  ],
  brincante: [
    "Tu ouviu o estalo da matraca? Eu brinco boi desde os oito anos!",
    "No boi, quem erra o ritmo tenta de novo. Aqui também: errou, ganha dica e mais uma chance.",
  ],
  boi: [
    "Muuu! Eu sou o Boi Estrela, o mais bonito do arraial.",
    "Eu renasço todo ano... e tu cresce a cada pergunta! Bora?",
  ],
  noivos: [
    "Bem-vindo ao nosso casamento! Zé e Francisca casando no arraial da escola.",
    "Antes da quadrilha começar, responde essa pra gente!",
  ],
};

const DICA_EXTRAS = "Quem dá fitinha é o povo com o ❗ em cima: Seu Chico, a barraca da Kambada, Dona Ritinha, o Boi Estrela e os noivos.";

export type Pessoa = Falante & { pergunta: boolean };

/** Todo mundo da praça: os cinco que perguntam e os três do auto do boi (só conversam). */
export const PESSOAS: Pessoa[] = [
  ...npcs.map((n) => ({ id: n.id, nome: n.nome, cor: n.cor, falas: ABERTURA[n.id] ?? n.falas.slice(0, 2), pergunta: true })),
  ...extras.map((n) => ({ ...n, falas: [n.falas[0], DICA_EXTRAS], pergunta: false })),
];

export const pessoa = (id: string | null) => PESSOAS.find((p) => p.id === id) ?? null;

export const JA_DEU_FITINHA = "Já te dei a minha fitinha! Procura quem ainda tem o ❗ em cima.";
export const FITINHA = "Muito bem! Toma a tua fitinha.";

/**
 * Quantas fitinhas valem `respondidas` perguntas de `total`: a trilha é
 * repartida entre os cinco (10 perguntas = 2 por pessoa; 8 = 2, 1, 2, 1, 2).
 */
export function fitinhasPor(respondidas: number, total: number): number {
  if (respondidas >= total) return ORDEM.length;
  let n = 0;
  for (let k = 1; k <= ORDEM.length; k++) if (Math.round((total * k) / ORDEM.length) <= respondidas) n = k;
  return n;
}
