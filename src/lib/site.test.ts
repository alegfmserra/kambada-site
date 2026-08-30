import { describe, expect, it } from "vitest";
import { NAV, REDES, SITE, WHATSAPP, linkWhatsApp } from "./site";

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
  it("não aponta para rota inexistente — /loja só entra na Fase 2", () => {
    expect(NAV.map((i) => i.href)).toEqual([
      "/",
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
