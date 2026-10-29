import type { Avaliacao } from "@/lib/avaliacoes/avaliacoes";

const estrelas = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Fortaleza" });

/**
 * "Avaliações de quem comprou" na página da peça. Só entram as aprovadas e
 * autorizadas pelo cliente; todas vieram de um pedido do site (compra
 * verificada). Sem nenhuma, explica como a avaliação chega.
 */
export default function AvaliacoesDaPeca({ media, lista }: { media: number | null; lista: Avaliacao[] }) {
  return (
    <section id="avaliacoes" className="border-b border-borda">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-extrabold">Avaliações de quem comprou</h2>
        {media !== null ? (
          <>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 text-texto-suave">
              <span aria-hidden="true" className="text-xl text-kambada-amarelo-escuro">
                {estrelas(media)}
              </span>
              <span>
                <strong className="font-display text-texto">{media.toFixed(1).replace(".", ",")}</strong> de 5 ·{" "}
                {lista.length} {lista.length === 1 ? "avaliação" : "avaliações"}
              </span>
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {lista.slice(0, 20).map((a) => (
                <li key={a.id} className="rounded-2xl border border-borda bg-superficie p-5">
                  <p className="text-kambada-amarelo-escuro" aria-label={`${a.nota} de 5`}>
                    {estrelas(a.nota)}
                  </p>
                  {a.texto && <p className="mt-2 leading-relaxed">{a.texto}</p>}
                  <p className="mt-3 text-xs text-texto-tenue">
                    {a.nome}
                    {a.opcao ? ` · ${a.opcao}` : ""} · {data(a.em)} · ✔ compra verificada no site
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-texto-suave">
            Esta peça ainda não tem avaliação. Quem compra pelo site recebe o convite para avaliar quando o pedido chega.
          </p>
        )}
      </div>
    </section>
  );
}
