import { redirect } from "next/navigation";
import { EntrarEquipe } from "@/components/escola/EntrarEquipe";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";

export const metadata = { title: "Entrar (professor e coordenação)" };

export default async function EntrarEquipePagina() {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  return (
    <div className="py-4">
      <h1 className="mb-6 text-center font-display text-3xl font-extrabold">Professor e coordenação 🧑‍🏫</h1>
      <EntrarEquipe />
    </div>
  );
}
