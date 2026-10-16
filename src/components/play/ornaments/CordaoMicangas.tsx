import { paletaMicanga, acento } from "@/lib/play/cores";

/**
 * Cordão de miçangas como divisor: contas coloridas alternadas enfiadas num
 * fio de tinta, no vocabulário do capelo. Substitui qualquer linha lisa.
 */
export function CordaoMicangas({
  count = 11,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const passo = 26;
  const largura = (count - 1) * passo + 20;
  const meio = 10;
  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${largura} 20`}
      fill="none"
    >
      <line
        x1="0"
        y1={meio}
        x2={largura}
        y2={meio}
        stroke={acento.tinta}
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={10 + i * passo}
          cy={meio}
          r={i % 2 === 0 ? 5 : 3.5}
          fill={paletaMicanga[i % paletaMicanga.length]}
        />
      ))}
    </svg>
  );
}
