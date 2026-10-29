import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { Catalogo } from "../bling/produtos";
import type { RegistroPedido } from "../pedidos/registro";
import {
  avaliacoesDoProduto,
  gravarAvaliacoes,
  lerEnvio,
  lerTokenDeAvaliacao,
  listarAvaliacoes,
  moderarAvaliacao,
  nomeDeExibicao,
  tokenDeAvaliacao,
} from "./avaliacoes";
import { pecasDoPedido, pedidoPodeAvaliar } from "./pedido";

beforeAll(async () => {
  process.env.AVALIACOES_ARQUIVO = join(await mkdtemp(join(tmpdir(), "kmb-aval-")), "avaliacoes.jsonl");
});

describe("avaliações de peça", () => {
  it("convite: volta o pedido; adulterado ou vencido não vale", () => {
    const t = tokenDeAvaliacao("KMB-1", 1_000_000);
    expect(lerTokenDeAvaliacao(t, 1_000_000)).toBe("KMB-1");
    expect(lerTokenDeAvaliacao(t, 1_000_000 + 121 * 86_400_000)).toBeNull();
    expect(lerTokenDeAvaliacao(t.slice(0, -2) + "xx", 1_000_000)).toBeNull();
    expect(lerTokenDeAvaliacao(undefined)).toBeNull();
  });

  it("nome público: primeiro nome + inicial, nunca o nome inteiro", () => {
    expect(nomeDeExibicao("MARIA JOSÉ DA SILVA")).toBe("Maria S.");
    expect(nomeDeExibicao("ana")).toBe("Ana");
    expect(nomeDeExibicao("  ")).toBe("Cliente Kambada");
  });

  it("envio: só peça do pedido, nota inteira 1–5, uma por peça, texto cortado", () => {
    const pecas = new Set(["10", "20"]);
    const r = lerEnvio(
      {
        avaliacoes: [
          { produto: "10", nota: 5, texto: "  linda   demais " },
          { produto: "10", nota: 1 },
          { produto: "99", nota: 5 },
          { produto: "20", nota: 6 },
          { produto: "20", nota: 4, texto: "x".repeat(900) },
        ],
      },
      pecas,
    );
    expect(r).toEqual([
      { produto: "10", nota: 5, texto: "linda demais" },
      { produto: "20", nota: 4, texto: "x".repeat(600) },
    ]);
    expect(lerEnvio({ avaliacoes: "nada" }, pecas)).toEqual([]);
  });

  it("só aparece no site o que foi aprovado E autorizado; reenviar troca a anterior", async () => {
    const pecas = [{ produto: "10", produtoNome: "Camisa" }];
    const [a] = await gravarAvaliacoes("KMB-A", "Maria Silva", true, [{ produto: "10", nota: 4 }], pecas);
    const [b] = await gravarAvaliacoes("KMB-B", "João Souza", false, [{ produto: "10", nota: 2 }], pecas);
    expect(avaliacoesDoProduto(await listarAvaliacoes(), "10").lista).toHaveLength(0);

    await moderarAvaliacao(a.id, "aprovada");
    await moderarAvaliacao(b.id, "aprovada");
    expect(avaliacoesDoProduto(await listarAvaliacoes(), "10")).toMatchObject({ media: 4, lista: [{ nome: "Maria S." }] });

    // Reenvio do mesmo pedido e peça: substitui e volta para aprovação.
    await gravarAvaliacoes("KMB-A", "Maria Silva", true, [{ produto: "10", nota: 5 }], pecas);
    const todas = await listarAvaliacoes();
    expect(todas.filter((x) => x.pedido === "KMB-A")).toMatchObject([{ nota: 5, status: "pendente" }]);
    expect(avaliacoesDoProduto(todas, "10").lista).toHaveLength(0);
  });

  it("peças do pedido: uma por produto, só com pedido entregue e não cancelado", () => {
    const catalogo = {
      categorias: [],
      produtos: [
        { idBling: 1, slug: "camisa-x", categoria: "camisas", nome: "Camisa X", opcoes: [{ idBling: 11, rotulo: "G" }, { idBling: 12, rotulo: "M" }] },
        { idBling: 2, slug: "lapis", categoria: "papelaria", nome: "Lápis", opcoes: [{ idBling: 21, rotulo: "Único" }] },
      ],
    } as unknown as Catalogo;
    const r = {
      ref: "KMB-1",
      itens: [
        { id: 11, nome: "", quantidade: 1, preco: 1 },
        { id: 12, nome: "", quantidade: 1, preco: 1 },
        { id: 21, nome: "", quantidade: 2, preco: 1 },
        { id: 999, nome: "Saiu do catálogo", quantidade: 1, preco: 1 },
      ],
    } as unknown as RegistroPedido;
    expect(pecasDoPedido(r, catalogo)).toEqual([
      { produto: "1", produtoNome: "Camisa X", opcao: "G, M", href: "/loja/camisas/camisa-x" },
      { produto: "2", produtoNome: "Lápis", href: "/loja/papelaria/lapis" },
    ]);
    expect(pedidoPodeAvaliar(r)).toBe(false);
    expect(pedidoPodeAvaliar({ ...r, conclusao: { tipo: "entregue", em: "x" } })).toBe(true);
    expect(pedidoPodeAvaliar({ ...r, conclusao: { tipo: "entregue", em: "x" }, cancelamento: {} } as RegistroPedido)).toBe(false);
  });
});
