import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CATEGORIAS } from "../catalogo";
import { Limitador, dormir } from "./limitador";
import {
  categoriaPeloNome,
  ehFilhoDeVariacao,
  nomesDeProdutosPai,
  paiDoProduto,
  paraSlug,
  rotuloDaVariacao,
} from "./produtos";
import type { ProdutoBling } from "./tipos";
import { urlDeAutorizacao } from "./tokens";

describe("urlDeAutorizacao", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.BLING_CLIENT_ID = "id-de-teste";
    process.env.BLING_CLIENT_SECRET = "segredo-de-teste";
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("aponta para o endpoint de autorização do Bling", () => {
    const url = urlDeAutorizacao("abc123");
    // Atenção: é www.bling.com.br, NÃO api.bling.com.br. Trocar isso
    // silenciosamente quebra a autorização inteira.
    expect(url.startsWith("https://www.bling.com.br/Api/v3/oauth/authorize?")).toBe(
      true,
    );
  });

  it("leva client_id, state e response_type=code", () => {
    const url = new URL(urlDeAutorizacao("abc123"));
    expect(url.searchParams.get("client_id")).toBe("id-de-teste");
    expect(url.searchParams.get("state")).toBe("abc123");
    expect(url.searchParams.get("response_type")).toBe("code");
  });

  it("NUNCA leva o client_secret na URL", () => {
    // A URL de autorização vai para a barra de endereços, para o histórico e
    // para os logs do Bling. O segredo não pode passar por aí.
    const url = urlDeAutorizacao("abc123");
    expect(url).not.toContain("segredo-de-teste");
    expect(url.toLowerCase()).not.toContain("client_secret");
  });

  it("falha claramente quando as credenciais não estão configuradas", () => {
    delete process.env.BLING_CLIENT_ID;
    expect(() => urlDeAutorizacao("abc")).toThrow(/BLING_CLIENT_ID/);
  });
});

describe("paraSlug", () => {
  it("tira acento, espaço e maiúscula", () => {
    expect(paraSlug("Matracas e acessórios")).toBe("matracas-e-acessorios");
    expect(paraSlug("Pareôs")).toBe("pareos");
    expect(paraSlug("Bonés")).toBe("bones");
    expect(paraSlug("Camisas")).toBe("camisas");
  });

  it("não deixa hífen sobrando nas pontas nem repetido", () => {
    expect(paraSlug("  Ecobags  ")).toBe("ecobags");
    expect(paraSlug("Boi -- Matraca")).toBe("boi-matraca");
    expect(paraSlug("///")).toBe("");
  });

  it("casa com os slugs que o site já usa", () => {
    // Se isto quebrar, o catálogo do Bling deixa de encontrar as fotos e as
    // chamadas escritas à mão para cada categoria.
    for (const nome of [
      "Camisas",
      "Matracas",
      "Ecobags",
      "Bonés",
      "Pareôs",
      "Necessaires",
    ]) {
      expect(paraSlug(nome)).toMatch(/^[a-z0-9-]+$/);
    }
    expect(paraSlug("Bonés")).toBe("bones");
    expect(paraSlug("Pareôs")).toBe("pareos");
  });
});

/**
 * Amostra da conta real, copiada da listagem do Bling em 2026-09-03.
 *
 * Os nomes e o `formato` são os de verdade, de propósito: os testes que
 * existiam antes usavam um produto imaginado, com campos que a listagem não
 * devolve (`variacoes`, `estoque`), e por isso passavam enquanto a vitrine
 * quebrava em produção. Fixture inventado testa a ficção, não o sistema.
 */
function amostraDaConta(): ProdutoBling[] {
  const p = (
    id: number,
    nome: string,
    formato: "V" | "S",
    preco: number,
  ): ProdutoBling => ({ id, nome, formato, preco });

  return [
    p(16698811377, "Camisa Alusiva São Luís", "V", 33.8),
    p(16698811627, "Camisa Alusiva São Luís Tamanho:PP", "S", 33.8),
    p(16698811628, "Camisa Alusiva São Luís Tamanho:GG", "S", 33.8),
    p(16689774472, "Camisa", "V", 33.8),
    p(16698811900, "Camisa Tradição Texto", "V", 33.8),
    p(16698811901, "Camisa Tradição Texto Tamanho:M", "S", 33.8),
    p(16689778352, "Boné", "V", 19),
    p(16698805934, "Boné Cor/Estampa:Guarás Bege", "S", 19),
    p(16689786870, "Bloquinho", "S", 9),
    p(16689777073, "Bermuda Brim", "S", 75),
  ];
}

describe("produto-pai e filho de variação", () => {
  const todos = amostraDaConta();
  const pais = nomesDeProdutosPai(todos);

  it("reconhece o produto-pai pelo formato V", () => {
    // Conferido contra a API: "V" é o PAI, não a variação. A suposição
    // invertida punha cada tamanho na vitrine como se fosse outro produto.
    expect(pais).toContain("Camisa Alusiva São Luís");
    expect(pais).toContain("Boné");
    expect(pais).not.toContain("Bloquinho");
  });

  it("testa o nome mais longo primeiro, para não trocar o pai", () => {
    // "Camisa Tradição Texto Tamanho:M" começa com "Camisa", que também é um
    // pai. Sem ordenar por tamanho, o filho iria para o produto errado.
    const filho = todos.find(
      (x) => x.nome === "Camisa Tradição Texto Tamanho:M",
    )!;
    expect(paiDoProduto(filho, pais)).toBe("Camisa Tradição Texto");
  });

  it("trata como filho o que tem o nome do pai como prefixo", () => {
    const filho = todos.find((x) => x.nome.endsWith("Tamanho:GG"))!;
    expect(ehFilhoDeVariacao(filho, pais)).toBe(true);
  });

  it("não confunde produto avulso com filho de variação", () => {
    for (const nome of ["Bloquinho", "Bermuda Brim"]) {
      const avulso = todos.find((x) => x.nome === nome)!;
      expect(ehFilhoDeVariacao(avulso, pais)).toBe(false);
    }
  });

  it("aceita a prova direta do produto individual, quando ela existe", () => {
    const filho: ProdutoBling = {
      id: 1,
      nome: "Nome que não lembra pai nenhum",
      formato: "S",
      variacao: { nome: "Tamanho:G", produtoPai: { id: 99 } },
    };
    expect(ehFilhoDeVariacao(filho, [])).toBe(true);
  });
});

describe("rotuloDaVariacao", () => {
  it("tira o nome do pai e o nome do atributo", () => {
    expect(rotuloDaVariacao("Boné Cor/Estampa:Guarás Bege", "Boné")).toBe(
      "Guarás Bege",
    );
    expect(
      rotuloDaVariacao("Camisa Alusiva São Luís Tamanho:GG", "Camisa Alusiva São Luís"),
    ).toBe("GG");
  });

  it("não devolve vazio quando não há o que tirar", () => {
    expect(rotuloDaVariacao("Único", "Boné")).toBe("Único");
    expect(rotuloDaVariacao("Boné Estampa:", "Boné")).toBe("Estampa:");
  });
});

describe("categoriaPeloNome", () => {
  it("põe cada produto real na prateleira certa", () => {
    const esperado: [string, string][] = [
      ["Camisa Lendas e Carrancas", "camisas"],
      ["Matraca Kambada Play", "matracas"],
      ["Ecobag Pequena", "ecobags"],
      ["Boné", "bones"],
      ["Pareô", "pareos"],
      ["Necessaire", "necessaires"],
    ];
    for (const [nome, slug] of esperado) {
      expect(categoriaPeloNome(nome)).toBe(slug);
    }
  });

  it("deixa de fora o que não tem vitrine, em vez de chutar", () => {
    // Estes existem no Bling e não têm seção no site. Entrar numa prateleira
    // errada seria pior do que ficar de fora e ser reportado.
    for (const nome of [
      "Bermuda Brim",
      "Bloquinho",
      "Lápis Plantável",
      "Livro Trilíngue",
      "Porta-chave",
    ]) {
      expect(categoriaPeloNome(nome)).toBeNull();
    }
  });

  it("não casa por pedaço solto no meio do nome", () => {
    // "Camisa Boizinho com Fio de Matraca" é camisa, não matraca.
    expect(categoriaPeloNome("Camisa Boizinho com Fio de Matraca")).toBe(
      "camisas",
    );
    expect(
      categoriaPeloNome("Ecobag Pequena Estampa:Boizinho com fio de matraca"),
    ).toBe("ecobags");
  });

  it("só devolve slug que a vitrine realmente tem", () => {
    const slugsDoSite = new Set(CATEGORIAS.map((c) => c.slug));
    for (const p of amostraDaConta()) {
      const slug = categoriaPeloNome(p.nome);
      if (slug) expect(slugsDoSite.has(slug)).toBe(true);
    }
  });
});

describe("Limitador", () => {
  it("espaça as chamadas pelo intervalo pedido", async () => {
    const limitador = new Limitador(60);
    const marcas: number[] = [];
    const inicio = Date.now();

    await Promise.all(
      [1, 2, 3].map(() =>
        limitador.executar(async () => {
          marcas.push(Date.now() - inicio);
        }),
      ),
    );

    expect(marcas).toHaveLength(3);
    // Três chamadas a 60 ms de distância levam ao menos ~120 ms no total.
    expect(Math.max(...marcas)).toBeGreaterThanOrEqual(110);
  });

  it("uma falha não trava a fila para as chamadas seguintes", async () => {
    const limitador = new Limitador(10);
    await expect(
      limitador.executar(async () => {
        throw new Error("falhou de propósito");
      }),
    ).rejects.toThrow("falhou de propósito");

    // Se a fila travasse, esta chamada nunca resolveria.
    await expect(limitador.executar(async () => "seguinte")).resolves.toBe(
      "seguinte",
    );
  });

  it("mantém a ordem de entrada", async () => {
    const limitador = new Limitador(5);
    const ordem: number[] = [];
    await Promise.all(
      [1, 2, 3, 4].map((n) =>
        limitador.executar(async () => {
          ordem.push(n);
        }),
      ),
    );
    expect(ordem).toEqual([1, 2, 3, 4]);
  });
});

describe("renovação de token sob concorrência", () => {
  /**
   * Reproduz o cuidado que existe em tokens.ts: várias chamadas que encontram
   * o token vencido ao mesmo tempo devem compartilhar UMA renovação. Se cada
   * uma disparar a sua, o Bling rotaciona o refresh_token e as seguintes
   * chegam com credencial já invalidada — a conexão cai.
   */
  function criarRenovador(renovar: () => Promise<string>) {
    let emAndamento: Promise<string> | null = null;
    return async () => {
      if (!emAndamento) {
        emAndamento = renovar().finally(() => {
          emAndamento = null;
        });
      }
      return emAndamento;
    };
  }

  it("cinco chamadas simultâneas renovam uma vez só", async () => {
    let chamadas = 0;
    const obter = criarRenovador(async () => {
      chamadas++;
      await dormir(20);
      return "token-novo";
    });

    const todos = await Promise.all([1, 2, 3, 4, 5].map(() => obter()));

    expect(chamadas).toBe(1);
    expect(todos).toEqual(Array(5).fill("token-novo"));
  });

  it("depois de terminar, uma nova rodada pode renovar de novo", async () => {
    let chamadas = 0;
    const obter = criarRenovador(async () => {
      chamadas++;
      return `token-${chamadas}`;
    });

    await Promise.all([obter(), obter()]);
    await obter();

    expect(chamadas).toBe(2);
  });

  it("falha na renovação não deixa a promessa presa para sempre", async () => {
    let chamadas = 0;
    const obter = criarRenovador(async () => {
      chamadas++;
      if (chamadas === 1) throw new Error("refresh recusado");
      return "token-ok";
    });

    await expect(obter()).rejects.toThrow("refresh recusado");
    // Se a promessa falhada ficasse guardada, esta chamada falharia também.
    await expect(obter()).resolves.toBe("token-ok");
  });
});

describe("dormir", () => {
  it("espera pelo menos o tempo pedido", async () => {
    const t = Date.now();
    await dormir(30);
    expect(Date.now() - t).toBeGreaterThanOrEqual(25);
  });
});
