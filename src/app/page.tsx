import Image from "next/image";
import Link from "next/link";
import { ARTIGOS } from "@/lib/artigos";
import { CATEGORIAS } from "@/lib/catalogo";
import { FOTOS } from "@/lib/fotos";

/**
 * Home. Os textos são os do site em produção, preservados.
 * As fotos vieram do acervo da marca — gente de verdade, vestindo as peças
 * em São Luís. É o que faz o site parecer a Kambada e não um template.
 */

export default function Home() {
  const destaques = ARTIGOS.slice(0, 3);

  return (
    <>
      {/* --- Abertura: texto de um lado, família do outro ------------------ */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Moda e arte
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-balance sm:text-6xl">
              A beleza que é ser{" "}
              <span className="destaque">maranhense que só</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-texto-suave">
              Na Kambada, moda e arte se misturam para contar histórias do
              Maranhão. Cada peça carrega o som da matraca, o gingado do reggae
              e as cores do nosso Bumba Meu Boi. Vem sentir o tambor e levar o
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

          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={FOTOS.familiaCaminhando.arquivo}
              alt={FOTOS.familiaCaminhando.alt}
              width={FOTOS.familiaCaminhando.largura}
              height={FOTOS.familiaCaminhando.altura}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* --- Categorias, agora com foto ----------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Explore nossos produtos
            </h2>
            <Link
              href="/loja"
              className="font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover:text-kambada-amarelo-escuro"
            >
              Ver a loja inteira →
            </Link>
          </div>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIAS.filter((c) => c.foto).map((categoria) => (
              <li key={categoria.slug}>
                <Link
                  href={`/loja/${categoria.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-borda bg-superficie transition-colors hover:border-kambada-amarelo-escuro"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={categoria.foto!.arquivo}
                      alt={categoria.foto!.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold">
                      {categoria.nome}
                    </h3>
                    <p className="mt-2 leading-relaxed text-texto-suave">
                      {categoria.chamada}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Quem somos --------------------------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-4">
            <Image
              src={FOTOS.familiaSentados.arquivo}
              alt={FOTOS.familiaSentados.alt}
              width={FOTOS.familiaSentados.largura}
              height={FOTOS.familiaSentados.altura}
              sizes="(max-width: 1024px) 45vw, 25vw"
              className="mt-8 rounded-2xl object-cover"
            />
            <Image
              src={FOTOS.meninaRindo.arquivo}
              alt={FOTOS.meninaRindo.alt}
              width={FOTOS.meninaRindo.largura}
              height={FOTOS.meninaRindo.altura}
              sizes="(max-width: 1024px) 45vw, 25vw"
              className="rounded-2xl object-cover"
            />
          </div>

          <div>
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Quem somos
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Uma <span className="destaque">cambada</span> de coração
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-texto-suave">
              <p>
                A Kambada nasceu de uma brincadeira em família — o Arraial da
                Cambada na Roça — e de umas matraquinhas dadas de lembrança aos
                convidados. O brinde durou mais que a festa, e virou marca.
              </p>
              <p>
                Cada peça é feita e pintada por gente daqui. Quando você veste
                uma, leva junto o pedaço de história que veio com ela.
              </p>
            </div>
            <Link
              href="/sobre"
              className="mt-8 inline-block rounded-full border border-borda px-7 py-3.5 font-display font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro"
            >
              Conheça a nossa história
            </Link>
          </div>
        </div>
      </section>

      {/* --- Feito à mão --------------------------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Feito à mão
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Uma por uma, <span className="destaque">nunca iguais</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-texto-suave">
              As matracas são pintadas à mão, uma a uma. Duas nunca saem
              exatamente iguais — e é isso que faz cada uma ser sua.
            </p>
            <Link
              href="/loja/matracas"
              className="mt-8 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Ver as matracas
            </Link>
          </div>

          <div className="order-1 overflow-hidden rounded-3xl lg:order-2">
            <Image
              src={FOTOS.expositorFeira.arquivo}
              alt={FOTOS.expositorFeira.alt}
              width={FOTOS.expositorFeira.largura}
              height={FOTOS.expositorFeira.altura}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* --- Blog ---------------------------------------------------------- */}
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

      {/* --- Chamada final -------------------------------------------------- */}
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
