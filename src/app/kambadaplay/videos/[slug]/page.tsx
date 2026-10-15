import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VIDEOS, arquivoDoVideo, capaDoVideo, videoPorSlug } from "@/content/play/videos";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VIDEOS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const v = videoPorSlug(slug);
  return v ? { title: v.titulo, description: v.descricao } : {};
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  const v = videoPorSlug(slug);
  if (!v) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/kambadaplay"
        className="text-sm font-semibold text-kambada-amarelo hover:underline"
      >
        ← Kambada Play
      </Link>
      <div className="mt-5 overflow-hidden rounded-xl bg-kambada-preto">
        <video
          controls
          playsInline
          preload="metadata"
          poster={capaDoVideo(v)}
          className="aspect-video w-full"
        >
          <source src={arquivoDoVideo(v)} type="video/mp4" />
          Seu navegador não toca este vídeo.
        </video>
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-kambada-amarelo">
        Animação · {v.duracao}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-kambada-branco sm:text-4xl">
        {v.titulo}
        {v.provisorio ? (
          <span className="ml-3 align-middle rounded-full bg-kambada-branco/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-kambada-branco">
            título de teste
          </span>
        ) : null}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-kambada-branco/80">{v.descricao}</p>
    </div>
  );
}
