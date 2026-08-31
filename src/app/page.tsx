import Link from "next/link";
import { ARTIGOS } from "@/lib/artigos";

/**
 * Home. Textos preservados do site em produção (somoskambada.com.br),
 * lido em 2026-08-30 — nada foi reescrito por conta própria.
 */

const CATEGORIAS = [
  {
    nome: "Camisetas",
    texto:
      "Modelos estampados com as lendas e símbolos do nosso Maranhão. Vista-se de história e identidade.",
  },
  {
    nome: "Matraca personalizada",
    texto:
      "Aqui quem dita o ritmo é a matraca. Bolsas, chaveiros e acessórios que vibram com o Boi e combinam com o teu estilo.",
  },
  {
    nome: "Bonés",
    texto:
      'Bonés com o charme da ilha, perfeitos para curtir o reggae na praça ou se proteger a "moleira".',
  },
] as const;

export default function Home() {
  const destaques = ARTIGOS.slice(0, 3);

  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
            Moda e arte
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-6xl">
            A beleza que é ser{" "}
            <span className="destaque">maranhense que só</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-texto-suave">
            Na Kambada, moda e arte se misturam para contar histórias do
            Maranhão. Cada peça carrega o som da matraca, o gingado do reggae e
            as cores do nosso Bumba Meu Boi. Vem sentir o tambor e levar o
            orgulho maranhense no peito!
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/loja"
              className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Ver a loja
            </Link>
            <Link
              href="/cultura"
              className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro"
            >
              Explore a nossa cultura
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Explore nossos produtos
          </h2>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {CATEGORIAS.map((categoria) => (
              <li
                key={categoria.nome}
                className="rounded-2xl border border-borda bg-superficie p-8 transition-colors hover:border-kambada-amarelo-escuro"
              >
                <h3 className="font-display text-xl font-semibold">
                  {categoria.nome}
                </h3>
                <p className="mt-3 leading-relaxed text-texto-suave">
                  {categoria.texto}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Do nosso blog
            </h2>
            <Link
              href="/cultura"
              className="font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover:text-kambada-amarelo-escuro"
            >
              Ver todos →
            </Link>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {destaques.map((artigo) => (
              <li
                key={artigo.slug}
                className="rounded-2xl border border-borda bg-superficie p-7 transition-colors hover:border-kambada-amarelo-escuro"
              >
                <p className="font-display text-xs font-semibold tracking-wide text-texto-tenue uppercase">
                  {artigo.categoria}
                </p>
                <h3 className="mt-3 font-display text-lg leading-snug font-semibold">
                  <Link
                    href={`/cultura/${artigo.slug}`}
                    className="hover:text-kambada-amarelo-escuro"
                  >
                    {artigo.titulo}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-texto-suave">
                  {artigo.resumo}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-14 text-kambada-grafite sm:px-14">
            <h2 className="max-w-2xl font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Da Ilha do Amor para o mundo: bora vestir nossa cultura?
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-kambada-grafite/80">
              Descubra a história da Kambada: marca maranhense que celebra o
              Bumba Meu Boi, o reggae e as tradições da Ilha do Amor. Vista
              identidade e cultura.
            </p>
            <Link
              href="/sobre"
              className="mt-9 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Conheça a Kambada
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
