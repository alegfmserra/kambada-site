/**
 * Textos do minigame de pescaria (PRD v2, Fase 4). Fica separado de
 * `content/arraial.ts`, que é o contrato intocável do diálogo e do quiz.
 */
export const textosPescaria = {
  botaoBrincar: "Brincar de pescaria",
  titulo: "Pescaria do arraial",
  instrucaoDesktop: "Segure espaço e solte quando o peixe cruzar a marca dourada pra fisgar.",
  instrucaoTouch: "Segure o anzol e solte quando o peixe cruzar a marca dourada pra fisgar.",
  botaoAnzol: "Segurar o anzol",
  tentativas: (restantes: number) =>
    `${restantes} ${restantes === 1 ? "tentativa restante" : "tentativas restantes"}`,
  peixeNumero: (numero: number) => `Peixe número ${numero}`,
  erro: "Essa fugiu! Tenta de novo.",
  vitoriaTitulo: "Fisgou!",
  vitoriaTexto: "Você fisgou o peixe e ganhou o selo de Pescador do Arraial.",
  esgotadoTitulo: "Acabaram as tentativas",
  esgotadoTexto: "As três tentativas de hoje já foram. Volta outra hora pra tentar de novo!",
  botaoContinuar: "Continuar na festa",
  botaoSair: "Sair da pescaria",
  seloNome: "Pescador do Arraial",
};
