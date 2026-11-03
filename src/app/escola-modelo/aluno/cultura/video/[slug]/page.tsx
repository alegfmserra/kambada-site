import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoCultura } from "@/components/escola/cultura/VideoCultura";
import { Etiqueta } from "@/components/escola/Marca";
import { DIDATICA, atividadePorSlug } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Animação" };

/** Animação do Kambada Play na área do aluno, com a brincadeira "O que você viu?". */
export default async function VideoDoAluno({ params }: { params: Promise<{ slug: string }> }) {
  await exigir("aluno");
  const { slug } = await params;
  const v = atividadePorSlug("animacao", slug);
  if (!v || !DIDATICA[v.id]) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div>
        <Etiqueta>Animação</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{v.titulo}</h1>
        <p className="mt-1 text-sm text-texto-suave">{v.resumo}</p>
      </div>
      <VideoCultura video={v} didatica={DIDATICA[v.id]} />
    </div>
  );
}
