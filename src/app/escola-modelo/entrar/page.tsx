import Link from "next/link";
import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";
import { EntrarAluno } from "@/components/escola/EntrarAluno";
import { Etiqueta, FalaKambadinha } from "@/components/escola/Marca";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";

export const metadata = { title: "Entrar (aluno)" };

export default async function EntrarAlunoPagina({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  const { turma } = await searchParams;
  return (
    <div className="py-4">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Etiqueta>Sou aluno</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">Entrar para <span className="destaque">jogar</span></h1>
        <FalaKambadinha>O código está no teu cartão. Depois é só achar o teu apelido!</FalaKambadinha>
      </div>
      <EntrarAluno codigoInicial={typeof turma === "string" ? turma.slice(0, 4) : undefined} />
      <p className="mt-8 text-center text-sm text-texto-suave">
        Tem usuário e senha?{" "}
        <Link href={rotaEscola("/equipe")} className="font-semibold underline">
          Entrar com usuário e senha
        </Link>
      </p>
    </div>
  );
}
