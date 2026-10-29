import { listarRespostas, notaDoSite } from "@/lib/pesquisa/pesquisa";

/**
 * Selo "nota do site" (componente de servidor: lê o arquivo da pesquisa).
 *
 * Pesquisa de 29/10/2026: "ver avaliações de quem comprou" foi um dos motivos
 * para levar a peça. Ainda não há avaliação de peça; o que existe, e é
 * verdadeiro, é a nota que os visitantes deram ao site. O texto diz isso.
 * Abaixo de 10 notas, não aparece.
 */
export default async function SeloNotaDoSite({ className = "" }: { className?: string }) {
  const nota = notaDoSite(await listarRespostas());
  if (!nota) return null;
  const media = nota.media.toFixed(1).replace(".", ",");
  return (
    <p className={`inline-flex flex-wrap items-center gap-x-2 text-sm text-texto-suave ${className}`}>
      <span aria-hidden="true" className="text-kambada-amarelo-escuro">
        ★
      </span>
      <span>
        <strong className="font-display text-texto">{media}</strong> de 5 · nota de {nota.notas} visitantes ao site
      </span>
    </p>
  );
}
