import { notFound } from "next/navigation";
import { BotaoImprimir } from "@/components/escola/BotaoImprimir";
import { Folha } from "@/components/escola/concurso/Folha";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola, alunosDaTurma, escolaPublica } from "@/lib/escola/servico";

export const metadata = { title: "Folha de redação" };

/** A folha de redação da turma (já com o nome da escola, a turma e a proposta da etapa), para imprimir. */
export default async function FolhaDaTurma({ params }: { params: Promise<{ id: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  let turma;
  try {
    turma = (await alunosDaTurma(membro, id)).turma;
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const escola = await escolaPublica();
  return (
    <div className="space-y-4">
      <div className="nao-imprime flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-superficie p-4 text-sm">
        <p>
          Imprima <b>frente e verso</b>, uma folha por aluno. Cole ou imprima a logo da escola no quadro tracejado. Para guardar o arquivo: <b>Imprimir</b> → <b>“Salvar como PDF”</b>.
        </p>
        <BotaoImprimir />
      </div>
      <Folha escola={escola.nome} turma={turma.nome} etapa={turma.etapa} />
    </div>
  );
}
