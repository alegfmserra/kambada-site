import { describe, expect, it } from "vitest";
import { canalDaOrigem, lerEvento, nomeDoProduto, normalizarCaminho, resumirVisitas, type EventoVisita } from "./visitas";

describe("canalDaOrigem", () => {
  it("reconhece os canais pedidos", () => {
    expect(canalDaOrigem("l.instagram.com", "referral")).toBe("Instagram");
    expect(canalDaOrigem("instagram", "social")).toBe("Instagram");
    expect(canalDaOrigem("m.facebook.com", "referral")).toBe("Facebook");
    expect(canalDaOrigem("google.com", "organico")).toBe("Google");
    expect(canalDaOrigem("google", "cpc")).toBe("Google Ads");
    expect(canalDaOrigem("bing.com", "organico")).toBe("Bing");
    expect(canalDaOrigem("direto", "nenhum")).toBe("Direto");
    expect(canalDaOrigem(undefined)).toBe("Sem registro");
    expect(canalDaOrigem("blogdealguem.com.br", "referral")).toBe("Outros sites");
  });
});

describe("normalizarCaminho", () => {
  it("tira query e recusa áreas privadas e o Play", () => {
    expect(normalizarCaminho("/loja/camisas/?utm_source=x")).toBe("/loja/camisas");
    expect(normalizarCaminho("/contato")).toBe("/contato");
    for (const p of ["/checkout", "/pedido/KMB-1", "/conta", "/carrinho", "/entrar", "/admin/dados", "/kambadaplay/jogos", "/api/x"]) {
      expect(normalizarCaminho(p)).toBeNull();
    }
    expect(normalizarCaminho("loja")).toBeNull();
    expect(normalizarCaminho("/a b<script>")).toBeNull();
  });
});

describe("lerEvento", () => {
  it("aceita só eventos bem formados", () => {
    expect(lerEvento({ tipo: "pagina", caminho: "/", canal: "Instagram" })).toEqual({ tipo: "pagina", caminho: "/", canal: "Instagram" });
    expect(lerEvento({ tipo: "tempo", caminho: "/loja", seg: 12.4 })).toEqual({ tipo: "tempo", caminho: "/loja", seg: 12 });
    expect(lerEvento({ tipo: "tempo", caminho: "/loja", seg: 0 })).toBeNull();
    expect(lerEvento({ tipo: "produto", produto: "Camisa Tradição" })).toEqual({ tipo: "produto", produto: "Camisa Tradição" });
    expect(lerEvento({ tipo: "carrinho", produto: "Matraca", qtd: 999 })).toEqual({ tipo: "carrinho", produto: "Matraca", qtd: 50 });
    expect(lerEvento({ tipo: "checkout", email: "a@b.c" })).toEqual({ tipo: "checkout" });
    expect(lerEvento({ tipo: "outro" })).toBeNull();
    expect(lerEvento(null)).toBeNull();
  });
});

describe("nomeDoProduto", () => {
  it("tira o rótulo entre parênteses do nome do pedido", () => {
    expect(nomeDoProduto("Camisa Tradição (G)")).toBe("Camisa Tradição");
    expect(nomeDoProduto("Matraca Mini")).toBe("Matraca Mini");
  });
});

describe("resumirVisitas", () => {
  const es: EventoVisita[] = [
    { em: "2026-11-01T10:00:00Z", tipo: "pagina", caminho: "/", canal: "Instagram" },
    { em: "2026-11-01T10:00:20Z", tipo: "tempo", caminho: "/", seg: 20 },
    { em: "2026-11-01T10:01:00Z", tipo: "pagina", caminho: "/loja/camisas/camisa-x" },
    { em: "2026-11-01T10:01:01Z", tipo: "produto", produto: "Camisa Tradição" },
    { em: "2026-11-01T10:02:00Z", tipo: "carrinho", produto: "Camisa Tradição", qtd: 1 },
    { em: "2026-11-01T11:00:00Z", tipo: "pagina", caminho: "/", canal: "Google" },
    { em: "2026-11-01T11:00:05Z", tipo: "produto", produto: "Camisa Tradição" },
  ];
  const pedidos = [
    { criadoEm: "2026-11-01T10:30:00Z", cancelado: false, itens: [{ nome: "Camisa Tradição (G)", quantidade: 1 }], fonte: "l.instagram.com", meio: "referral" },
    { criadoEm: "2026-10-01T10:30:00Z", cancelado: false, itens: [{ nome: "Antigo", quantidade: 9 }] },
    { criadoEm: "2026-11-01T12:00:00Z", cancelado: true, itens: [{ nome: "Cancelado", quantidade: 1 }] },
  ];
  it("cruza sessões, canais, produtos e pedidos", () => {
    const r = resumirVisitas(es, pedidos);
    expect(r.sessoes).toBe(2);
    expect(r.pedidos).toBe(1);
    expect(r.conversao).toBe(50);
    expect(r.canais.find((c) => c.canal === "Instagram")).toEqual({ canal: "Instagram", sessoes: 1, pedidos: 1, conversao: 100 });
    expect(r.canais.find((c) => c.canal === "Google")?.conversao).toBe(0);
    expect(r.produtos[0]).toEqual({ produto: "Camisa Tradição", vistas: 2, carrinho: 1, vendidas: 1, pctCarrinho: 50, pctCompra: 50 });
    expect(r.paginas.find((p) => p.caminho === "/")).toEqual({ caminho: "/", vistas: 2, segMedio: 20 });
  });
  it("sem eventos, devolve vazio", () => {
    const r = resumirVisitas([], pedidos);
    expect(r.periodo).toBeNull();
    expect(r.pedidos).toBe(0);
  });
});
