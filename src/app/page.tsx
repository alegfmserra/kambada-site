import Image from "next/image";
import Link from "next/link";
import FaixaBeneficios from "@/components/FaixaBeneficios";
import LinkPlayHome from "@/components/LinkPlayHome";
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
              O som da matraca, o gingado do reggae e as cores do Bumba Meu
              Boi, em peças pra levar o Maranhão no peito.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/loja"
                className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
              >
                Ver a loja
              </Link>
              <Link
                href="/cultura"
                className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro whitespace-nowrap"
              >
                Nossa cultura
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
        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <FaixaBeneficios compacta />
        </div>
      </section>

      {/* --- Kambada Play (Alexandre, 24/10/2026: estava escondido; home vira landing) --- */}
      <section className="relative isolate overflow-hidden border-b border-borda text-kambada-branco">
        <Image
          src="/kambadaplay/images/arraial/poster.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-kambada-grafite via-kambada-grafite/85 to-kambada-grafite/40" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="font-display text-sm font-semibold tracking-[0.2em] text-kambada-amarelo uppercase">
            Novo · Kambada Play
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
            A cultura do Maranhão para <span className="text-kambada-amarelo">jogar, ler e viver</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-kambada-branco/85">
            O Kambada Play é o nosso cantinho digital: jogos do arraial em 3D, quiz e memória das
            estampas, as HQs do Kambadinha e a história da matraca. Conta grátis até 31/12/2026.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <LinkPlayHome
              href="/kambadaplay"
              destino="conhecer"
              className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
            >
              Conhecer o Kambada Play
            </LinkPlayHome>
            <LinkPlayHome
              href="/kambadaplay/experimente"
              destino="quiz"
              className="rounded-full border border-kambada-branco/60 px-7 py-3.5 font-display font-semibold text-kambada-branco transition-colors hover:border-kambada-amarelo hover:text-kambada-amarelo whitespace-nowrap"
            >
              Jogar o quiz sem cadastro
            </LinkPlayHome>
          </div>
        </div>
      </section>

      {/* --- Encomendas (sobe para perto do topo) -------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Encomendas e brindes personalizados</h2>
            <p className="mt-2 leading-relaxed text-texto-suave">
              Matracas e placas pintadas à mão com seu nome ou frase, a partir de 1 unidade. Itens
              corporativos (bloquinhos, lápis ecológicos, ecobags…) a partir de 20.
            </p>
          </div>
          <Link
            href="/encomendas"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
          >
            Fazer uma encomenda
          </Link>
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
                      style={categoria.posicaoDaFoto ? { objectPosition: categoria.posicaoDaFoto } : undefined}
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
                A Kambada nasceu de um arraial de família — o Arraial da
                Cambada na Roça — e das matraquinhas dadas de lembrança aos
                convidados. O brinde durou mais que a festa e virou marca.
              </p>
              <p>Cada peça é feita e pintada por gente daqui.</p>
            </div>
            <Link
              href="/sobre"
              className="mt-8 inline-block rounded-full border border-borda px-7 py-3.5 font-display font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro whitespace-nowrap"
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
              Cada matraca é pintada à mão: a sua não tem gêmea.
            </p>
            <Link
              href="/loja/matracas"
              className="mt-8 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
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
            <Link
              href="/loja"
              className="mt-9 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto whitespace-nowrap"
            >
              Ver a loja
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
