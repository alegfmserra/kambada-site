import Link from "next/link";
import { notFound } from "next/navigation";
import { QuebraCabeca } from "@/components/escola/cultura/QuebraCabeca";
import { Etiqueta } from "@/components/escola/Marca";
import { quebraPorId } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { TEMPORADAS } from "@/lib/escola/temporadas";

export const metadata = { title: "Quebra-cabeça" };

export default async function QuebraPagina({ params }: { params: Promise<{ id: string }> }) {
  await exigir("aluno");
  const { id } = await params;
  const q = quebraPorId(id);
  if (!q) notFound();
  const t = TEMPORADAS.find((x) => x.passos.some((p) => p.atividade === q.id));
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={rotaEscola(t ? `/aluno/temporada/${t.id}` : "/aluno/cultura")} className="text-sm font-semibold underline">
        ← {t ? `Trilha da temporada: ${t.titulo}` : "Cultura do Maranhão"}
      </Link>
      <div>
        <Etiqueta>Jogo · quebra-cabeça{t ? ` · ${t.titulo}` : ""}</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">🧩 {q.titulo}</h1>
      </div>
      <QuebraCabeca q={q} />
    </div>
  );
}
