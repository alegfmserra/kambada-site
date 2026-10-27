import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { montarPlanilha, resumoGeral, type Dados } from "./dados";

const dados: Dados = {
  pedidos: [
    {
      ref: "KMB-20261021-ABC123",
      pagamentoId: 1,
      criadoEm: "2026-10-21T12:00:00Z",
      cliente: { nome: "Maria", email: "maria@exemplo.com" },
      itens: [{ id: 1, nome: "Caneta", quantidade: 1, preco: 8 }],
      entrega: { descricao: "Correios SEDEX", valor: 10.57, retirada: false, prazoDias: 3 },
      total: 18.57,
      pagamento: { tipo: "bank_transfer" },
      bling: { idPedido: 9 },
    },
  ],
  contas: [{ id: "c1", nome: "=Maria", email: "maria@exemplo.com", senhaHash: "scrypt$abc$SEGREDO", novidades: true, confirmadoEm: "2026-10-20T10:00:00Z", criadoEm: "2026-10-20T09:00:00Z" }],
  respostas: [{ em: "2026-10-21T10:00:00Z", nota: 5, curtiu: ["play"], assinaria: "familia", sugestao: "mais jogos", origem: "instagram" }],
  cupons: [],
  pontuacoes: [],
  premios: [],
  partidas: [],
};

describe("dados do site — painel e planilha", () => {
  it("resumo com faturado, contas e indicativo de assinatura", () => {
    const r = resumoGeral(dados);
    expect(r.faturado).toBe(18.57);
    expect(r.aceitamNovidades).toBe(1);
    expect(r.assinaria).toEqual({ "Sim — Família (R$ 9,90/mês)": 1 });
  });

  it("planilha com todas as abas, sem senha e sem fórmula vinda de texto livre", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await montarPlanilha(dados)) as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Resumo", "Pesquisa de satisfação", "Origem e conversão", "Contas", "Pedidos", "Cupons", "Play — partidas", "Play — prêmios",
    ]);
    const tudo = JSON.stringify(wb.worksheets.map((w) => w.getSheetValues()));
    expect(tudo).not.toContain("SEGREDO");
    expect(wb.getWorksheet("Contas")!.getCell("A2").value).toBe("'=Maria");
  });
});
