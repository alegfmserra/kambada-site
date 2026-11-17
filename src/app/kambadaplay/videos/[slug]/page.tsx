import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoComConvite } from "@/components/play/VideoComConvite";
import { VIDEOS, arquivoDoVideo, capaDoVideo, legendaDoVideo, videoPorSlug } from "@/content/play/videos";

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
    <div className="play-tema-site">
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/kambadaplay"
        className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline"
      >
        ← Kambada Play
      </Link>
      <div className="mt-5 overflow-hidden rounded-xl bg-kambada-preto">
        <VideoComConvite poster={capaDoVideo(v)} src={arquivoDoVideo(v)} legenda={legendaDoVideo(v)} />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
        Animação · {v.duracao}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-texto sm:text-4xl">
        {v.titulo}
        {v.provisorio ? (
          <span className="ml-3 align-middle rounded-full bg-kambada-branco/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-kambada-branco">
            título de teste
          </span>
        ) : null}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-texto-suave">{v.descricao}</p>
      {v.transcricao?.length ? (
        <details className="mt-6 max-w-2xl rounded-lg border-2 border-borda px-4 py-3 text-texto">
          <summary className="cursor-pointer py-1 text-sm font-bold text-texto">Ler a história</summary>
          <p className="mt-3 text-sm text-texto-suave">
            Tudo o que se fala na animação, na ordem.
            {v.legenda ? " O vídeo também tem legenda: ela liga e desliga no próprio player." : null}
          </p>
          <ul className="mt-3 space-y-2 text-base leading-relaxed">
            {v.transcricao.map((t, i) => (
              <li key={i}>
                {t.quem ? (
                  <>
                    <span className="font-bold">{t.quem}:</span> {t.texto}
                  </>
                ) : (
                  <span className="text-texto-suave">{t.texto}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
    </div>
  );
}
