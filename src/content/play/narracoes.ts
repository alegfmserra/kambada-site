/**
 * Narrações do Kambada Play (17/11/2026): a estrutura está pronta, os áudios ainda não.
 *
 * Para os pequenos que ainda não leem, cada instrução pode ganhar um botão "Ouvir"
 * (componente `BotaoOuvir`). O botão SÓ aparece quando o id estiver nesta lista;
 * hoje ela está vazia, então nenhum botão aparece.
 *
 * Como ligar uma narração (sem mexer em mais nada):
 *   1. grave o áudio (voz de gente: a do Kambadinha é a do Alexandre; nada de
 *      voz sintética) e salve em public/kambadaplay/audio/<arquivo>.mp3;
 *   2. acrescente aqui a linha `"<id>": "<arquivo>.mp3"`.
 *
 * Ids que as telas já pedem (pontos onde o botão aparece quando houver áudio):
 *   quiz-como-jogar         tela inicial do quiz
 *   memoria-como-jogar      tela inicial da memória
 *   quebra-como-jogar       tela inicial do quebra-cabeça
 *   memoria-ficha-<id>      ficha de cada arte da memória (ids em CARTAS, Memoria.tsx),
 *                           ex.: memoria-ficha-coreira
 */
export const NARRACOES: Record<string, string> = {};

const PASTA = "/kambadaplay/audio";

/** Endereço do áudio de um id, ou null se ainda não foi gravado. */
export function narracaoDe(id: string): string | null {
  const arquivo = NARRACOES[id];
  return arquivo ? `${PASTA}/${arquivo}` : null;
}
