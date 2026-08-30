import type { Metadata } from "next";

/**
 * Cultura. Hoje é a porta do conteúdo editorial da marca; a listagem de posts
 * entra na Fase 4, quando o blog for migrado para MDX.
 * Texto de abertura preservado do site em produção (/cultura-maranhense).
 */

export const metadata: Metadata = {
  title: "Explore a cultura maranhense",
  description:
    "Histórias, tradições e o Maranhão do jeito Kambada: do reggae ao Bumba Meu Boi, do Guaraná Jesus às matracas.",
  alternates: { canonical: "/cultura" },
};

export default function Cultura() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h1 className="max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
          Viva a cultura do{" "}
          <span className="text-kambada-amarelo">Maranhão</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-kambada-branco/80">
          Aqui a gente conta histórias, compartilha tradições e celebra o
          Maranhão do nosso jeito Kambada — leve, autêntico e maranhense que só.
          Do reggae ao Bumba Meu Boi, do Guaraná Jesus às matracas: um espaço
          para valorizar a riqueza cultural do Maranhão, com aquele toque
          especial da Kambada.
        </p>
      </div>
    </section>
  );
}
