import { redirect } from "next/navigation";
import { EntrarEquipe } from "@/components/escola/EntrarEquipe";
import { Etiqueta } from "@/components/escola/Marca";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";

export const metadata = { title: "Entrar (professor e coordenação)" };

export default async function EntrarEquipePagina() {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  return (
    <div className="py-4">
      <div className="mb-8 space-y-2 text-center">
        <Etiqueta>Equipe da escola</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">Professor e <span className="destaque">coordenação</span></h1>
      </div>
      <EntrarEquipe />
    </div>
  );
}
