import Image from "next/image";

/**
 * Foto inteira, sem barra branca.
 *
 * Decisão do Alexandre (10/10/2026): nenhuma foto do site pode aparecer
 * cortada nem com fundo branco sobrando. A mesma imagem entra duas vezes —
 * atrás, esticada e desfocada como moldura; na frente, inteira. Serve para
 * capa de categoria (21:9), cartão (retrato dentro de um quadrado) e a foto
 * principal da peça. Sem hooks: funciona em componente de servidor.
 */
export default function FotoEmoldurada({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  classeDaFrente = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Classes do contêiner (defina a proporção aqui: aspect-square, aspect-[21/9]…). */
  className?: string;
  /** Classes extras da foto da frente (ex.: zoom no hover). */
  classeDaFrente?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-kambada-grafite ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes="200px"
        className="scale-110 object-cover opacity-70 blur-xl"
      />
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-contain ${classeDaFrente}`}
      />
    </div>
  );
}
