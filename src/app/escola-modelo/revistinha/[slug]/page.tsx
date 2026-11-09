import Link from "next/link";
import { notFound } from "next/navigation";
import { LeitorTV } from "@/components/escola/cultura/LeitorTV";
import { DIDATICA, atividadePorSlug } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";

export const metadata = { title: "Revistinha na TV" };

/**
 * A revistinha para ler na TV da sala: uma página por vez, grande. Embaixo,
 * as perguntas da roda, para a professora puxar a conversa depois. Sem login
 * (mesmo conteúdo aberto do Play).
 */
export default async function RevistinhaNaTV({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hq = atividadePorSlug("hq", slug);
  const d = hq && DIDATICA[hq.id];
  if (!hq || !d) notFound();
  const paginas = Array.from({ length: hq.paginas ?? 1 }, (_, i) => `/kambadaplay/hq/${slug}/${String(i + 1).padStart(2, "0")}.webp`);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={rotaEscola("/imprimir")} className="text-sm font-semibold underline">← Kit fora da tela</Link>
          <h1 className="font-display text-2xl font-extrabold">Kambadinha em: {hq.titulo}</h1>
          <p className="text-sm text-texto-suave">Toque na página, use as setas ou o controle do projetor. ⛶ deixa em tela cheia.</p>
        </div>
        <Link href={rotaEscola(`/imprimir/revistinha/${slug}`)} className="rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo">
          🖨 Imprimir para cada criança
        </Link>
      </div>
      <LeitorTV titulo={hq.titulo} paginas={paginas} />
      <section className="rounded-3xl border-2 border-borda p-5">
        <h2 className="font-display text-xl font-extrabold">🗣️ Depois da leitura, na roda</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          {d.perguntas.map((p) => (
            <li key={p.pergunta}>{p.pergunta}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-texto-suave">💡 {d.vocesabia[0]}</p>
      </section>
    </div>
  );
}
