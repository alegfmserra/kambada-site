import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PesquisaAoFim } from "@/components/play/hq/PesquisaAoFim";
import { Revelar } from "@/components/play/hub/Revelar";
import { HQS, hqPorSlug, paginaDaHQ } from "@/content/play/hq";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HQS.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const h = hqPorSlug(slug);
  return h ? { title: h.titulo, description: h.resumo } : {};
}

export default async function HQPage({ params }: Props) {
  const { slug } = await params;
  const h = hqPorSlug(slug);
  if (!h) notFound();

  const paginas = Array.from({ length: h.paginas }, (_, i) => i + 1);

  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Kambada Play
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
          Quadrinhos · {h.paginas} páginas
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          {h.titulo}
        </h1>
        <p className="mt-3 text-sm text-texto-tenue">{h.autoria}</p>

        <ol className="mt-8 space-y-8">
          {paginas.map((n) => (
            <li key={n}>
              <Revelar>
                <Image
                  src={paginaDaHQ(h, n)}
                  alt={`${h.titulo}, página ${n} de ${h.paginas}`}
                  width={1094}
                  height={1547}
                  priority={n === 1}
                  sizes="(min-width: 672px) 42rem, 92vw"
                  className="h-auto w-full rounded-lg border-4 border-kambada-grafite bg-kambada-branco shadow-[8px_8px_0_0_#ffcc29]"
                />
                <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-texto-tenue">
                  Página {n} de {h.paginas}
                </p>
              </Revelar>
            </li>
          ))}
        </ol>
        <PesquisaAoFim />

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/kambadaplay"
            className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
          >
            Voltar ao Kambada Play
          </Link>
        </div>
      </div>
    </div>
  );
}
