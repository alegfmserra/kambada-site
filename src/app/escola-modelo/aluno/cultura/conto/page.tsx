import Link from "next/link";
import { ContoScroll } from "@/components/play/conto/ContoScroll";
import { SplashKambada } from "@/components/play/SplashKambada";
import { Perguntas, Saber } from "@/components/escola/cultura/Perguntas";
import { DIDATICA } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import "@/components/play/conto/conto.css";

export const metadata = { title: "O Auto do Boi" };

/**
 * O cordel animado do Kambada Play ("O Auto do Boi", xilogravura que anda
 * com a rolagem) dentro da área do aluno, e depois dele a conversa sobre a
 * história. Os botões do fim do folheto levam ao Arraial e à área de cultura
 * (ver /escola-modelo/arraial e /matraca).
 */
export default async function ContoDoAluno() {
  await exigir("aluno");
  const d = DIDATICA["conto-boi"];
  return (
    <div className="space-y-8">
      <Link href={rotaEscola("/aluno/cultura")} className="text-sm font-semibold underline">
        ← Cultura do Maranhão
      </Link>
      <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl">
        <SplashKambada tema="papel" rota="conto-escola">
          <ContoScroll />
        </SplashKambada>
      </div>
      <div className="mx-auto max-w-2xl space-y-6">
        <Perguntas atividade="conto-boi" perguntas={d.perguntas} titulo="E aí, o que aconteceu no cordel?" />
        <Saber vocesabia={d.vocesabia} glossario={d.glossario} />
      </div>
    </div>
  );
}
