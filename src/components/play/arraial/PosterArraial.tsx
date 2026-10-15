import { POSTER_INLINE } from "./posterInline";

/**
 * Pôster estático da praça: render real da cena 3D (gerado por
 * docs/evidencias/gauntlet-arraial-3d/tools/gerar-poster.mjs), usado como
 * fundo do splash (LCP da rota) e como imagem do fallback sem WebGL. Em
 * telas estreitas a imagem vai inline (data URI) e pinta no primeiro frame;
 * em telas largas entra o arquivo de 1600 px.
 */
export function PosterArraial({
  className = "",
  posicao = "absolute",
}: {
  className?: string;
  /** `absolute` dentro do splash; `fixed` quando é o fundo da tela inteira (fallback). */
  posicao?: "absolute" | "fixed";
}) {
  return (
    // Margem de 6px: uma imagem que cobre o viewport inteiro é tratada pelo
    // navegador como fundo e deixa de contar como LCP.
    <div className={`${posicao} inset-1.5 bg-kambada-noite ${className}`} aria-hidden>
      <picture>
        <source media="(min-width: 900px)" srcSet="/play/images/arraial/poster.webp" type="image/webp" />
        <img src={POSTER_INLINE} alt="" fetchPriority="high" decoding="sync" className="h-full w-full object-cover" />
      </picture>
    </div>
  );
}
