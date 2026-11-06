import Link from "next/link";
import { MonteOFofao } from "@/components/escola/cultura/MonteOFofao";
import { Etiqueta } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Monte o Fofão" };

export default async function FofaoPagina() {
  await exigir("aluno");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div>
        <Etiqueta>Jogo · temporada de Carnaval</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">👺 Monte o Fofão</h1>
        <p className="mt-1 text-sm text-texto-suave">O Fofão é o personagem mais popular do carnaval de rua de São Luís. Tu sabe como ele se veste?</p>
      </div>
      <MonteOFofao />
    </div>
  );
}
