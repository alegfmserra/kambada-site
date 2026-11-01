import { describe, expect, it } from "vitest";
import { analisarVisitas, avaliarVital, variacao } from "./analise";
import { ehRobo, lerEvento, type EventoVisita } from "./visitas";

describe("ehRobo", () => {
  it("descarta robôs, ferramentas e user-agent vazio", () => {
    expect(ehRobo(null)).toBe(true);
    expect(ehRobo("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(ehRobo("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120")).toBe(true);
    expect(ehRobo("Mozilla/5.0 Chrome-Lighthouse")).toBe(true);
    expect(ehRobo("curl/8.4.0")).toBe(true);
  });
  it("deixa passar navegadores de gente, inclusive o do Instagram", () => {
    expect(ehRobo("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0")).toBe(false);
    expect(ehRobo("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36")).toBe(false);
  });
});

describe("lerEvento (novos tipos)", () => {
  it("aceita vital, compra, 404, número da visita, aparelho e campanha", () => {
    expect(lerEvento({ tipo: "vital", nome: "LCP", valor: 2100.4, caminho: "/loja", s: "abcdef0123456789", aparelho: "celular" })).toEqual({
      tipo: "vital", nome: "LCP", valor: 2100.4, caminho: "/loja", s: "abcdef0123456789", aparelho: "celular",
    });
    expect(lerEvento({ tipo: "vital", nome: "XYZ", valor: 1, caminho: "/" })).toBeNull();
    expect(lerEvento({ tipo: "vital", nome: "CLS", valor: 99, caminho: "/" })).toBeNull();
    expect(lerEvento({ tipo: "compra", s: "abcdef0123456789" })).toEqual({ tipo: "compra", s: "abcdef0123456789" });
    expect(lerEvento({ tipo: "erro404", caminho: "/pagina-velha" })).toEqual({ tipo: "erro404", caminho: "/pagina-velha" });
    expect(lerEvento({ tipo: "pagina", caminho: "/", canal: "Instagram", campanha: "Bio Verão!" })).toEqual({ tipo: "pagina", caminho: "/", canal: "Instagram", campanha: "bio-ver-o-" });
  });
  it("ignora número de visita e aparelho malformados", () => {
    expect(lerEvento({ tipo: "checkout", s: "<script>", aparelho: "geladeira" })).toEqual({ tipo: "checkout" });
  });
});

describe("analisarVisitas", () => {
  const S1 = "a1a1a1a1a1a1a1a1";
  const S2 = "b2b2b2b2b2b2b2b2";
  const S3 = "c3c3c3c3c3c3c3c3";
  const es: EventoVisita[] = [
    // visita 1: Instagram, celular, vê produto, carrinho, checkout e compra
    { em: "2026-11-01T13:00:00Z", tipo: "pagina", caminho: "/", canal: "Instagram", campanha: "bio", aparelho: "celular", s: S1 },
    { em: "2026-11-01T13:00:30Z", tipo: "pagina", caminho: "/loja/x", s: S1 },
    { em: "2026-11-01T13:00:31Z", tipo: "produto", produto: "Camisa", s: S1 },
    { em: "2026-11-01T13:01:00Z", tipo: "carrinho", produto: "Camisa", qtd: 1, s: S1 },
    { em: "2026-11-01T13:02:00Z", tipo: "checkout", s: S1 },
    { em: "2026-11-01T13:05:00Z", tipo: "compra", s: S1 },
    { em: "2026-11-01T13:00:25Z", tipo: "tempo", caminho: "/", seg: 30, s: S1 },
    // visita 2: Google, computador, só 1 página (rejeição)
    { em: "2026-11-01T14:00:00Z", tipo: "pagina", caminho: "/", canal: "Google", aparelho: "computador", s: S2 },
    // visita 3: Instagram, celular, carrinho sem compra (abandono)
    { em: "2026-11-01T15:00:00Z", tipo: "pagina", caminho: "/", canal: "Instagram", campanha: "story", aparelho: "celular", s: S3 },
    { em: "2026-11-01T15:00:10Z", tipo: "pagina", caminho: "/loja/x", s: S3 },
    { em: "2026-11-01T15:00:11Z", tipo: "produto", produto: "Camisa", s: S3 },
    { em: "2026-11-01T15:00:50Z", tipo: "carrinho", produto: "Camisa", qtd: 1, s: S3 },
    // velocidade e 404
    { em: "2026-11-01T15:01:00Z", tipo: "vital", nome: "LCP", valor: 2000, caminho: "/", aparelho: "celular" },
    { em: "2026-11-01T15:01:00Z", tipo: "vital", nome: "LCP", valor: 5000, caminho: "/", aparelho: "celular" },
    { em: "2026-11-01T15:01:00Z", tipo: "vital", nome: "LCP", valor: 3000, caminho: "/", aparelho: "computador" },
    { em: "2026-11-01T15:02:00Z", tipo: "erro404", caminho: "/velha" },
    { em: "2026-11-01T15:03:00Z", tipo: "erro404", caminho: "/velha" },
  ];
  const pedidos = [{ criadoEm: "2026-11-01T13:05:00Z", cancelado: false, itens: [{ nome: "Camisa (G)", quantidade: 1 }], total: 120, fonte: "l.instagram.com", meio: "referral" }];
  const a = analisarVisitas(es, pedidos);

  it("monta o funil por visita", () => {
    expect(a.funil).toEqual({ sessoes: 3, produto: 2, carrinho: 2, checkout: 1, compra: 1 });
  });
  it("calcula rejeição, páginas e tempo por visita", () => {
    expect(a.qualidade.rejeicao).toBe(33.3);
    expect(a.qualidade.paginasPorSessao).toBe(1.7);
    expect(a.qualidade.segPorSessao).toBe(10);
  });
  it("calcula receita, ticket e abandono por canal", () => {
    const i = a.canais.find((c) => c.canal === "Instagram")!;
    expect(i).toMatchObject({ sessoes: 2, pedidos: 1, receita: 120, ticket: 120, comCarrinho: 2, semCompra: 1, abandono: 50, conversao: 50 });
    expect(a.canais.find((c) => c.canal === "Google")).toMatchObject({ sessoes: 1, pedidos: 0, comCarrinho: 0 });
  });
  it("separa campanhas, aparelhos e horário de São Luís", () => {
    expect(a.campanhas.map((c) => `${c.canal}/${c.campanha}`).sort()).toEqual(["Instagram/bio", "Instagram/story"]);
    expect(a.aparelhos.find((x) => x.aparelho === "celular")).toMatchObject({ sessoes: 2, pct: 66.7 });
    expect(a.horas[10].sessoes).toBe(1); // 13:00Z = 10h em São Luís
    expect(a.horas[12].sessoes).toBe(1);
    expect(a.semana[0].sessoes).toBe(3); // 01/11/2026 é domingo
  });
  it("tira o percentil 75 da velocidade e conta os 404", () => {
    expect(a.velocidade[0]).toMatchObject({ caminho: "/", amostras: 3, lcp: 5000 });
    expect(a.velocidadePorAparelho.find((x) => x.aparelho === "celular")?.lcp).toBe(5000);
    expect(a.velocidadePorAparelho.find((x) => x.aparelho === "computador")?.lcp).toBe(3000);
    expect(a.erros404).toEqual([{ caminho: "/velha", vezes: 2 }]);
  });
});

describe("avaliarVital e variacao", () => {
  it("classifica pelos limites do Google", () => {
    expect(avaliarVital("LCP", 2400)).toBe("bom");
    expect(avaliarVital("LCP", 3500)).toBe("melhorar");
    expect(avaliarVital("LCP", 5000)).toBe("ruim");
    expect(avaliarVital("CLS", 0.05)).toBe("bom");
    expect(avaliarVital("INP", null)).toBeNull();
  });
  it("calcula a variação sobre o período anterior", () => {
    expect(variacao(12, 10)).toBe(20);
    expect(variacao(5, 10)).toBe(-50);
    expect(variacao(5, 0)).toBeNull();
  });
});
