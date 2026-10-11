import { FRETE_GRATIS_A_PARTIR_DE } from "@/lib/frete/regras";
import { formatarReais } from "@/lib/loja/dinheiro";
import { LIMITES_PARCELAS } from "@/lib/loja/parcelas";

/**
 * Faixa de benefícios — a promessa prática que faltava na home e na loja
 * (auditoria de 10/10/2026). Valores vêm das mesmas constantes do checkout:
 * mudou a regra, muda aqui.
 */
export default function FaixaBeneficios({ compacta = false }: { compacta?: boolean }) {
  const reais0 = (v: number) => formatarReais(v).replace(/,00$/, "");
  const limite2x = LIMITES_PARCELAS.find((l) => l.parcelas === 2)!.aPartirDeCentavos / 100;
  const itens = [
    { icone: "🎨", titulo: "Feito à mão em São Luís", texto: "Peças autorais, em lotes pequenos." },
    { icone: "🚚", titulo: `Frete grátis a partir de ${reais0(FRETE_GRATIS_A_PARTIR_DE)}`, texto: "Na entrega mais barata, para todo o Brasil." },
    { icone: "💳", titulo: "Pix ou cartão sem juros", texto: `2x a partir de ${reais0(limite2x)} e 3x a partir de ${reais0(LIMITES_PARCELAS[0].aPartirDeCentavos / 100)}.` },
    { icone: "📍", titulo: "Retirada grátis no ateliê", texto: "Em São Luís, com hora marcada." },
  ];
  return (
    <ul
      aria-label="Vantagens de comprar na Kambada"
      className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${compacta ? "" : "mt-10"}`}
    >
      {itens.map((i) => (
        <li key={i.titulo} className="flex items-start gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3">
          <span aria-hidden="true" className="text-xl leading-none">
            {i.icone}
          </span>
          <span>
            <span className="block font-display text-sm font-semibold">{i.titulo}</span>
            <span className="block text-xs leading-snug text-texto-suave">{i.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
