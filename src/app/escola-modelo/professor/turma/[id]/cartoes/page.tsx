import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BotaoImprimir } from "@/components/escola/BotaoImprimir";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola, alunosDaTurma, escolaPublica } from "@/lib/escola/servico";
import { FIGURAS } from "@/lib/escola/tipos";

export const metadata = { title: "Cartões de acesso" };

/** Cartões para recortar: endereço, código da turma, apelido e as 3 figuras. Folha A4, 8 por página. */
export default async function CartoesPagina({ params }: { params: Promise<{ id: string }> }) {
  const { membro } = await exigir("professor", "coordenacao");
  const { id } = await params;
  let dados;
  try {
    dados = await alunosDaTurma(membro, id);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const escola = await escolaPublica();
  const host = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host") ?? "";
  const endereco = `${host}${rotaEscola("/entrar")}`;

  return (
    <div>
      <style>{`@media print { .escola-root > header, .escola-root > footer, .escola-root > p, .nao-imprime { display:none!important } .escola-root > div { padding:0!important; max-width:none!important } @page { size: A4; margin: 10mm } }`}</style>
      <div className="nao-imprime mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Cartões do {dados.turma.nome}</h1>
          <p className="text-sm text-texto-suave">Recorte e entregue a cada aluno. Perdeu o cartão? “Novas figuras” na lista de alunos.</p>
        </div>
        <BotaoImprimir />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
        {dados.alunos.map((a) => (
          <div key={a.id} className="break-inside-avoid rounded-2xl border-2 border-dashed border-kambada-grafite/40 bg-white p-4 text-kambada-grafite">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">
                <span className="mr-1 rounded px-1.5 py-0.5 text-white" style={{ background: escola.cor }}>{escola.sigla}</span>
                {escola.nome}
              </span>
              <span className="font-semibold text-kambada-cinza">Kambada Play</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-4xl">{a.avatar}</span>
              <div>
                <p className="font-display text-xl font-extrabold">{a.apelido}</p>
                <p className="text-xs">{dados.turma.nome} · código <b className="tracking-widest">{dados.turma.codigo}</b></p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-kambada-neblina px-3 py-2">
              <span className="text-xs font-semibold">Minhas figuras, nesta ordem:</span>
              <span className="text-3xl tracking-[0.3em]">{a.figuras.map((f) => FIGURAS[f]).join("")}</span>
            </div>
            <p className="mt-2 text-[11px] text-kambada-cinza">Entre em {endereco}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
