import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import type { Etapa } from "@/lib/escola/tipos";

/**
 * Folha de redação do Kambada Play (A4, preto e branco, frente e verso):
 * espaço para a logo da escola, a proposta da temporada, linhas e o quadro
 * da correção pela grade. O professor imprime, a turma escreve à mão, e o
 * professor anexa a folha no portal para corrigir lá.
 */
export function Folha({ escola, turma, etapa }: { escola: string; turma?: string; etapa: Etapa }) {
  const p = CONCURSO.propostas[etapa];
  const linhas = (n: number) =>
    Array.from({ length: n }, (_, i) => <div key={i} className="h-[8.6mm] border-b border-neutral-400" />);
  return (
    <div className="folha-redacao bg-white text-black">
      <style>{`
        @media print {
          .escola-root > header, .escola-root > footer, .escola-root > p, .nao-imprime { display:none!important }
          .escola-root > div { padding:0!important; max-width:none!important }
          body { background:#fff!important }
          @page { size: A4; margin: 10mm }
          .pagina-folha { break-after: page; box-shadow:none!important; margin:0!important; border:0!important }
        }
        .pagina-folha { width: 190mm; min-height: 277mm; }
      `}</style>

      {/* Frente */}
      <section className="pagina-folha mx-auto mb-8 flex flex-col border border-neutral-300 p-[6mm] shadow-lg">
        <header className="flex items-stretch gap-4 border-b-2 border-black pb-3">
          <div className="grid w-[40mm] shrink-0 place-items-center rounded-md border-2 border-dashed border-neutral-400 text-center text-[9pt] text-neutral-500">
            logo da escola
          </div>
          <div className="flex-1">
            <p className="text-[9pt] font-bold uppercase tracking-[0.18em]">{escola}</p>
            <p className="mt-1 font-display text-[17pt] font-extrabold leading-tight">Concurso de Redação</p>
            <p className="text-[10pt]">
              Temporada de {CONCURSO.temporada} · {CONCURSO.titulo.split(" · ")[1]}
            </p>
          </div>
          <div className="flex w-[34mm] shrink-0 flex-col items-end justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo oficial toda preta (fundo claro) */}
            <img src="/marca/kambada-logo-horizontal-preto.png" alt="Kambada" className="h-auto w-full" />
            <p className="text-[8pt] font-bold">Kambada Play</p>
          </div>
        </header>

        <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-4 text-[10pt]">
          <p>Apelido no Kambada Play: <span className="inline-block w-[45mm] border-b border-black" /></p>
          <p>Turma: {turma ? <b>{turma}</b> : <span className="inline-block w-[22mm] border-b border-black" />}</p>
          <p>Data: ____/____/______</p>
        </div>

        <div className="mt-3 rounded-md border-2 border-black p-3 text-[9.5pt] leading-snug">
          <p className="text-[8pt] font-bold uppercase tracking-wider">Proposta · {p.genero}</p>
          <p className="mt-1 font-semibold">{p.enunciado}</p>
          <p className="mt-1">{p.dicas.join(" ")} Sugestão: de {p.minPalavras} a {p.maxPalavras} palavras.</p>
        </div>

        <p className="mt-4 text-[10pt]">Título: <span className="inline-block w-[150mm] border-b border-black" /></p>
        <div className="mt-2 flex-1">{linhas(etapa === "f1" ? 18 : 17)}</div>

        <footer className="mt-3 grid grid-cols-[1fr_auto] gap-3 border-t-2 border-black pt-2 text-[8pt]">
          <div>
            <p className="font-bold uppercase tracking-wider">Para o professor · correção</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
              {CRITERIOS.map((c) => (
                <li key={c.id}>
                  {c.nome}: {Array.from({ length: NOTA_MAXIMA }, (_, i) => `☐${i + 1}`).join(" ")}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid w-[26mm] place-items-center rounded-md border-2 border-black text-center">
            <span>
              Total
              <br />
              <b className="text-[13pt]">____/{CRITERIOS.length * NOTA_MAXIMA}</b>
            </span>
          </div>
          <p className="col-span-2 text-[7pt] text-neutral-600">
            Kambada Play na escola · projeto apoiado pela FAPEMA · Governo do Maranhão (MARAinTech). Escreva só o apelido: a redação pode representar a escola no concurso entre escolas, onde aparece sem o nome.
          </p>
        </footer>
      </section>

      {/* Verso: continuação */}
      <section className="pagina-folha mx-auto flex flex-col border border-neutral-300 p-[6mm] shadow-lg">
        <p className="border-b-2 border-black pb-2 text-[10pt]">
          <b>Continuação</b> · Apelido: <span className="inline-block w-[50mm] border-b border-black" />
        </p>
        <div className="mt-2 flex-1">{linhas(28)}</div>
        <p className="mt-2 text-right text-[7pt] text-neutral-600">Kambada Play · Concurso de Redação · {CONCURSO.temporada}</p>
      </section>
    </div>
  );
}
