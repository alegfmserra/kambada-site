/**
 * Peso e medidas da EMBALAGEM DE ENVIO de cada tipo de peça.
 *
 * Fonte: "Fichas Individualizadas de Cadastro de Produtos — Mercado Livre",
 * coleta do Will em 18/08/2026 (comercial/Fichas_Individualizadas_...docx).
 * São as medidas da peça JÁ EMBALADA, que é o que a transportadora cobra.
 *
 * Por que isto mora no código e não no Bling: em 08/10/2026 o Bling estava com
 * peso e dimensões ZERADOS em todos os produtos conferidos. Quando o cadastro
 * do Bling for preenchido, esta tabela pode passar a ser só o plano B.
 *
 * Produto sem embalagem conhecida devolve `null` — e então NÃO entra no
 * carrinho: a página oferece o WhatsApp. Cotar frete com medida inventada
 * cobraria errado do cliente ou de nós, e nenhum dos dois é aceitável.
 */

import type { Opcao, Produto } from "../catalogo";

export type Embalagem = {
  /** Comprimento, largura e altura em centímetros (inteiros, como a API pede). */
  comprimento: number;
  largura: number;
  altura: number;
  /** Peso com embalagem, em quilos. */
  peso: number;
  /** De onde veio o número — vai para o relatório, não para o cliente. */
  origem: string;
};

/**
 * A API do Melhor Envio só aceita medida inteira. Onde a ficha traz meio
 * centímetro (18,5 cm; 4,5 cm), arredondei PARA CIMA: errar para mais
 * encarece a cotação em centavos, errar para menos faz o pacote ser
 * remedido no centro de distribuição e a diferença ser cobrada depois.
 *
 * Envelopes não têm altura na ficha. 2 cm é o mínimo que os Correios aceitam,
 * e é fiel ao que um envelope com ecobag ou pareô dobrado ocupa.
 */
const ALTURA_ENVELOPE = 2;

const E = {
  camiseta: { comprimento: 20, largura: 20, altura: 5, peso: 0.245, origem: "ficha 3 · Camiseta" },
  bone: { comprimento: 28, largura: 21, altura: 8, peso: 0.2, origem: "ficha 1 · Boné" },
  bermuda: { comprimento: 20, largura: 20, altura: 3, peso: 0.28, origem: "ficha 2 · Bermuda" },
  ecobagGrande: { comprimento: 23, largura: 16, altura: ALTURA_ENVELOPE, peso: 0.08, origem: "ficha 22 · Ecobag Grande" },
  ecobagPequena: { comprimento: 22, largura: 16, altura: ALTURA_ENVELOPE, peso: 0.048, origem: "ficha 23 · Ecobag Pequena" },
  necessaire: { comprimento: 23, largura: 16, altura: ALTURA_ENVELOPE, peso: 0.03, origem: "ficha 24 · Necessaire" },
  pareo: { comprimento: 34, largura: 24, altura: ALTURA_ENVELOPE, peso: 0.165, origem: "ficha 25 · Pareôs" },
  matracaGrandeComSuporte: { comprimento: 35, largura: 14, altura: 5, peso: 0.89, origem: "fichas 6–8 · Matraca Grande c/ Suporte" },
  matracaPlay: { comprimento: 37, largura: 19, altura: 5, peso: 0.91, origem: "fichas 4–5 · Matraca Kambada Play" },
  matracaGrandeSemSuporte: { comprimento: 21, largura: 20, altura: 5, peso: 0.445, origem: "ficha 9 · Matraca Grande s/ Suporte" },
  matracaPequenaComSuporte: { comprimento: 20, largura: 20, altura: 5, peso: 0.46, origem: "ficha 10 · Matraca Pequena c/ Suporte" },
  matracaPequenaSemSuporte: { comprimento: 20, largura: 20, altura: 5, peso: 0.28, origem: "ficha 11 · Matraca Pequena s/ Suporte" },
  placaRedonda: { comprimento: 20, largura: 20, altura: 5, peso: 0.265, origem: "ficha 12 · Placa redonda" },
  placaRetangular: { comprimento: 35, largura: 19, altura: 5, peso: 0.515, origem: "ficha 13 · Placa retangular" },
  portaChave: { comprimento: 20, largura: 20, altura: 5, peso: 0.25, origem: "ficha 14 · Porta-chaves" },
  chaveiro: { comprimento: 17, largura: 15, altura: ALTURA_ENVELOPE, peso: 0.02, origem: "ficha 15 · Chaveiro" },
  bloquinho: { comprimento: 17, largura: 15, altura: ALTURA_ENVELOPE, peso: 0.058, origem: "ficha 16 · Bloquinho" },
  kitAnotacao: { comprimento: 34, largura: 24, altura: 3, peso: 0.3, origem: "ficha 18 · Kit de Anotação (peso com embalagem estimado: produto 285 g + envelope)" },
  lapis: { comprimento: 26, largura: 13, altura: ALTURA_ENVELOPE, peso: 0.015, origem: "ficha 19 · Lápis" },
  caneta: { comprimento: 17, largura: 15, altura: ALTURA_ENVELOPE, peso: 0.01, origem: "ficha 20 · Caneta" },
} satisfies Record<string, Embalagem>;

function sem(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * A embalagem de uma opção comprável, ou `null` se não for conhecida.
 *
 * A regra lê a categoria e o nome — e, nas ecobags, o rótulo da opção, porque
 * ali o tamanho é variação ("Grande", "Pequena") e não produto separado.
 */
export function embalagemDe(produto: Produto, opcao?: Opcao): Embalagem | null {
  const nome = sem(produto.nome);
  const rotulo = sem(opcao?.rotulo ?? "");

  switch (produto.categoria) {
    case "camisas":
      return E.camiseta;
    case "bones":
      return E.bone;
    case "necessaires":
      return E.necessaire;
    case "pareos":
      return E.pareo;
    case "ecobags": {
      if (/grande/.test(rotulo) || /grande/.test(nome)) return E.ecobagGrande;
      if (/pequena|mini/.test(rotulo) || /pequena|mini/.test(nome)) return E.ecobagPequena;
      // Sem rótulo de tamanho, o preço denuncia: a grande é a de R$ 55.
      const preco = opcao?.preco ?? produto.preco;
      return preco >= 55 ? E.ecobagGrande : E.ecobagPequena;
    }
    case "matracas": {
      if (/play/.test(nome)) return E.matracaPlay;
      const grande = /grande/.test(nome);
      const pequena = /pequena|mini/.test(nome);
      const semSuporte = /sem suporte/.test(nome);
      const comSuporte = /com suporte|c\/ suporte/.test(nome);
      if (grande && semSuporte) return E.matracaGrandeSemSuporte;
      if (grande && comSuporte) return E.matracaGrandeComSuporte;
      if (pequena && semSuporte) return E.matracaPequenaSemSuporte;
      if (pequena && comSuporte) return E.matracaPequenaComSuporte;
      return null;
    }
    case "brindes":
      if (/chaveiro/.test(nome)) return E.chaveiro;
      if (/porta.?chave/.test(nome)) return E.portaChave;
      return null;
    case "decoracao":
      if (/placa.*redonda/.test(nome)) return E.placaRedonda;
      if (/placa.*ret/.test(nome)) return E.placaRetangular;
      // Mandala: a ficha diz "não temos caixa nesse tamanho". Placa Grande:
      // sem ficha. Ambas ficam no WhatsApp até ter medida real.
      return null;
    case "papelaria":
      if (/kit ecologico|kit de anotacao/.test(nome)) return E.kitAnotacao;
      if (/lapis/.test(nome)) return E.lapis;
      if (/caneta/.test(nome)) return E.caneta;
      if (/bloco|bloquinho/.test(nome)) return E.bloquinho;
      // Livros, joguinhos e Kambada Goods: sem ficha de embalagem.
      return null;
    default:
      return null;
  }
}

/** A peça pode ser comprada pelo site? Precisa de ID no ERP e de embalagem. */
export function compravelOnline(produto: Produto): boolean {
  return Boolean(
    produto.idBling &&
      produto.opcoes?.length &&
      produto.opcoes.some((o) => embalagemDe(produto, o) !== null),
  );
}
