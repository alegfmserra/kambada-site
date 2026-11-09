import Link from "next/link";
import { notFound } from "next/navigation";
import { FolhaA4, Impresso, RodapeImpresso } from "@/components/escola/imprimir/Impresso";
import { rotaEscola } from "@/lib/escola/host";
import { ASSUNTOS, assuntoPorId } from "@/lib/escola/quizzes";

export const metadata = { title: "Cartas de perguntas" };

const POR_FOLHA = 8;
const LETRAS = ["A", "B", "C"];

/** Posição fixa da resposta certa em cada carta (a mesma em toda impressão). */
function posicao(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h % 3;
}

/**
 * Cartas de perguntas do quiz, para jogar em roda, sem tela: a professora
 * (ou uma criança que já lê) tira uma carta e lê; a turma responde. As
 * respostas ficam na última folha.
 */
export default async function CartasParaImprimir({ params }: { params: Promise<{ assunto: string }> }) {
  const { assunto } = await params;
  const a = assuntoPorId(assunto);
  if (!a) notFound();
  const cartas = a.banco.map((q, i) => {
    const certa = posicao(q.pergunta);
    const opcoes = [...q.erradas];
    opcoes.splice(certa, 0, q.certa);
    return { n: i + 1, pergunta: q.pergunta, opcoes, certa, explica: q.explica };
  });
  const folhas = Array.from({ length: Math.ceil(cartas.length / POR_FOLHA) }, (_, i) => cartas.slice(i * POR_FOLHA, (i + 1) * POR_FOLHA));

  return (
    <Impresso titulo={`Cartas de perguntas: ${a.emoji} ${a.titulo}`} dica={`${cartas.length} cartas, ${POR_FOLHA} por folha, e as respostas na última folha. Recorte e jogue em roda: quem acertar fica com a carta.`}>
      <div className="nao-imprime mx-auto flex max-w-3xl flex-wrap gap-2 text-sm">
        {ASSUNTOS.map((x) => (
          <Link key={x.id} href={rotaEscola(`/imprimir/cartas/${x.id}`)} className={`rounded-full px-3 py-1.5 font-bold ${x.id === a.id ? "bg-kambada-amarelo text-kambada-grafite" : "border-2 border-borda"}`}>
            {x.emoji} {x.titulo}
          </Link>
        ))}
      </div>

      {folhas.map((f, k) => (
        <FolhaA4 key={k}>
          <div className="grid flex-1 grid-cols-2 grid-rows-4 gap-[3mm]">
            {f.map((c) => (
              <div key={c.n} className="flex flex-col rounded-lg border-2 border-dashed border-neutral-600 p-3">
                <p className="flex justify-between text-[8pt] font-bold uppercase tracking-wider text-neutral-600">
                  <span>{a.emoji} {a.titulo}</span>
                  <span>nº {c.n}</span>
                </p>
                <p className="mt-1 flex-1 text-[11pt] font-bold leading-snug">{c.pergunta}</p>
                <ul className="mt-1 space-y-0.5 text-[10pt]">
                  {c.opcoes.map((o, j) => (
                    <li key={o}>
                      <b>{LETRAS[j]})</b> {o}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <RodapeImpresso />
        </FolhaA4>
      ))}

      <FolhaA4 className="gap-2">
        <p className="font-display text-[18pt] font-extrabold">Respostas · {a.titulo}</p>
        <ol className="columns-2 gap-6 text-[9pt]">
          {cartas.map((c) => (
            <li key={c.n} className="mb-1 break-inside-avoid">
              <b>
                {c.n}. {LETRAS[c.certa]}) {c.opcoes[c.certa]}
              </b>{" "}
              <span className="text-neutral-600">{c.explica}</span>
            </li>
          ))}
        </ol>
        <RodapeImpresso />
      </FolhaA4>
    </Impresso>
  );
}
