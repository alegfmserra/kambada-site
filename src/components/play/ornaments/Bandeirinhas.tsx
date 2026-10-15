import { paletaBandeira as CORES } from "@/lib/play/cores";

/** Varal de bandeirinhas de festa junina. */
export function Bandeirinhas({ className = "" }: { className?: string }) {
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
      <path d="M0 3 Q 180 11 360 3" stroke="#F5EDE0" strokeWidth="1.5" opacity="0.6" />
      {bandeiras.map(({ x, cor }, i) => (
        <polygon
          key={i}
          points={`${x + 3},${5 + (i % 2)} ${x + largura - 3},${5 + (i % 2)} ${x + largura / 2},${30 + (i % 2) * 2}`}
          fill={cor}
          opacity="0.92"
        />
      ))}
    </svg>
  );
}
