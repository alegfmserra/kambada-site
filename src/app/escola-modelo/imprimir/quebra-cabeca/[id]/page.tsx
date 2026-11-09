import Link from "next/link";
import { notFound } from "next/navigation";
import { FolhaA4, Impresso, RodapeImpresso } from "@/components/escola/imprimir/Impresso";
import { quebraPorId } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";

export const metadata = { title: "Quebra-cabeça para imprimir" };

/** Peças: 6 para os pequenos (3 a 5 anos), 12 e 20 para quem já monta mais. */
const GRADES: Record<string, [number, number]> = { "6": [2, 3], "12": [3, 4], "20": [4, 5] };

/**
 * Quebra-cabeça de papel: a imagem do jogo do portal numa folha, com as
 * linhas de corte; a segunda folha é o modelo para olhar enquanto monta.
 * Dica: colar em papelão (caixa de sapato) antes de cortar.
 */
export default async function QuebraParaImprimir({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pecas?: string }> }) {
  const { id } = await params;
  const q = quebraPorId(id);
  if (!q) notFound();
  const pecas = (await searchParams).pecas ?? "6";
  const [a, b] = GRADES[pecas] ?? GRADES["6"];
  const deitada = q.largura > q.altura;
  const [colunas, linhas] = deitada ? [b, a] : [a, b];
  const base = rotaEscola(`/imprimir/quebra-cabeca/${id}`);

  return (
    <Impresso
      paisagem={deitada}
      titulo={`Quebra-cabeça: ${q.titulo}`}
      dica="Imprima colorido, cole num papelão fino e corte nas linhas tracejadas. A segunda folha é o modelo para olhar enquanto monta."
    >
      <div className="nao-imprime mx-auto flex max-w-3xl flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">Peças:</span>
        {Object.keys(GRADES).map((n) => (
          <Link
            key={n}
            href={`${base}?pecas=${n}`}
            className={`rounded-full px-4 py-1.5 font-bold ${n === (GRADES[pecas] ? pecas : "6") ? "bg-kambada-amarelo text-kambada-grafite" : "border-2 border-borda"}`}
          >
            {n} {n === "6" ? "(3 a 5 anos)" : n === "12" ? "(6 a 8 anos)" : "(a partir de 9)"}
          </Link>
        ))}
      </div>

      <FolhaA4 className="items-center justify-center">
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element -- arte do Play, arquivo direto */}
          <img src={q.imagem} alt={q.titulo} className={deitada ? "max-h-[180mm] w-auto" : "max-h-[262mm] w-auto"} />
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${colunas}, 1fr)`, gridTemplateRows: `repeat(${linhas}, 1fr)` }}
            aria-hidden
          >
            {Array.from({ length: colunas * linhas }, (_, i) => (
              <div key={i} className="border border-dashed border-black/70" />
            ))}
          </div>
        </div>
        <p className="mt-2 text-[8pt] text-neutral-600">✂ corte nas linhas tracejadas · {colunas * linhas} peças</p>
      </FolhaA4>

      <FolhaA4 className="items-center gap-4">
        <p className="font-display text-[18pt] font-extrabold">Modelo: {q.titulo}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do Play, arquivo direto */}
        <img src={q.imagem} alt="" className={deitada ? "max-h-[120mm] w-auto" : "max-h-[200mm] w-auto"} />
        <p className="max-w-[150mm] text-center text-[11pt]">{q.legenda}</p>
        <p className="max-w-[150mm] text-center text-[10pt]">
          <b>Para conversar enquanto monta:</b> o que vocês estão vendo? Quem é esse personagem? Onde fica esse lugar em São Luís?
        </p>
        <RodapeImpresso />
      </FolhaA4>
    </Impresso>
  );
}
