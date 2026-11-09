import { notFound } from "next/navigation";
import { FolhaA4, Impresso, RodapeImpresso } from "@/components/escola/imprimir/Impresso";
import { DIDATICA, atividadePorSlug } from "@/lib/escola/cultura";

export const metadata = { title: "Revistinha para imprimir" };

/**
 * A revistinha para imprimir: as páginas da HQ (já em proporção A4) e, no fim,
 * a folha da roda de conversa, com perguntas abertas, o "Você sabia?", as
 * palavras da história, um quadro para desenhar e um recado para a família.
 * Sem login: é o mesmo conteúdo aberto do Play.
 */
export default async function RevistinhaParaImprimir({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hq = atividadePorSlug("hq", slug);
  const d = hq && DIDATICA[hq.id];
  if (!hq || !d) notFound();
  const paginas = Array.from({ length: hq.paginas ?? 1 }, (_, i) => `/kambadaplay/hq/${slug}/${String(i + 1).padStart(2, "0")}.webp`);

  return (
    <Impresso
      titulo={`Revistinha: ${hq.titulo}`}
      dica={`${paginas.length} páginas da história e 1 folha de conversa e desenho. Em casa ou na escola, imprima colorido; dá também para imprimir 2 por folha (A5) e grampear como gibi.`}
    >
      {paginas.map((src, i) => (
        <FolhaA4 key={src} className="items-center justify-center !p-[4mm]">
          {/* eslint-disable-next-line @next/next/no-img-element -- página da HQ, arquivo direto */}
          <img src={src} alt={`${hq.titulo}, página ${i + 1}`} className="max-h-[272mm] w-auto max-w-full object-contain" />
        </FolhaA4>
      ))}

      <FolhaA4 className="gap-[5mm]">
        <header className="flex items-end justify-between border-b-2 border-black pb-2">
          <div>
            <p className="text-[9pt] font-bold uppercase tracking-[0.18em]">Depois da leitura</p>
            <p className="font-display text-[20pt] font-extrabold leading-tight">Roda de conversa</p>
            <p className="text-[10pt]">Kambadinha em: {hq.titulo}</p>
          </div>
          <p className="text-[9pt]">Nome ou apelido: ____________________</p>
        </header>

        <section>
          <p className="text-[11pt] font-bold">Para conversar (a professora ou alguém da família pergunta):</p>
          <ol className="mt-1 list-decimal space-y-1 pl-6 text-[11pt]">
            {d.perguntas.map((p) => (
              <li key={p.pergunta}>{p.pergunta}</li>
            ))}
          </ol>
        </section>

        <section className="grid grid-cols-2 gap-[5mm] text-[9.5pt]">
          <div className="rounded-md border border-neutral-400 p-3">
            <p className="font-bold">💡 Você sabia?</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {d.vocesabia.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-neutral-400 p-3">
            <p className="font-bold">📖 Palavras da história</p>
            <ul className="mt-1 space-y-1">
              {d.glossario.map((g) => (
                <li key={g.termo}>
                  <b>{g.termo}:</b> {g.explica}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-1 flex-col">
          <p className="text-[11pt] font-bold">✏️ Desenhe a parte da história que você mais gostou:</p>
          <div className="mt-2 min-h-[80mm] flex-1 rounded-md border-2 border-dashed border-neutral-500" />
        </section>

        <p className="rounded-md bg-neutral-100 p-3 text-[9.5pt]">
          <b>Para a família:</b> leia a história junto com a criança, deixe ela contar com as próprias palavras e pergunte o que ela já viu disso em São Luís (o mangue, o guará, a festa, o tambor). Conversa vale mais que resposta certa.
        </p>
        <RodapeImpresso />
      </FolhaA4>
    </Impresso>
  );
}
