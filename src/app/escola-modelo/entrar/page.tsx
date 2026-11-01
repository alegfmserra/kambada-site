import { redirect } from "next/navigation";
import { EntrarAluno } from "@/components/escola/EntrarAluno";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";

export const metadata = { title: "Entrar (aluno)" };

export default async function EntrarAlunoPagina({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  const { turma } = await searchParams;
  return (
    <div className="py-4">
      <h1 className="mb-6 text-center font-display text-3xl font-extrabold">Entrar para jogar 🎒</h1>
      <EntrarAluno codigoInicial={typeof turma === "string" ? turma.slice(0, 4) : undefined} />
    </div>
  );
}
