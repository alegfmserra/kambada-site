/** Mensagens prontas de WhatsApp ao cliente e telefone no formato do wa.me (Fase A, 21/10/2026). */

import { linkDeRastreio } from "../email/posVenda";
import type { RegistroPedido } from "./registro";

export function mensagemDoWhatsApp(r: RegistroPedido, tipo: string): string {
  const nome = r.cliente.nome.split(" ")[0];
  switch (tipo) {
    case "rastreio":
      return r.envio
        ? `Oi, ${nome}! Aqui é da Kambada 💛 Seu pedido ${r.ref} foi postado pela ${r.envio.transportadora}. Código de rastreio: ${r.envio.codigo}. Acompanhe: ${linkDeRastreio(r.envio.codigo)}`
        : `Oi, ${nome}! Aqui é da Kambada 💛 Seu pedido ${r.ref} está sendo preparado para envio.`;
    case "producao":
      return `Oi, ${nome}! Aqui é da Kambada 💛 Começamos a produzir o seu pedido ${r.ref} — cada peça é feita à mão no nosso ateliê. A partir de agora o pedido não pode mais ser cancelado. Avisamos quando estiver pronto!`;
    case "pronto":
      return `Oi, ${nome}! Aqui é da Kambada 💛 Seu pedido ${r.ref} está pronto para retirada no ateliê. Qual o melhor dia e horário para você vir?`;
    case "problema":
      return `Oi, ${nome}! Aqui é da Kambada. Tivemos um problema com a entrega do seu pedido ${r.ref} e queremos resolver com você. Pode confirmar o endereço e um horário em que alguém possa receber?`;
    default:
      return `Oi, ${nome}! Aqui é da Kambada 💛 Sobre o seu pedido ${r.ref}:`;
  }
}

/** Telefone do Bling → formato do wa.me (55 + DDD + número). */
export function telefoneParaWhatsApp(bruto: string | undefined): string | null {
  const d = (bruto ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}
