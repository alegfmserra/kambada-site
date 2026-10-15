type ArteProps = { className?: string };

/** Estrela de quatro pontas, o selo do cordel. Usada na capa e no cordão de progresso. */
export function Estrela4({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="currentColor">
      <path d="M50 2 L59 41 L98 50 L59 59 L50 98 L41 59 L2 50 L41 41 Z" />
    </svg>
  );
}

/** Moldura de folheto: borda dupla irregular com estrelas nos cantos. */
export function CapaMoldura({ className = "" }: ArteProps) {
  return (
    <svg
      viewBox="0 0 390 700"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      preserveAspectRatio="none"
    >
      <path
        d="M18 20 L372 17 L374 340 L371 680 L20 683 L16 350 Z"
        strokeWidth="5"
      />
      <path
        d="M32 34 L358 32 L360 348 L357 666 L34 668 L31 342 Z"
        strokeWidth="2.5"
      />
      {/* Tracinhos de xilogravura entre as duas bordas */}
      <g strokeWidth="2">
        <line x1="60" y1="20" x2="60" y2="34" />
        <line x1="110" y1="19" x2="110" y2="33" />
        <line x1="160" y1="19" x2="160" y2="33" />
        <line x1="210" y1="18" x2="210" y2="32" />
        <line x1="260" y1="18" x2="260" y2="32" />
        <line x1="310" y1="17" x2="310" y2="32" />
        <line x1="60" y1="682" x2="60" y2="668" />
        <line x1="110" y1="682" x2="110" y2="668" />
        <line x1="160" y1="681" x2="160" y2="667" />
        <line x1="210" y1="681" x2="210" y2="667" />
        <line x1="260" y1="680" x2="260" y2="666" />
        <line x1="310" y1="680" x2="310" y2="666" />
      </g>
      {/* Estrelas dos cantos */}
      <g fill="currentColor" stroke="none">
        <path d="M25 27 L29 24 L32 20 L35 24 L39 27 L35 30 L32 34 L29 30 Z" />
        <path d="M351 24 L355 21 L358 17 L361 21 L365 24 L361 27 L358 31 L355 27 Z" />
        <path d="M25 676 L29 673 L32 669 L35 673 L39 676 L35 679 L32 683 L29 679 Z" />
        <path d="M351 673 L355 670 L358 666 L361 670 L365 673 L361 676 L358 680 L355 676 Z" />
      </g>
    </svg>
  );
}

/** Estrela grande da capa com raios hachurados, como carimbo de xilogravura. */
export function CapaEstrela({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {/* Raios em hachura */}
      <g stroke="currentColor" strokeWidth="3">
        <line x1="100" y1="6" x2="100" y2="30" />
        <line x1="100" y1="170" x2="100" y2="194" />
        <line x1="6" y1="100" x2="30" y2="100" />
        <line x1="170" y1="100" x2="194" y2="100" />
        <line x1="34" y1="34" x2="52" y2="52" />
        <line x1="148" y1="148" x2="166" y2="166" />
        <line x1="166" y1="34" x2="148" y2="52" />
        <line x1="52" y1="148" x2="34" y2="166" />
      </g>
      <path
        fill="currentColor"
        d="M100 22 L114 84 L178 100 L114 116 L100 178 L86 116 L22 100 L86 84 Z"
      />
      {/* Miolo vazado, respiro de papel */}
      <circle cx="100" cy="100" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
