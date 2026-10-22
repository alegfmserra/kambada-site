import { describe, expect, it } from "vitest";
import { ficaForaDaContagem } from "./ContadorVisitas";

describe("ficaForaDaContagem", () => {
  it("não conta Play nem áreas privadas", () => {
    for (const c of ["/kambadaplay", "/kambadaplay/jogos/quiz", "/admin/pedidos", "/checkout", "/pedido/abc", "/conta", "/conta/senha", "/entrar", "/api/saude", "/carrinho"]) {
      expect(ficaForaDaContagem(c), c).toBe(true);
    }
  });
  it("conta as páginas públicas, inclusive /contato", () => {
    for (const c of ["/", "/loja", "/loja/matracas", "/contato", "/cultura/o-que-vestir-no-arraial", "/privacidade"]) {
      expect(ficaForaDaContagem(c), c).toBe(false);
    }
  });
});
