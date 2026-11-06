import Link from "next/link";
import { notFound } from "next/navigation";
import { Etiqueta, FalaKambadinha } from "@/components/escola/Marca";
import { Progresso, Trilha } from "@/components/escola/temporada/Trilha";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { trilhaDoAluno } from "@/lib/escola/temporadaServico";
import { temporadaPorId } from "@/lib/escola/temporadas";

export const metadata = { title: "Temporada" };

/** A trilha de uma temporada: assistir, ler, entender, brincar, mostrar o que sabe e escrever. */
export default async function TemporadaDoAluno({ params }: { params: Promise<{ id: string }> }) {
  const { aluno } = await exigir("aluno");
  const { id } = await params;
  const t = temporadaPorId(id);
  if (!t || !t.passos.length) notFound();
  const trilha = await trilhaDoAluno(aluno, t);
  const proximo = trilha.passos.find((p) => p.estado === "aberto");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Todas as temporadas
      </Link>
      <section className="space-y-4 rounded-3xl bg-kambada-grafite p-6 text-white sm:p-8">
        <Etiqueta escuro>Temporada · {t.mes}</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          <span aria-hidden>{t.emoji}</span> <span className="text-kambada-amarelo">{t.titulo}</span>
        </h1>
        <p className="text-white/80">{t.tema}</p>
        <FalaKambadinha escuro>
          {trilha.feitos === trilha.total
            ? "Éguas! Tu fez a temporada inteira. Agora é só esperar o resultado do concurso!"
            : "Assiste, lê, joga e responde. No fim, tu escreve sobre o que aprendeu!"}
        </FalaKambadinha>
        <Progresso trilha={trilha} />
      </section>

      <Trilha trilha={trilha} />

      {proximo?.caminho && (
        <Link href={rotaEscola(proximo.caminho)} className="block rounded-full bg-kambada-amarelo px-6 py-3 text-center text-lg font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
          Continuar: {proximo.titulo} →
        </Link>
      )}
      <p className="text-center text-xs text-texto-suave">A redação tu escreve à mão, em sala, depois da trilha: primeiro tu brinca e aprende, depois mostra o que sabe.</p>
    </div>
  );
}
