import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PONTOS_MINIMOS_PREMIO, PREMIOS_SEMANAIS } from "@/lib/play/jogos/tipos";

export const metadata: Metadata = {
  title: "Jogos",
  description:
    "Jogue o Arraial, o quiz Éguas! Quem é quem? e a Memória das estampas. Os 3 primeiros do ranking da semana ganham cupom.",
};

const JOGOS = [
  {
    href: "/kambadaplay/jogos/quiz",
    selo: "Quiz",
    titulo: "Éguas! Quem é quem?",
    texto: "10 perguntas sobre boi, tambor de crioula, São Luís e mais, em 3 níveis. Responda rápido e ganhe mais pontos.",
    imagem: "/kambadaplay/images/atelie/placa-coreiro.webp",
    acao: "Jogar o quiz",
    ranking: true,
  },
  {
    href: "/kambadaplay/jogos/memoria",
    selo: "Memória",
    titulo: "Memória das estampas",
    texto: "Ache os pares das nossas artes: 6, 8 ou 12, conforme o nível. No difícil, o Cazumbá embaralha as cartas.",
    imagem: "/kambadaplay/jogos/memoria/camisa-boi-maranhense.webp",
    acao: "Jogar a memória",
    ranking: true,
  },
  {
    href: "/kambadaplay/arraial",
    selo: "Aventura",
    titulo: "Arraial da Kambada",
    texto: "Ande pela festa de São João, converse com o povo e junte as cinco fitinhas.",
    imagem: "/kambadaplay/images/arraial/poster.webp",
    acao: "Entrar no arraial",
    ranking: false,
  },
];

export default function JogosPage() {
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          Jogos com a <span className="destaque">nossa cara</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-texto-suave">
          Aprenda a cultura maranhense brincando. Jogue, some pontos e suba no ranking da semana.
        </p>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {JOGOS.map((j) => (
            <li key={j.href}>
              <Link
                href={j.href}
                className="group block overflow-hidden rounded-2xl border-2 border-borda bg-superficie transition-colors hover:border-kambada-amarelo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-kambada-preto">
                  <Image
                    src={j.imagem}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-kambada-amarelo px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-kambada-grafite">
                    {j.selo}
                  </span>
                  {j.ranking ? (
                    <span className="absolute right-3 top-3 rounded-full bg-kambada-grafite/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-kambada-amarelo">
                      Vale ranking
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl font-extrabold text-texto">{j.titulo}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-texto-suave">{j.texto}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--destaque-texto)]">
                    {j.acao} <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-12 rounded-2xl bg-kambada-amarelo p-6 text-kambada-grafite sm:p-8">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Cupom para o top 3 da semana</h2>
          <p className="mt-3 max-w-2xl text-lg">
            Quem soma mais pontos de segunda a domingo ganha desconto nas peças da loja:{" "}
            <strong>{PREMIOS_SEMANAIS[0]}%</strong> para o 1º lugar e <strong>{PREMIOS_SEMANAIS[1]}%</strong> para o 2º e
            o 3º. É preciso somar pelo menos {PONTOS_MINIMOS_PREMIO} pontos.
          </p>
          <Link
            href="/kambadaplay/placar"
            className="mt-5 inline-block rounded-full bg-kambada-grafite px-8 py-3 font-bold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
          >
            Ver o ranking
          </Link>
        </section>
      </div>
    </div>
  );
}
