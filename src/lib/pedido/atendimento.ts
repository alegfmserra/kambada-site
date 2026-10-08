/**
 * Atendimento pós-venda — os motivos e a mensagem que vai para o WhatsApp.
 * A mensagem leva o número do pedido e o nome; nunca CPF nem endereço.
 */

export const MOTIVOS = [
  {
    id: "entrega",
    rotulo: "Dúvida sobre a entrega ou a retirada",
    dica: "Atraso, rastreio parado, endereço, horário de retirada.",
  },
  {
    id: "reclamacao",
    rotulo: "Reclamação",
    dica: "Algo não saiu como combinado — conte o que houve.",
  },
  {
    id: "devolucao",
    rotulo: "Devolução — desisti da compra",
    dica: "Compra pelo site: até 7 dias corridos depois de receber.",
  },
  {
    id: "defeito",
    rotulo: "Defeito ou peça danificada",
    dica: "Até 90 dias depois de receber. Frete por nossa conta. Fotos ajudam muito.",
  },
  {
    id: "troca",
    rotulo: "Trocar por outra estampa ou tamanho",
    dica: "Peça sem uso, até 30 dias. Sem defeito, o frete da troca é por conta do cliente.",
  },
] as const;

export type Motivo = (typeof MOTIVOS)[number]["id"];

export function mensagemAtendimento(d: {
  motivo: Motivo;
  ref: string;
  nome: string;
  descricao: string;
  recebidoEm?: string;
}): string {
  const motivo = MOTIVOS.find((m) => m.id === d.motivo)?.rotulo ?? "Atendimento";
  const linhas = [
    `Atendimento de pedido — ${motivo}`,
    `Pedido: ${d.ref || "(sem número)"}`,
    `Nome: ${d.nome}`,
  ];
  if (d.recebidoEm) linhas.push(`Recebi em: ${d.recebidoEm.split("-").reverse().join("/")}`);
  linhas.push("", d.descricao);
  if (d.motivo === "defeito" || d.motivo === "reclamacao") {
    linhas.push("", "Vou mandar fotos aqui na conversa.");
  }
  return linhas.join("\n");
}
