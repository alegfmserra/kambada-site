/**
 * Aviso presente em toda página da loja enquanto o carrinho não existir.
 * Há teste no Gate 3 que falha se ele sumir.
 *
 * O texto mudou quando o catálogo passou a ser real: antes avisava que os
 * produtos eram inventados; agora avisa o que de fato falta — carrinho,
 * pagamento e fotos.
 */
export default function AvisoDemonstracao() {
  return (
    <div
      role="note"
      className="rounded-2xl border-2 border-dashed border-kambada-amarelo-escuro bg-superficie p-5"
    >
      <p className="font-display font-semibold text-texto">
        🦀 Peças reais, pedido pelo WhatsApp
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-suave">
        Os produtos, preços e tamanhos desta página são{" "}
        <strong>os do nosso estoque</strong>. O que ainda não temos aqui são as
        fotos e o carrinho de compras — então, por enquanto, o pedido é
        fechado no WhatsApp, com a gente mesmo. Em breve dá para comprar
        direto pelo site.
      </p>
    </div>
  );
}
