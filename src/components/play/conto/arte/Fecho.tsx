type ArteProps = { className?: string };

/** Par de matracas cruzadas, o instrumento que o leitor tem nas mãos. */
export function FechoMatracas({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 320 260" className={className} aria-hidden>
      {/* Matraca da esquerda */}
      <g transform="rotate(-18 120 130)">
        <rect x="70" y="70" width="100" height="58" rx="6" fill="currentColor" />
        <rect x="112" y="128" width="16" height="70" rx="4" fill="currentColor" />
        {/* Veios da madeira vazados */}
        <g stroke="var(--color-kambada-papel)" strokeWidth="3">
          <line x1="82" y1="86" x2="158" y2="84" />
          <line x1="84" y1="112" x2="156" y2="110" />
        </g>
        {/* Boi pintado no tampo */}
        <path
          fill="var(--color-kambada-papel)"
          d="M108 92 L116 88 L126 88 L132 92 L136 98 L132 104 L114 104 L108 98 Z"
        />
      </g>
      {/* Matraca da direita */}
      <g transform="rotate(16 210 128)">
        <rect x="160" y="66" width="100" height="58" rx="6" fill="currentColor" />
        <rect x="202" y="124" width="16" height="70" rx="4" fill="currentColor" />
        <g stroke="var(--color-kambada-papel)" strokeWidth="3">
          <line x1="172" y1="82" x2="248" y2="80" />
          <line x1="174" y1="108" x2="246" y2="106" />
        </g>
        {/* Estrela pintada no tampo */}
        <path
          fill="var(--color-kambada-papel)"
          d="M210 86 L214 96 L224 100 L214 104 L210 114 L206 104 L196 100 L206 96 Z"
        />
      </g>
      {/* Raios do toque seco */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="160" y1="34" x2="160" y2="14" />
        <line x1="128" y1="42" x2="116" y2="24" />
        <line x1="192" y1="42" x2="204" y2="24" />
      </g>
    </svg>
  );
}
