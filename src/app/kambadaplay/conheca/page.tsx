import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { URL_FAPEMA } from "@/components/play/ApoioFapema";
import { Bandeirinhas } from "@/components/play/ornaments/Bandeirinhas";
import { HQS, paginaDaHQ } from "@/content/play/hq";
import { VIDEOS, capaDoVideo } from "@/content/play/videos";
import { PONTOS_MINIMOS_PREMIO, PREMIOS_SEMANAIS } from "@/lib/play/jogos/tipos";
import { IMAGEM_OG_PLAY, og } from "@/lib/seo/og";
import { SITE } from "@/lib/site";

const TITULO = "Conheça o Kambada Play";
const DESCRICAO =
  "Jogos, quadrinhos e animação da cultura do Maranhão para crianças: quiz, memória, quebra-cabeça, o Arraial em 3D, as HQs do Kambadinha e o cordel do Auto do Boi.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/kambadaplay/conheca" },
  openGraph: og("/kambadaplay/conheca", { images: [IMAGEM_OG_PLAY] }),
  robots: { index: true, follow: true },
};

const JOGAR = "/kambadaplay/experimente";
const CRIAR = "/kambadaplay/entrar?modo=criar&de=/kambadaplay";

const BOTAO_AMARELO =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-kambada-amarelo px-8 py-3 text-center text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro";
const BOTAO_CONTORNO_GRANDE =
  "inline-flex min-h-12 items-center justify-center rounded-full border-2 border-borda-campo px-8 py-3 text-center text-lg font-bold text-texto transition-colors hover:border-kambada-amarelo-escuro";
const BOTAO_CONTORNO =
  "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-borda-campo px-6 py-2.5 text-center font-bold text-texto transition-colors hover:border-kambada-amarelo";
const LINK = "font-semibold text-texto underline underline-offset-4 decoration-kambada-amarelo decoration-2";

/** Só entra aqui o que existe no Play hoje (rotas em app/kambadaplay e conteúdo em content/play). */
const O_QUE_TEM: { selo: string; titulo: string; texto: string; imagem: string; alt: string }[] = [
  {
    selo: "Jogo",
    titulo: "Éguas! Quem é quem?",
    texto: "Quiz de 10 perguntas sobre boi, tambor de crioula e São Luís. Cada resposta traz uma curiosidade.",
    imagem: "/kambadaplay/images/atelie/placa-coreiro.webp",
    alt: "Placa pintada à mão com um coreiro do tambor de crioula",
  },
  {
    selo: "Jogo",
    titulo: "Memória das estampas",
    texto: "Ache os pares das artes da Kambada e descubra de onde vem cada uma.",
    imagem: "/kambadaplay/jogos/memoria/camisa-boi-maranhense.webp",
    alt: "Estampa do boi do Bumba Meu Boi com a faixa Maranhense que só",
  },
  {
    selo: "Jogo",
    titulo: "Quebra-cabeça das estampas",
    texto: "Monte as artes em 12, 20 ou 40 peças, trocando duas peças de lugar por vez.",
    imagem: "/kambadaplay/jogos/memoria/camisa-alusiva-sao-luis.webp",
    alt: "Estampa com os símbolos de São Luís: azulejo, sobrado, sol, mar e caranguejo",
  },
  {
    selo: "Jogo",
    titulo: "Palavra do dia maranhense",
    texto: "Uma palavra de 5 letras do Maranhão por dia, com o significado no fim.",
    imagem: "/kambadaplay/images/atelie/placa-coreira.webp",
    alt: "Placa pintada à mão com uma coreira de saia rodada",
  },
  {
    selo: "Aventura em 3D",
    titulo: "Arraial da Kambada",
    texto: "Um passeio pelo São João: converse com os brincantes e junte as cinco fitinhas.",
    imagem: "/kambadaplay/images/arraial/poster.webp",
    alt: "A praça do Arraial da Kambada, com bandeirinhas e barracas",
  },
  ...HQS.slice(0, 1).map((hq) => ({
    selo: "Quadrinhos",
    titulo: "HQs do Kambadinha",
    texto: `${HQS.length} histórias para ler na tela: ${HQS.map((h) => h.titulo.replace("Kambadinha em: ", "")).join(" e ")}.`,
    imagem: paginaDaHQ(hq, 1),
    alt: `Capa da HQ ${hq.titulo}`,
  })),
  ...VIDEOS.slice(0, 1).map((v) => ({
    selo: "Animação",
    titulo: v.titulo,
    texto: `Um curta de ${v.duracao} sobre o caranguejo Kambadinha e um filhote de guará.`,
    imagem: capaDoVideo(v),
    alt: `Cena da animação ${v.titulo}`,
  })),
  {
    selo: "Cordel",
    titulo: "O Auto do Boi",
    texto: "A lenda do Bumba Meu Boi em folheto de cordel digital, para ler rolando a tela.",
    imagem: "/kambadaplay/images/boi-de-matraca.webp",
    alt: "Ilustração de um boi de matraca",
  },
];

const PASSOS = [
  {
    titulo: "Experimente sem cadastro",
    texto: "O quiz no nível fácil abre na hora, sem conta e sem ranking.",
  },
  {
    titulo: "O responsável cria a conta",
    texto: "Com nome, e-mail e senha. A criança aparece no ranking só com um apelido.",
  },
  {
    titulo: "Jogar, ler e assistir",
    texto: `Os jogos somam pontos de segunda a domingo. Os 3 primeiros da semana ganham cupom de ${PREMIOS_SEMANAIS[0]} %, ${PREMIOS_SEMANAIS[1]} % e ${PREMIOS_SEMANAIS[2]} % na loja da Kambada (mínimo de ${PONTOS_MINIMOS_PREMIO} pontos, conta com e-mail confirmado).`,
  },
];

const PERGUNTAS: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Precisa de cadastro para jogar?",
    resposta:
      "Para experimentar, não: o quiz no nível fácil abre sem cadastro. Os outros jogos, o Arraial, as HQs, a animação, o cordel e o ranking pedem a conta.",
  },
  {
    pergunta: "Quem cria a conta?",
    resposta:
      "O adulto responsável, com nome, e-mail e senha. A criança joga com um apelido, que é a única coisa que aparece no ranking.",
  },
  {
    pergunta: "Como funciona o cupom do ranking?",
    resposta: `O ranking soma o melhor resultado da semana em cada jogo, de segunda a domingo. Os 3 primeiros com pelo menos ${PONTOS_MINIMOS_PREMIO} pontos ganham cupom de ${PREMIOS_SEMANAIS[0]} %, ${PREMIOS_SEMANAIS[1]} % e ${PREMIOS_SEMANAIS[2]} % nas peças da loja. Só recebe o cupom a conta com e-mail confirmado.`,
  },
  {
    pergunta: "Tem anúncio?",
    resposta:
      "Não exibimos anúncios de terceiros dentro do Kambada Play. Em alguns jogos há um link para a loja da Kambada, onde ficam as peças com as mesmas artes.",
  },
  {
    pergunta: "Funciona no celular?",
    resposta:
      "Sim. O Kambada Play abre no navegador do celular, do tablet e do computador, e dá para colocar o ícone na tela do celular como um aplicativo.",
  },
  {
    pergunta: "Dá para usar na escola?",
    resposta:
      "Dá. Há um portal para escolas, com perfis de aluno, professor e coordenação. O pedido de demonstração é feito pela página de planos.",
  },
];

/**
 * Apresentação pública do Kambada Play (17/11/2026). É para onde vai quem pede
 * /kambadaplay sem conta (ver src/proxy.ts): antes caía direto no quiz, sem
 * saber o que era o Play. Só cita o que existe no código; sem preço, sem idade
 * (o projeto não declara faixa etária) e sem promessa de conteúdo futuro.
 */
export default function ConhecaPage() {
  const url = new URL("/kambadaplay/conheca", SITE.url).toString();
  const dadosEstruturados = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Kambada Play",
      url,
      description: DESCRICAO,
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      browserRequirements: "Requer navegador com JavaScript",
      inLanguage: "pt-BR",
      image: new URL(IMAGEM_OG_PLAY.url, SITE.url).toString(),
      publisher: { "@type": "Organization", name: SITE.razaoSocial, url: SITE.url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: PERGUNTAS.map((q) => ({
        "@type": "Question",
        name: q.pergunta,
        acceptedAnswer: { "@type": "Answer", text: q.resposta },
      })),
    },
  ];

  return (
    <div className="play-tema-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />

      {/* Abertura: segue o tema (20/11/2026). Era escura nos dois temas, e no modo claro
          parecia defeito: página clara com uma faixa preta no topo. */}
      <header className="border-b border-borda bg-superficie text-texto">
        <Bandeirinhas contorno className="mx-auto block h-8 w-full max-w-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-6 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pb-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-texto-tenue">Kambada Play</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-balance sm:text-5xl">
              Jogos, quadrinhos e animação da cultura do Maranhão para crianças
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
              Éguas! Aqui o Bumba Meu Boi, o tambor de crioula e as histórias de São Luís viram brincadeira, feita
              por artistas maranhenses.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={JOGAR} className={BOTAO_AMARELO}>
                Jogar agora
              </Link>
              <a href={CRIAR} className={BOTAO_CONTORNO_GRANDE}>
                Criar conta
              </a>
            </div>
            <p className="mt-4 text-sm text-texto-suave">
              Já tem conta?{" "}
              <a
                href="/kambadaplay/entrar"
                className={LINK}
              >
                Entrar
              </a>
            </p>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border-2 border-kambada-amarelo">
            <Image
              src={IMAGEM_OG_PLAY.url}
              alt={IMAGEM_OG_PLAY.alt}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section aria-labelledby="o-que-tem">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">O que tem aqui</p>
          <h2 id="o-que-tem" className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
            Brincadeira com a <span className="destaque">nossa cara</span>
          </h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {O_QUE_TEM.map((item) => (
              <li key={item.titulo} className="overflow-hidden rounded-2xl border-2 border-borda bg-superficie">
                <div className="relative aspect-[4/3] bg-kambada-preto">
                  <Image
                    src={item.imagem}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-kambada-amarelo px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-kambada-grafite">
                    {item.selo}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-extrabold leading-snug text-texto">{item.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">{item.texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-texto-suave">
            Tem também o <strong className="text-texto">Monte sua matraca</strong>, para escolher o tamanho e a
            estampa e ver como ela fica.
          </p>
        </section>

        <section aria-labelledby="como-funciona" className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Como funciona</p>
          <h2 id="como-funciona" className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
            Três passos
          </h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="rounded-2xl border-2 border-borda bg-superficie p-5">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-full bg-kambada-amarelo font-display text-xl font-extrabold text-kambada-grafite"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-texto">{p.titulo}</h3>
                <p className="mt-2 leading-relaxed text-texto-suave">{p.texto}</p>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={JOGAR} className={BOTAO_AMARELO}>
              Jogar agora
            </Link>
            <a href={CRIAR} className={BOTAO_CONTORNO}>
              Criar conta
            </a>
          </div>
        </section>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="familia" className="rounded-2xl border-2 border-borda bg-superficie p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Para a família</p>
            <h2 id="familia" className="mt-2 font-display text-2xl font-extrabold leading-tight text-texto sm:text-3xl">
              O que a criança faz aqui
            </h2>
            <ul className="mt-5 space-y-3 leading-relaxed text-texto-suave">
              <li>Joga, lê quadrinhos e cordel e assiste à animação, tudo sobre a cultura do Maranhão.</li>
              <li>Aparece no ranking só com um apelido. O nome e o e-mail da conta nunca são mostrados.</li>
              <li>Não conversa com outras pessoas e não envia foto, áudio nem arquivo.</li>
              <li>Não vê anúncios de terceiros. Alguns jogos têm link para a loja da Kambada.</li>
              <li>Quem cria e cuida da conta é o adulto responsável.</li>
            </ul>
            <p className="mt-5">
              <Link href="/privacidade" className={LINK}>
                Ler a Política de Privacidade
              </Link>
            </p>
          </section>

          <section aria-labelledby="escolas" className="rounded-2xl border-2 border-borda bg-superficie p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Para escolas</p>
            <h2 id="escolas" className="mt-2 font-display text-2xl font-extrabold leading-tight text-texto sm:text-3xl">
              A cultura do Maranhão na sala de aula
            </h2>
            <p className="mt-5 leading-relaxed text-texto-suave">
              A escola tem um portal próprio, com perfis de aluno, professor e coordenação, para a Educação Infantil
              e o Ensino Fundamental. O aluno entra sem e-mail.
            </p>
            <p className="mt-5">
              <Link href="/kambadaplay/planos#escolas" className={BOTAO_CONTORNO}>
                Ver o Kambada Play para escolas
              </Link>
            </p>
          </section>
        </div>

        <section aria-labelledby="quem-faz" className="mt-16 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Quem faz</p>
          <h2 id="quem-faz" className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
            Feito em São Luís
          </h2>
          <p className="mt-5 leading-relaxed text-texto-suave">
            O Kambada Play é da <strong className="text-texto">Kambada</strong>, marca maranhense que celebra o Bumba
            Meu Boi, o reggae e as tradições da Ilha.{" "}
            <Link href="/sobre" className={LINK}>
              Conhecer a Kambada
            </Link>
          </p>
          <ul className="mt-5 space-y-2 text-texto-suave">
            {HQS.map((hq) => (
              <li key={hq.slug}>
                <strong className="text-texto">{hq.titulo}</strong>
                <br />
                {hq.autoria}
              </li>
            ))}
            <li>
              <strong className="text-texto">Animação A Hora dos Guarás</strong>
              <br />
              Dublagem: Alexandre Serra (Kambadinha) e Filipe Serra (Guará)
            </li>
          </ul>
          <p className="mt-6">
            <a
              href={URL_FAPEMA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-xl border-2 border-borda-campo px-4 py-2 text-sm font-semibold text-texto"
            >
              Projeto apoiado pela FAPEMA · Governo do Maranhão (MARAinTech)
            </a>
          </p>
        </section>

        <section aria-labelledby="perguntas" className="mt-16 max-w-3xl">
          <h2 id="perguntas" className="font-display text-2xl font-extrabold text-texto sm:text-3xl">
            Perguntas frequentes
          </h2>
          <dl className="mt-6 divide-y divide-borda">
            {PERGUNTAS.map((q) => (
              <div key={q.pergunta} className="py-5">
                <dt className="font-display text-lg font-bold text-texto">{q.pergunta}</dt>
                <dd className="mt-2 leading-relaxed text-texto-suave">{q.resposta}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/kambadaplay/planos" className={LINK}>
              Ver os planos
            </Link>
            <Link href="/kambadaplay/instalar" className={LINK}>
              Como instalar no celular
            </Link>
          </p>
        </section>

        <section className="mt-16 rounded-2xl bg-kambada-amarelo p-6 text-kambada-grafite sm:p-10">
          <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">Bora brincar?</h2>
          <p className="mt-2 max-w-xl text-lg">Comece pelo quiz, sem cadastro. Se gostar, crie a conta e libere o resto.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={JOGAR}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-kambada-grafite px-8 py-3 text-lg font-bold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Jogar agora
            </Link>
            <a
              href={CRIAR}
              className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-kambada-grafite px-8 py-3 text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-grafite hover:text-kambada-amarelo"
            >
              Criar conta
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
