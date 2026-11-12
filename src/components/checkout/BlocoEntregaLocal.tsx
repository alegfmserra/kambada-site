import { linkWhatsApp } from "@/lib/site";

/**
 * Depois do pagamento, na entrega por aplicativo (Grande São Luís): leva o cliente ao WhatsApp,
 * onde a loja cota a corrida no app, combina o horário e, se não for grátis, recebe a corrida por Pix.
 */
export default function BlocoEntregaLocal({ refPedido }: { refPedido?: string }) {
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-borda bg-superficie p-6 text-left">
      <h2 className="font-display text-lg font-bold">Entrega por aplicativo</h2>
      <p className="mt-2 text-texto-suave">
        Vamos cotar a corrida no app e combinar o horário com você pelo WhatsApp. A corrida é paga por Pix, na hora; em São Luís, pedidos a partir de R$ 180 em produtos têm a corrida por nossa conta.
      </p>
      <p className="mt-3 text-sm text-texto-suave">Pedido pago até as 15h, de pronta entrega, sai no mesmo dia. Peça de produção própria sai quando ficar pronta.</p>
      <a
        href={linkWhatsApp(`Oi! Quero combinar a entrega por aplicativo do meu pedido${refPedido ? ` ${refPedido}` : ""}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
      >
        Combinar a entrega no WhatsApp
      </a>
    </div>
  );
}
