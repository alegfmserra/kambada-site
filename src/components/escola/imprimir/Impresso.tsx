import Link from "next/link";
import { BotaoImprimir } from "@/components/escola/BotaoImprimir";
import { rotaEscola } from "@/lib/escola/host";

/**
 * Molde dos materiais "fora da tela": folhas A4 que a professora imprime.
 * Na tela, cada página aparece como uma folha; na impressão, some o
 * cabeçalho do portal e cada `.folha-a4` vira uma página.
 */
export function Impresso({ titulo, dica, paisagem = false, children }: { titulo: string; dica: string; paisagem?: boolean; children: React.ReactNode }) {
  return (
    <div className="impresso">
      <style>{`
        @media print {
          .escola-root > header, .escola-root > footer, .escola-root > p, .escola-root > div > p, .nao-imprime { display:none!important }
          .escola-root > div, .escola-root main { padding:0!important; max-width:none!important; margin:0!important }
          body { background:#fff!important }
          @page { size: A4 ${paisagem ? "landscape" : "portrait"}; margin: 8mm }
          .folha-a4 { break-after: page; box-shadow:none!important; margin:0 auto!important; border:0!important }
          .folha-a4:last-child { break-after: auto }
        }
        .folha-a4 { width: ${paisagem ? "281mm" : "194mm"}; min-height: ${paisagem ? "194mm" : "281mm"}; }
      `}</style>
      <div className="nao-imprime mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-borda p-4">
        <div>
          <Link href={rotaEscola("/imprimir")} className="text-sm font-semibold underline">← Kit fora da tela</Link>
          <h1 className="font-display text-2xl font-extrabold">{titulo}</h1>
          <p className="text-sm text-texto-suave">{dica}</p>
        </div>
        <BotaoImprimir />
      </div>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

/** Uma folha A4 (branca, preto no branco na impressão). */
export function FolhaA4({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`folha-a4 mx-auto flex flex-col bg-white p-[7mm] text-black shadow-lg ${className}`}>{children}</section>;
}

/** Rodapé comum: marca, apoio e o aviso de conteúdo em revisão. */
export function RodapeImpresso() {
  return (
    <p className="mt-auto border-t border-neutral-300 pt-2 text-center text-[8pt] text-neutral-600">
      Kambada Play · somoskambada.com.br/kambadaplay · projeto apoiado pela FAPEMA · Governo do Maranhão (MARAinTech). Personagens e histórias: criação original inspirada na tradição.
    </p>
  );
}
