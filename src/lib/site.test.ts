import { describe, expect, it } from "vitest";
import { ARTIGOS, artigoPorSlug, dataPorExtenso } from "./artigos";
import {
  CATEGORIAS,
  PRODUTOS,
  categoriaPorSlug,
  disponibilidade,
  precoEmReais,
  precoExibido,
  produtosDaCategoria,
} from "./catalogo";
import { EH_PRODUCAO, NAV, REDES, SITE, WHATSAPP, linkWhatsApp } from "./site";

describe("linkWhatsApp", () => {
  it("monta o link com o número oficial da Kambada", () => {
    expect(linkWhatsApp()).toContain(`https://wa.me/${WHATSAPP.numero}?text=`);
  });

  it("usa a saudação padrão quando nenhuma mensagem é passada", () => {
    expect(linkWhatsApp()).toContain(encodeURIComponent(WHATSAPP.saudacao));
  });

  it("escapa acento, espaço e pontuação da mensagem", () => {
    const link = linkWhatsApp("Quero minha peça, e aí?");
    expect(link).toContain("Quero%20minha%20pe%C3%A7a%2C%20e%20a%C3%AD%3F");
    // Nada de caractere cru na query que quebre a URL.
    const query = link.slice(link.indexOf("?text=") + "?text=".length);
    expect(query).not.toMatch(/[ ç?&#]/);
  });

  it("preserva o emoji usado nas campanhas", () => {
    expect(linkWhatsApp("Bora 🦀")).toContain(encodeURIComponent("🦀"));
  });
});

describe("navegação", () => {
  it("aponta para as rotas que existem no projeto", () => {
    expect(NAV.map((i) => i.href)).toEqual([
      "/",
      "/loja",
      "/sobre",
      "/cultura",
      "/contato",
    ]);
  });

  it("não tem href duplicado", () => {
    const hrefs = NAV.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("artigos do blog", () => {
  it("tem três artigos publicados", () => {
    expect(ARTIGOS).toHaveLength(3);
  });

  it("cada artigo tem slug único, título, resumo e conteúdo", () => {
    const slugs = ARTIGOS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const artigo of ARTIGOS) {
      expect(artigo.slug).toMatch(/^[a-z0-9-]+$/);
      expect(artigo.titulo.length).toBeGreaterThan(10);
      expect(artigo.resumo.length).toBeGreaterThan(40);
      expect(artigo.blocos.length).toBeGreaterThan(3);
      expect(artigo.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("localiza artigo pelo slug e devolve indefinido para slug inválido", () => {
    expect(artigoPorSlug(ARTIGOS[0].slug)?.titulo).toBe(ARTIGOS[0].titulo);
    expect(artigoPorSlug("nao-existe")).toBeUndefined();
  });

  it("formata a data em português sem escorregar de fuso", () => {
    // Fuso adiantado costuma jogar a data para o dia anterior; o formatador
    // fixa meio-dia UTC justamente para isso não acontecer.
    expect(dataPorExtenso("2026-08-30")).toContain("30");
    expect(dataPorExtenso("2026-08-30")).toContain("agosto");
  });
});

describe("catálogo", () => {
  it("todo produto tem slug único e pertence a uma categoria existente", () => {
    const slugs = PRODUTOS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const validas = new Set(CATEGORIAS.map((c) => c.slug));
    for (const p of PRODUTOS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(validas.has(p.categoria), `categoria de ${p.slug}`).toBe(true);
      expect(p.preco).toBeGreaterThan(0);
      expect(p.variacoes.length).toBeGreaterThan(0);
    }
  });

  it("nenhuma categoria fica vazia — vitrine sem produto é link quebrado", () => {
    for (const c of CATEGORIAS) {
      expect(produtosDaCategoria(c.slug).length, c.nome).toBeGreaterThan(0);
    }
  });

  it("faixa de preço nunca é invertida", () => {
    for (const p of PRODUTOS) {
      if (p.precoMaximo) {
        expect(p.precoMaximo, p.slug).toBeGreaterThanOrEqual(p.preco);
      }
    }
  });

  it("formata preço em real brasileiro", () => {
    const formatado = precoEmReais(89.9);
    expect(formatado).toContain("89,90");
    expect(formatado).toContain("R$");
  });

  it("mostra faixa quando há variação de preço, e valor único quando não há", () => {
    const comFaixa = PRODUTOS.find((p) => p.precoMaximo);
    expect(comFaixa).toBeDefined();
    expect(precoExibido(comFaixa!)).toContain(" a ");

    const semFaixa = PRODUTOS.find((p) => !p.precoMaximo)!;
    expect(precoExibido(semFaixa)).not.toContain(" a ");
  });

  it("não expõe o saldo exato de estoque na vitrine", () => {
    const poucas = disponibilidade({ ...PRODUTOS[0], quantidade: 3 });
    expect(poucas.texto).toBe("Últimas unidades");
    expect(poucas.texto).not.toMatch(/\d/);

    expect(disponibilidade({ ...PRODUTOS[0], quantidade: 0 }).disponivel).toBe(
      false,
    );
    expect(disponibilidade({ ...PRODUTOS[0], quantidade: 40 }).texto).toBe(
      "Disponível",
    );
  });

  it("localiza categoria pelo slug e recusa slug inválido", () => {
    expect(categoriaPorSlug("camisas")?.nome).toBe("Camisas");
    expect(categoriaPorSlug("nao-existe")).toBeUndefined();
  });
});

describe("proteção contra indexação indevida", () => {
  it("não se considera produção sem NEXT_PUBLIC_SITE_URL definida", () => {
    // Nos testes a variável não existe — é exatamente o caso do endereço
    // temporário da Hostinger, que não pode competir no Google com o site
    // que está vendendo hoje.
    expect(process.env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(EH_PRODUCAO).toBe(false);
  });

  it("o domínio oficial não tem barra final, que quebraria a comparação exata", () => {
    // EH_PRODUCAO compara a variável de ambiente com SITE.url por igualdade
    // estrita. Uma barra final aqui faria o site nunca se reconhecer como
    // produção, e ele ficaria invisível ao Google para sempre.
    const oficial: string = SITE.url;
    expect(oficial.endsWith("/")).toBe(false);
    expect(oficial).toBe(oficial.trim());
  });
});

describe("dados institucionais", () => {
  it("usa o domínio de produção, sem barra final", () => {
    expect(SITE.url).toBe("https://somoskambada.com.br");
    expect(SITE.url.endsWith("/")).toBe(false);
  });

  it("aponta todas as redes para https", () => {
    for (const rede of REDES) {
      expect(rede.url.startsWith("https://")).toBe(true);
    }
  });
});
