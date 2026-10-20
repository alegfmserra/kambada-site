import { enderecoAtelieEmUmaLinha } from "@/lib/loja/enderecoAtelie";
import { linkWhatsApp } from "@/lib/site";

/**
 * O endereço do ateliê para quem vai retirar. Componente de SERVIDOR (sem
 * "use client"): só é renderizado depois de o pagamento ser confirmado, e o
 * endereço nunca entra no código enviado aos visitantes em geral.
 */
export default function BlocoRetirada({ refPedido }: { refPedido?: string }) {
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-borda bg-superficie p-6 text-left">
      <h2 className="font-display text-lg font-bold">Retirada no ateliê</h2>
      <p className="mt-2 text-texto-suave">Seu pedido fica separado para você em:</p>
      <p className="mt-2 font-display text-lg font-semibold">{enderecoAtelieEmUmaLinha()}</p>
      <p className="mt-3 text-sm text-texto-suave">
        Combine o dia e o horário antes de vir, para a peça estar pronta.
      </p>
      <a
        href={linkWhatsApp(
          `Oi! Quero combinar a retirada do meu pedido${refPedido ? ` ${refPedido}` : ""} no ateliê.`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
      >
        Combinar a retirada no WhatsApp
      </a>
    </div>
  );
}
