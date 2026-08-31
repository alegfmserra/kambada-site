import type { Metadata } from "next";
import {
  CATEGORIAS_DEMO,
  PRODUTOS_DEMO,
  precoEmReais,
} from "@/lib/produtos-demo";
import { linkWhatsApp } from "@/lib/site";

/**
 * Vitrine de demonstração. Prova o formato da loja antes da integração.
 * O aviso no topo é obrigatório: nenhum destes produtos é real.
 */

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Camisetas, matracas e bonés que vestem a cultura do Maranhão. Prévia da loja Kambada.",
  alternates: { canonical: "/loja" },
};

export default function Loja() {
  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Vista o <span className="destaque">Maranhão</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-texto-suave">
            Cada peça carrega o som da matraca, o gingado do reggae e as cores
            do nosso Bumba Meu Boi.
          </p>

          <div
            role="note"
            className="mt-10 rounded-2xl border-2 border-dashed border-kambada-amarelo-escuro bg-superficie p-5"
          >
            <p className="font-display font-semibold text-texto">
              ⚠️ Prévia — catálogo ilustrativo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-texto-suave">
              Os produtos e preços desta página foram inventados só para mostrar
              como a loja vai funcionar. <strong>Nada aqui é real.</strong> O
              catálogo verdadeiro — com produtos, fotos, preços e estoque — virá
              direto do Bling na próxima fase, e o carrinho passará a funcionar
              de verdade.
            </p>
          </div>
        </div>
      </section>

      {CATEGORIAS_DEMO.map((categoria) => {
        const itens = PRODUTOS_DEMO.filter((p) => p.categoria === categoria);
        return (
          <section key={categoria} className="border-b border-borda">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {categoria}
              </h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {itens.map((produto) => (
                  <li
                    key={produto.slug}
                    className="flex flex-col rounded-2xl border border-borda bg-superficie p-6"
                  >
                    {/* Sem foto: usar imagem de produto real numa demonstração
                        daria a entender que o item existe. */}
                    <div
                      aria-hidden="true"
                      className="mb-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-borda text-3xl"
                    >
                      🦀
                    </div>
                    <h3 className="font-display text-lg font-semibold">
                      {produto.nome}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-texto-suave">
                      {produto.descricao}
                    </p>
                    <p className="mt-4 font-display text-xl font-bold">
                      {precoEmReais(produto.preco)}
                    </p>
                    {produto.emEstoque ? (
                      <a
                        href={linkWhatsApp(
                          `Oi! Tenho interesse na peça "${produto.nome}". Ainda tem disponível?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 rounded-full bg-kambada-amarelo px-5 py-3 text-center font-display text-sm font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
                      >
                        Pedir pelo WhatsApp
                      </a>
                    ) : (
                      <p className="mt-5 rounded-full border border-borda px-5 py-3 text-center font-display text-sm font-semibold text-texto-tenue">
                        Esgotado
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-12 text-kambada-grafite sm:px-12">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
              Enquanto o carrinho não chega, a gente atende no WhatsApp
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-kambada-grafite/80">
              Encomenda para arraial, pedido de empresa ou uma peça só: é só
              chamar que a gente responde.
            </p>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
