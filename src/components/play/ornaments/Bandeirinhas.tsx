import { paletaBandeira as CORES } from "@/lib/play/cores";

/**
 * Varal de bandeirinhas de festa junina.
 * `contorno` (20/11/2026): para fundo claro. O cordão e um fio em volta de cada
 * bandeira saem na cor do texto de quem está em volta; sem isso, o cordão creme
 * e as bandeiras brancas somem no tema claro.
 */
export function Bandeirinhas({ className = "", contorno = false }: { className?: string; contorno?: boolean }) {
  const largura = 36;
  const bandeiras = Array.from({ length: 10 }, (_, i) => {
    const x = i * largura;
    return { x, cor: CORES[i % CORES.length] };
  });

  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 360 34"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M0 3 Q 180 11 360 3" stroke={contorno ? "currentColor" : "#F5EDE0"} strokeWidth="1.5" opacity={contorno ? 0.45 : 0.6} />
      {bandeiras.map(({ x, cor }, i) => (
        <polygon
          key={i}
          points={`${x + 3},${5 + (i % 2)} ${x + largura - 3},${5 + (i % 2)} ${x + largura / 2},${30 + (i % 2) * 2}`}
          fill={cor}
          opacity="0.92"
          {...(contorno ? { stroke: "currentColor", strokeOpacity: 0.3, strokeWidth: 0.75 } : {})}
        />
      ))}
    </svg>
  );
}
