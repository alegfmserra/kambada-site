type ArteProps = { className?: string };

/**
 * O boi caído no chão, pernas dobradas e cabeça pousada.
 * Cena invertida: o traço herda currentColor (amarelo sobre a noite).
 */
export function MorteBoiCaido({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6">
        {/* Corpo deitado */}
        <path d="M80 176 C86 132 150 108 240 110 C310 112 356 128 366 156 C372 172 364 184 348 188 L110 194 C92 194 78 188 80 176 Z" />
        {/* Cabeça pousada no chão */}
        <path d="M356 160 C384 152 408 160 416 178 C422 192 414 204 398 206 L352 206" />
        {/* Chifres */}
        <path d="M380 156 C378 140 386 128 400 122" />
        <path d="M402 158 C406 144 416 136 428 134" />
        {/* Pernas dobradas sob o corpo */}
        <path d="M140 194 C136 206 144 214 158 212" />
        <path d="M260 192 C256 204 264 212 278 210" />
      </g>
      {/* Olho fechado: um traço só */}
      <path d="M392 178 L410 180" stroke="currentColor" strokeWidth="5" fill="none" />
      {/* Hachura do volume do corpo */}
      <g stroke="currentColor" strokeWidth="3">
        <line x1="150" y1="126" x2="176" y2="188" />
        <line x1="184" y1="118" x2="210" y2="188" />
        <line x1="218" y1="114" x2="240" y2="188" />
        <line x1="252" y1="114" x2="272" y2="186" />
        <line x1="286" y1="118" x2="304" y2="184" />
      </g>
      {/* Chão duro do sertão */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="40" y1="216" x2="430" y2="214" />
        <line x1="90" y1="228" x2="210" y2="227" />
        <line x1="270" y1="227" x2="390" y2="226" />
      </g>
    </svg>
  );
}

/** Nuvens pesadas de luto, hachuradas por dentro. */
export function MorteNuvens({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 700 200" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6">
        <path d="M70 120 C50 120 44 96 62 86 C58 62 92 50 108 66 C118 46 156 50 160 74 C182 70 194 96 178 110 C176 120 160 124 150 120 Z" />
        <path d="M420 96 C398 96 392 70 412 60 C408 36 444 24 462 40 C472 20 512 24 516 50 C540 46 552 72 534 88 C532 98 514 102 504 96 Z" />
        <path d="M600 150 C586 150 582 132 594 126 C592 110 616 102 626 112 C634 98 660 102 662 118 C678 116 686 134 674 144 Z" />
      </g>
      <g stroke="currentColor" strokeWidth="3">
        <line x1="80" y1="94" x2="120" y2="112" />
        <line x1="96" y1="80" x2="146" y2="104" />
        <line x1="430" y1="68" x2="478" y2="88" />
        <line x1="448" y1="52" x2="500" y2="78" />
        <line x1="606" y1="126" x2="644" y2="140" />
      </g>
    </svg>
  );
}
