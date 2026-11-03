import Link from "next/link";
import { notFound } from "next/navigation";
import { LeitorHQ } from "@/components/escola/cultura/LeitorHQ";
import { Etiqueta } from "@/components/escola/Marca";
import { DIDATICA, atividadePorSlug } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Quadrinhos" };

/** HQ do Kambadinha na área do aluno: uma página por vez e, no fim, a conversa sobre a história. */
export default async function HQDoAluno({ params }: { params: Promise<{ slug: string }> }) {
  await exigir("aluno");
  const { slug } = await params;
  const hq = atividadePorSlug("hq", slug);
  if (!hq || !DIDATICA[hq.id]) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div>
        <Etiqueta>Quadrinhos · {hq.paginas} páginas</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Kambadinha em: {hq.titulo}</h1>
        <p className="mt-1 text-sm text-texto-suave">{hq.resumo}</p>
      </div>
      <LeitorHQ hq={hq} didatica={DIDATICA[hq.id]} />
    </div>
  );
}
