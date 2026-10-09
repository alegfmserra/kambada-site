import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Pagamento } from "../mercadopago/cliente";
import type { RetratoPedido } from "./pedido";

process.env.PEDIDOS_PASTA = mkdtempSync(join(tmpdir(), "kambada-pedidos-"));

type EmailMock = { para: string; html: string; copiaOculta?: string; assunto?: string; anexos?: { nome: string }[] };
const chamadas = vi.hoisted(() => ({ bling: [] as string[], emails: [] as EmailMock[], situacaoNota: 5 }));
process.env.NFE_ESPERA_MS = "0";

vi.mock("../bling/cliente", () => ({
  chamarBling: vi.fn(async (caminho: string) => {
    chamadas.bling.push(caminho);
    if (caminho.endsWith("/gerar-nfe")) return { data: { idNotaFiscal: 555 } };
    if (caminho === "/nfe/555") {
      return {
        data: {
          situacao: chamadas.situacaoNota,
          numero: "29",
          serie: 1,
          chaveAcesso: "21261051894535000194550010000000291000000290",
          linkDanfe: "https://www.bling.com.br/doc.view.php?id=abc",
          linkPDF: "https://www.bling.com.br/doc.view.php?PDF=true&id=abc",
          xml: "https://www.bling.com.br/relatorios/nfe.xml.php?chaveAcesso=abc",
        },
      };
    }
    return {};
  }),
}));
vi.mock("../email/enviar", () => ({
  CID_LOGO: "logo-kambada",
  emailDaLoja: () => "somoskambada@gmail.com",
  emailConfigurado: () => true,
  enviarEmail: vi.fn(async (m: EmailMock) => {
    chamadas.emails.push(m);
  }),
}));

// Download do DANFE e do XML no Bling.
vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string) =>
    new Response(url.includes("PDF=true") ? "%PDF-1.4 nota" : "<?xml version=\"1.0\"?><nfeProc/>", { status: 200 }),
  ),
);

const { executarPosVenda, montarRegistro } = await import("./posVenda");
const { lerRegistro } = await import("../pedidos/registro");
const { htmlConfirmacao, textoConfirmacao, escaparHtml } = await import("../email/confirmacao");

let contador = 0;
function retrato(retirada = false): RetratoPedido {
  contador += 1;
  return {
    v: 1,
    ref: `KMB-20261008-${String(contador).padStart(6, "0")}`,
    itens: [{ id: 16701478057, q: 1, p: 55, n: "Boné Guarás Bege" }],
    frete: retirada
      ? { servico: "Retirar no ateliê", valor: 0, prazo: 0, gratis: false, retirada: true }
      : { servico: "Correios SEDEX", valor: 13.06, prazo: 2, gratis: false },
    cliente: {
      nome: "Maria <b>da</b> Silva",
      email: "maria@exemplo.com",
      telefone: "98999990000",
      cpf: "52998224725",
      cep: "65065060",
      logradouro: "Rua X",
      numero: "1",
      complemento: "",
      bairro: "Centro",
      cidade: "São Luís",
      uf: "MA",
    },
  };
}

const pagamento: Pagamento = {
  id: 999,
  status: "approved",
  payment_type_id: "bank_transfer",
  installments: 1,
  fee_details: [{ type: "mercadopago_fee", amount: 0.27 }],
};

describe("pós-venda", () => {
  beforeEach(() => {
    chamadas.bling = [];
    chamadas.emails = [];
    chamadas.situacaoNota = 5;
    delete process.env.BLING_EMITIR_NFE;
  });

  it("registra, baixa estoque e manda o e-mail — uma vez só", async () => {
    const r = retrato();
    const primeiro = await executarPosVenda(r, pagamento, 123);
    expect(primeiro.estoque?.feitoEm).toBeTruthy();
    expect(primeiro.email?.feitoEm).toBeTruthy();
    expect(chamadas.bling).toEqual(["/pedidos/vendas/123/lancar-estoque"]);
    // Dois e-mails: a confirmação ao cliente e o aviso à loja.
    expect(chamadas.emails.map((m) => m.para)).toEqual(["maria@exemplo.com", "somoskambada@gmail.com"]);

    // Aviso repetido / página recarregada: nada é refeito.
    await executarPosVenda(r, pagamento, 123);
    expect(chamadas.bling).toHaveLength(1);
    expect(chamadas.emails).toHaveLength(2);
  });

  it("duas chamadas simultâneas não fazem nada em dobro", async () => {
    const r = retrato();
    await Promise.all([executarPosVenda(r, pagamento, 7), executarPosVenda(r, pagamento, 7)]);
    expect(chamadas.bling).toHaveLength(1);
    expect(chamadas.emails).toHaveLength(2);
  });

  it("nota fiscal só com BLING_EMITIR_NFE=1 — e o SITE manda a nota ao cliente, com cópia oculta à loja", async () => {
    await executarPosVenda(retrato(), pagamento, 1);
    expect(chamadas.bling.some((c) => c.includes("gerar-nfe"))).toBe(false);

    process.env.BLING_EMITIR_NFE = "1";
    chamadas.emails = [];
    const r = await executarPosVenda(retrato(), pagamento, 2);
    expect(chamadas.bling).toContain("/pedidos/vendas/2/gerar-nfe");
    // O Bling NÃO manda e-mail: senão o cliente receberia a nota duas vezes.
    expect(chamadas.bling).toContain("/nfe/555/enviar?enviarEmail=false");
    expect(r.nfe).toMatchObject({ idNota: 555 });
    expect(r.nfe?.feitoEm).toBeTruthy();

    // Confirmação, aviso à loja e — por último — a nota.
    expect(chamadas.emails).toHaveLength(3);
    const nota = chamadas.emails[2];
    expect(nota.para).toBe("maria@exemplo.com");
    expect(nota.copiaOculta).toBe("somoskambada@gmail.com");
    expect(nota.assunto).toContain("NF-e nº 29");
    expect(nota.anexos?.map((a) => a.nome)).toEqual(["NF-e_29_Kambada.pdf", "NF-e_29_Kambada.xml"]);
    expect(nota.html).toContain("2126 1051");
    expect(r.emailNota?.feitoEm).toBeTruthy();

    // Reprocessar não manda a nota de novo.
    await executarPosVenda({ ...retrato(), ref: r.ref }, pagamento, 2);
    expect(chamadas.emails).toHaveLength(3);
  });

  it("nota REJEITADA pela SEFAZ não conta como feita (caso real de 09/10: CNPJ irregular)", async () => {
    process.env.BLING_EMITIR_NFE = "1";
    chamadas.situacaoNota = 4;
    const r = await executarPosVenda(retrato(), pagamento, 3);
    expect(r.nfe?.feitoEm).toBeUndefined();
    expect(r.nfe?.erro).toContain("Rejeitada");
    // Nota rejeitada não vai por e-mail.
    expect(r.emailNota).toBeUndefined();
    expect(chamadas.emails).toHaveLength(2);
  });

  it("o cliente nunca recebe o próprio telefone/CPF no e-mail; a loja recebe contato e endereço para postar", async () => {
    await executarPosVenda(retrato(), pagamento, 11);
    const [cliente, loja] = chamadas.emails;
    expect(cliente.html).not.toContain("98999990000");
    expect(cliente.html).not.toContain("52998224725");
    expect(cliente.html).toContain("cid:logo-kambada");
    expect(cliente.html).toContain("Pix");
    expect(loja.html).toContain("98999990000");
    expect(loja.html).toContain("Rua X");
    expect(loja.html).not.toContain("52998224725");
    expect(loja.html).toContain("vendas.php#edit/11");
  });

  it("o registro guarda nome e e-mail — nunca CPF, telefone ou endereço", async () => {
    const r = retrato();
    await executarPosVenda(r, pagamento, 9);
    const salvo = JSON.stringify(await lerRegistro(r.ref));
    expect(salvo).toContain("maria@exemplo.com");
    expect(salvo).not.toContain("52998224725");
    expect(salvo).not.toContain("98999990000");
    expect(salvo).not.toContain("Rua X");
  });

  it("o registro soma o total e guarda a taxa do Mercado Pago", () => {
    const reg = montarRegistro(retrato(), pagamento, 5);
    expect(reg.total).toBe(68.06);
    expect(reg.pagamento.taxa).toBe(0.27);
  });
});

describe("e-mail de confirmação", () => {
  const base = { urlDoSite: "https://somoskambada.com.br", linkWhatsApp: "https://wa.me/x" };

  it("escapa o nome do cliente no HTML", () => {
    expect(escaparHtml('<script>"x"</script>')).toBe("&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
    const html = htmlConfirmacao({ ...base, registro: montarRegistro(retrato(), pagamento, 1) });
    expect(html).not.toContain("<b>da</b>");
    expect(html).toContain("Maria");
  });

  it("leva número do pedido, peças, total e o link de acompanhamento", () => {
    const reg = montarRegistro(retrato(), pagamento, 1);
    const texto = textoConfirmacao({ ...base, registro: reg });
    expect(texto).toContain(reg.ref);
    expect(texto).toContain("1× Boné Guarás Bege");
    expect(texto).toContain("Total: R$");
    expect(texto).toContain(`/pedido?ref=${reg.ref}`);
  });

  it("o endereço do ateliê só aparece na retirada", () => {
    const end = "Rua Bom Jesus, nº 38 — Olho d'Água, São Luís/MA";
    const retiradaTxt = textoConfirmacao({
      ...base,
      registro: montarRegistro(retrato(true), pagamento, 1),
      enderecoRetirada: end,
    });
    expect(retiradaTxt).toContain("Bom Jesus");
    const correioTxt = textoConfirmacao({ ...base, registro: montarRegistro(retrato(), pagamento, 1) });
    expect(correioTxt).not.toContain("Bom Jesus");
  });
});
