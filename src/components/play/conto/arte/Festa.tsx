type ArteProps = { className?: string };

/** Fila de brincantes dançando com matracas erguidas, saias rodadas. */
export function FestaBrincantes({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 620 260" className={className} aria-hidden>
      {/* Cada brincante: cabeça, corpo de saia rodada e matraca no alto */}
      <g fill="currentColor">
        {/* Brincante 1 */}
        <circle cx="90" cy="78" r="18" />
        <path d="M78 96 C58 130 50 180 62 224 L128 222 C138 178 128 128 104 96 C96 92 84 92 78 96 Z" />
        <path d="M104 100 C120 92 130 76 132 58 L144 62 C142 84 128 104 110 112 Z" />
        <rect x="136" y="42" width="22" height="14" rx="2" />
        {/* Brincante 2, saia no meio do rodado */}
        <circle cx="250" cy="66" r="18" />
        <path d="M236 84 C210 118 202 172 218 218 L292 216 C304 170 292 118 264 84 C256 80 242 80 236 84 Z" />
        <path d="M238 90 C222 84 212 68 210 50 L198 54 C200 76 214 96 232 104 Z" />
        <rect x="182" y="34" width="22" height="14" rx="2" />
        {/* Brincante 3 */}
        <circle cx="410" cy="78" r="18" />
        <path d="M398 96 C378 130 370 180 382 224 L448 222 C458 178 448 128 424 96 C416 92 404 92 398 96 Z" />
        <path d="M424 100 C440 92 450 76 452 58 L464 62 C462 84 448 104 430 112 Z" />
        <rect x="456" y="42" width="22" height="14" rx="2" />
        {/* Brincante 4 */}
        <circle cx="552" cy="70" r="16" />
        <path d="M540 86 C522 118 516 166 526 208 L582 206 C590 166 582 120 560 88 C554 84 544 84 540 86 Z" />
        <path d="M542 92 C528 86 520 72 518 56 L508 60 C510 80 522 98 538 106 Z" />
        <rect x="490" y="42" width="20" height="12" rx="2" />
      </g>
      {/* Barra vazada das saias */}
      <g stroke="var(--color-kambada-papel)" strokeWidth="4">
        <line x1="60" y1="196" x2="130" y2="194" />
        <line x1="216" y1="190" x2="294" y2="188" />
        <line x1="380" y1="196" x2="450" y2="194" />
        <line x1="524" y1="184" x2="584" y2="182" />
      </g>
      {/* Chão de terreiro */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="30" y1="234" x2="590" y2="232" />
      </g>
    </svg>
  );
}

/** Fogueira de São João: toras cruzadas e chamas tremulando. */
export function FestaFogueira({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 240 260" className={className} aria-hidden>
      {/* Chamas */}
      <g className="anim-chama" fill="currentColor">
        <path d="M120 30 C96 76 138 90 118 128 C158 112 158 74 140 52 C138 68 128 70 130 54 C130 44 126 36 120 30 Z" />
        <path d="M92 82 C78 112 100 122 92 146 C116 136 118 112 106 96 C104 106 98 106 100 96 Z" />
        <path d="M154 90 C168 116 150 128 158 148 C136 138 132 116 144 100 C146 110 152 110 150 100 Z" />
      </g>
      {/* Base do fogo */}
      <path fill="currentColor" d="M80 150 C96 168 144 168 160 150 C152 178 88 178 80 150 Z" />
      {/* Toras cruzadas */}
      <g fill="currentColor">
        <path d="M40 220 L188 176 L194 190 L46 234 Z" />
        <path d="M52 176 L200 220 L194 234 L46 190 Z" />
      </g>
      {/* Veios das toras */}
      <g stroke="var(--color-kambada-papel)" strokeWidth="3">
        <line x1="70" y1="214" x2="120" y2="200" />
        <line x1="120" y1="200" x2="170" y2="186" />
        <line x1="78" y1="188" x2="128" y2="202" />
      </g>
      {/* Fagulhas */}
      <g fill="currentColor">
        <circle className="anim-piscar" cx="86" cy="52" r="4" />
        <circle className="anim-piscar" style={{ animationDelay: "0.8s" }} cx="164" cy="44" r="4" />
        <circle className="anim-piscar" style={{ animationDelay: "1.6s" }} cx="140" cy="20" r="3" />
      </g>
    </svg>
  );
}

/** Sanfoneiro sentado no banco, fole aberto em hachura. */
export function FestaSanfoneiro({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 300 260" className={className} aria-hidden>
      <g fill="currentColor">
        {/* Cabeça com chapéu */}
        <circle cx="150" cy="60" r="20" />
        <path d="M118 52 L182 50 C182 42 172 38 164 38 C162 28 138 28 136 40 C126 40 118 44 118 52 Z" />
        {/* Tronco sentado */}
        <path d="M132 82 C120 100 118 130 124 152 L124 176 L112 224 L128 228 L142 184 L160 184 L172 228 L188 224 L176 176 L176 150 C182 128 178 98 166 82 C156 76 140 76 132 82 Z" />
        {/* Banco */}
        <path d="M108 176 L192 174 L192 186 L108 188 Z" />
        <path d="M116 188 L112 232 L122 232 L126 188 Z" />
        <path d="M176 186 L180 230 L190 230 L184 186 Z" />
      </g>
      {/* Sanfona: duas caixas e fole hachurado */}
      <g fill="currentColor">
        <rect x="78" y="112" width="26" height="52" rx="3" />
        <rect x="196" y="108" width="26" height="52" rx="3" />
      </g>
      {/* Fole */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="108" y1="116" x2="108" y2="162" />
        <line x1="122" y1="112" x2="122" y2="166" />
        <line x1="136" y1="116" x2="136" y2="162" />
        <line x1="150" y1="112" x2="150" y2="166" />
        <line x1="164" y1="116" x2="164" y2="162" />
        <line x1="178" y1="112" x2="178" y2="166" />
        <line x1="192" y1="116" x2="192" y2="160" />
      </g>
      {/* Botões da sanfona vazados */}
      <g fill="var(--color-kambada-papel)">
        <circle cx="86" cy="124" r="3" />
        <circle cx="96" cy="124" r="3" />
        <circle cx="86" cy="138" r="3" />
        <circle cx="96" cy="138" r="3" />
        <circle cx="86" cy="152" r="3" />
        <circle cx="96" cy="152" r="3" />
      </g>
      {/* Notas musicais escapando */}
      <g fill="currentColor">
        <path className="anim-flutuar" d="M236 70 L238 44 L252 40 L252 46 L242 49 L242 68 C242 76 230 76 230 70 C230 66 234 64 236 66 Z" />
        <circle className="anim-piscar" cx="262" cy="86" r="4" />
      </g>
    </svg>
  );
}

/** Cordão de bandeirolas recortadas, penduradas num varal que cede no meio. */
export function FestaBandeirolas({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 800 140" className={className} aria-hidden preserveAspectRatio="none">
      <path
        d="M0 18 C200 52 600 52 800 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <g className="anim-balancar" fill="currentColor">
        <path d="M56 28 L104 32 L82 84 Z" />
        <path d="M156 40 L204 42 L182 94 Z" />
        <path d="M256 46 L304 48 L282 100 Z" />
        <path d="M356 50 L404 50 L380 102 Z" />
        <path d="M456 48 L504 46 L482 100 Z" />
        <path d="M556 44 L604 40 L582 94 Z" />
        <path d="M656 36 L704 30 L682 84 Z" />
      </g>
      {/* Recorte vazado de cada bandeirola */}
      <g fill="var(--color-kambada-papel)">
        <circle cx="80" cy="46" r="5" />
        <circle cx="180" cy="56" r="5" />
        <circle cx="280" cy="62" r="5" />
        <circle cx="380" cy="64" r="5" />
        <circle cx="480" cy="62" r="5" />
        <circle cx="580" cy="56" r="5" />
        <circle cx="680" cy="48" r="5" />
      </g>
    </svg>
  );
}
