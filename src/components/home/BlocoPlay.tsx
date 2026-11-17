import Image from "next/image";
import LinkPlayHome from "@/components/LinkPlayHome";

/**
 * O Kambada Play na home (17/11/2026): um cartão de festa, com varal de
 * bandeirinhas, a capa da animação e as capas das duas HQs. Tudo o que aparece
 * aqui já existe no Play; nenhuma imagem é genérica.
 *
 * O cartão é escuro nos dois temas, de propósito: é a cara do Play (noite de
 * arraial), e o texto branco sobre grafite passa em contraste em ambos.
 */

const CORES_DO_VARAL = ["#d4432b", "#ffcc29", "#3b8d5d", "#518fc2"];

/** Varal de bandeirinhas de São João, desenhado em SVG (enfeite: fora da leitura de tela). */
function Varal() {
  return (
    <svg aria-hidden="true" className="absolute inset-x-0 top-0 h-9 w-full" preserveAspectRatio="none">
      <defs>
        <pattern id="varal-home" width="176" height="36" patternUnits="userSpaceOnUse">
          {CORES_DO_VARAL.map((cor, i) => (
            <path key={cor} d={`M${i * 44 + 4} 3 h36 l-18 28 z`} fill={cor} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="36" fill="url(#varal-home)" />
      <rect width="100%" height="3" fill="#f1f1f1" opacity="0.7" />
    </svg>
  );
}

const O_QUE_TEM = ["Jogos", "Quadrinhos", "Animação"];

export default function BlocoPlay() {
  return (
    <section className="border-b border-borda" data-area="home-play" aria-labelledby="home-play-titulo">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="relative isolate overflow-hidden rounded-3xl bg-kambada-grafite text-kambada-branco ring-1 ring-white/15">
          <Image
            src="/kambadaplay/images/arraial/poster.webp"
            alt=""
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="-z-10 object-cover opacity-35"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-kambada-grafite via-kambada-grafite/90 to-kambada-grafite/60" />
          <Varal />

          <div className="grid items-center gap-10 px-6 pt-16 pb-10 sm:px-10 sm:pt-20 sm:pb-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-14">
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.2em] text-kambada-amarelo uppercase">
                Kambada Play
              </p>
              <h2 id="home-play-titulo" className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
                O Maranhão que a criançada <span className="text-kambada-amarelo">joga, lê e assiste</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-kambada-branco/85">
                Jogos, quadrinhos e animação da cultura do Maranhão para crianças.
              </p>
              <ul aria-label="O que tem no Kambada Play" className="mt-5 flex flex-wrap gap-2">
                {O_QUE_TEM.map((item) => (
                  <li key={item} className="rounded-full border border-kambada-branco/40 px-3.5 py-1 font-display text-sm font-semibold">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkPlayHome
                  href="/kambadaplay/experimente"
                  destino="jogar"
                  className="inline-flex min-h-12 items-center rounded-full bg-kambada-amarelo px-7 py-3 font-display font-semibold whitespace-nowrap text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
                >
                  Jogar agora
                </LinkPlayHome>
                <LinkPlayHome
                  href="/kambadaplay/conheca"
                  destino="conhecer"
                  className="inline-flex min-h-12 items-center rounded-full border border-kambada-branco/70 px-7 py-3 font-display font-semibold whitespace-nowrap text-kambada-branco transition-colors hover:border-kambada-amarelo hover:text-kambada-amarelo"
                >
                  Conhecer o Kambada Play
                </LinkPlayHome>
              </div>
            </div>

            {/* Capa da animação com as duas HQs por cima, como figurinhas coladas. */}
            <div className="relative mx-auto w-full max-w-xl pb-12 sm:pb-16">
              <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-2 ring-kambada-branco/20">
                <Image
                  src="/kambadaplay/videos/kambadinha-a-hora-dos-guaras.jpg"
                  alt="Capa da animação Kambadinha em: A Hora dos Guarás, com um guará voando sobre o mangue ao pôr do sol"
                  width={1280}
                  height={720}
                  sizes="(max-width: 1024px) 90vw, 36rem"
                  className="h-auto w-full"
                />
              </div>
              <Image
                src="/kambadaplay/hq/kambadinha-na-batida-do-tambor/01.webp"
                alt="Capa da HQ Kambadinha em: Na Batida do Tambor"
                width={1094}
                height={1547}
                sizes="(max-width: 640px) 28vw, 10rem"
                className="absolute bottom-0 left-3 h-auto w-[27%] -rotate-6 rounded-lg shadow-xl shadow-black/60 ring-2 ring-kambada-branco sm:left-6"
              />
              <Image
                src="/kambadaplay/hq/kambadinha-a-hora-dos-guaras/01.webp"
                alt="Capa da HQ Kambadinha em: A Hora dos Guarás"
                width={1200}
                height={1697}
                sizes="(max-width: 640px) 28vw, 10rem"
                className="absolute right-3 bottom-0 h-auto w-[27%] rotate-6 rounded-lg shadow-xl shadow-black/60 ring-2 ring-kambada-branco sm:right-6"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
