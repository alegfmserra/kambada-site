import { connection } from "next/server";
import { Folha } from "@/components/escola/concurso/Folha";
import { escolaPublica } from "@/lib/escola/servico";

export const metadata = { title: "Folha de redação" };

/**
 * Modelo em branco da folha de redação (sem turma), sem login: não tem dado
 * de ninguém, só a proposta e as linhas. `?etapa=f2` traz a proposta do
 * Fundamental II. É também a fonte do PDF que fica na pasta da temporada.
 */
export default async function FolhaModelo({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  await connection();
  const { etapa } = await searchParams;
  const escola = await escolaPublica();
  return <Folha escola={escola.nome} etapa={etapa === "f2" ? "f2" : "f1"} />;
}
