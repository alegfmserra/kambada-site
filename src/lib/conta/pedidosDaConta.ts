/**
 * Pedidos da "Minha conta" — pedido do Alexandre (20/10/2026): a pessoa vê,
 * na conta, os pedidos feitos com o e-mail dela.
 *
 * Segurança: o vínculo é pelo e-mail, então só mostra pedidos a quem
 * CONFIRMOU o e-mail da conta. Sem isso, qualquer um criaria uma conta com o
 * e-mail de outra pessoa e veria os pedidos dela.
 */

import type { RegistroPedido } from "../pedidos/registro";

export type ResumoPedido = {
  ref: string;
  criadoEm: string;
  total: number;
  pecas: number;
  itens: string[];
  situacao: string;
  rastreio?: { codigo: string; transportadora: string };
};

function normalizar(email: string): string {
  return email.trim().toLowerCase();
}

export function situacaoDoPedido(r: RegistroPedido): string {
  if (r.estorno) return "Pagamento devolvido ou cancelado";
  if (r.envio) return `Postado em ${new Date(r.envio.postadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}`;
  if (r.entrega.retirada) return "Pago · retirada no ateliê";
  return "Pago · em preparação";
}

export function pedidosDaConta(
  registros: RegistroPedido[],
  conta: { email: string; confirmadoEm?: string },
): ResumoPedido[] {
  if (!conta.confirmadoEm) return [];
  const email = normalizar(conta.email);
  return registros
    .filter((r) => normalizar(r.cliente.email) === email)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .map((r) => ({
      ref: r.ref,
      criadoEm: r.criadoEm,
      total: r.total,
      pecas: r.itens.reduce((s, i) => s + i.quantidade, 0),
      itens: r.itens.map((i) => (i.quantidade > 1 ? `${i.quantidade}× ${i.nome}` : i.nome)),
      situacao: situacaoDoPedido(r),
      rastreio: r.envio ? { codigo: r.envio.codigo, transportadora: r.envio.transportadora } : undefined,
    }));
}
