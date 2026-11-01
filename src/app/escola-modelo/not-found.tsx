import Link from "next/link";
import { FalaKambadinha } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";

/** "Não encontrada" do portal (turma de outro professor, desafio de outra etapa, endereço errado). */
export default function NaoEncontrada() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
      <h1 className="font-display text-3xl font-extrabold">
        Página <span className="destaque">não encontrada</span>
      </h1>
      <FalaKambadinha>Éguas, essa página não existe ou não é do teu acesso.</FalaKambadinha>
      <Link href={rotaEscola()} className="rounded-full bg-kambada-amarelo px-6 py-3 font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
        Voltar ao portal
      </Link>
    </div>
  );
}
