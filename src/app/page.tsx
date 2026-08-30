import Link from "next/link";
import { linkWhatsApp } from "@/lib/site";

/**
 * Home. Textos preservados do site em produção (somoskambada.com.br),
 * lido em 2026-08-30 — nada foi reescrito por conta própria.
 * As três categorias abaixo viram links para /loja na Fase 2.
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
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-kambada-amarelo uppercase">
            Moda e arte
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-6xl">
            A beleza que é ser{" "}
            <span className="text-kambada-amarelo">maranhense que só</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-kambada-branco/80">
            Na Kambada, moda e arte se misturam para contar histórias do
            Maranhão. Cada peça carrega o som da matraca, o gingado do reggae e
            as cores do nosso Bumba Meu Boi. Vem sentir o tambor e levar o
            orgulho maranhense no peito!
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/cultura"
              className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Explore a nossa cultura
            </Link>
            <a
              href={linkWhatsApp(
                "Oi, vi a Kambada e quero garantir já minha peça maranhense exclusiva!",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-amarelo hover:text-kambada-grafite"
            >
              Garanta já o seu
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Explore nossos produtos
          </h2>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {CATEGORIAS.map((categoria) => (
              <li
                key={categoria.nome}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-colors hover:border-kambada-amarelo/50"
              >
                <h3 className="font-display text-xl font-semibold text-kambada-amarelo">
                  {categoria.nome}
                </h3>
                <p className="mt-3 leading-relaxed text-kambada-branco/75">
                  {categoria.texto}
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
