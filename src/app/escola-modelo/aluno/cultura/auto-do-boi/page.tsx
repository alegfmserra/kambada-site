import Link from "next/link";
import { AutoDoBoi } from "@/components/escola/cultura/AutoDoBoi";
import { Etiqueta } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "A história do Boi" };

export default async function AutoDoBoiPagina() {
  await exigir("aluno");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div>
        <Etiqueta>Jogo · Bumba-meu-boi</Etiqueta>
        <h1 className="mt-2 font-display text-3xl font-extrabold">🐂 A história do Boi</h1>
        <p className="mt-1 text-sm text-texto-suave">O auto do Bumba-meu-boi é a história que os grupos encenam todo São João. Ponha as cenas na ordem!</p>
      </div>
      <AutoDoBoi />
    </div>
  );
}
