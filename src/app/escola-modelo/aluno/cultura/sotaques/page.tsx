import Link from "next/link";
import { Sotaques } from "@/components/escola/cultura/Sotaques";
import { Etiqueta } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Sotaques do Boi" };

export default async function SotaquesPagina() {
  await exigir("aluno");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div>
        <Etiqueta>Jogo · Música do boi</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">🥁 Sotaques do Boi</h1>
        <p className="mt-1 text-sm text-texto-suave">Cada jeito de brincar o boi tem seus instrumentos e seu ritmo: é o sotaque. Liga o som! 🔊</p>
      </div>
      <Sotaques />
    </div>
  );
}
