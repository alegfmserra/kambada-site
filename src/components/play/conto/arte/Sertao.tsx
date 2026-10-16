type ArteProps = { className?: string };

/** Serra ao fundo: cadeia de morros em silhueta com hachura seguindo a encosta. */
export function SertaoSerra({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 800 260" className={className} aria-hidden preserveAspectRatio="none">
      <path
        fill="currentColor"
        d="M0 260 L0 170 L70 120 L130 150 L210 70 L290 140 L360 100 L450 160 L540 60 L620 130 L700 90 L800 150 L800 260 Z"
      />
      <g stroke="currentColor" strokeWidth="4">
        <line x1="180" y1="102" x2="230" y2="152" />
        <line x1="196" y1="90" x2="252" y2="146" />
        <line x1="212" y1="80" x2="272" y2="140" />
        <line x1="510" y1="94" x2="556" y2="140" />
        <line x1="526" y1="80" x2="578" y2="132" />
        <line x1="542" y1="66" x2="600" y2="124" />
        <line x1="40" y1="152" x2="86" y2="188" />
        <line x1="58" y1="140" x2="106" y2="178" />
        <line x1="660" y1="112" x2="704" y2="150" />
        <line x1="678" y1="102" x2="722" y2="140" />
      </g>
    </svg>
  );
}

/** Casinha de sertão com mandacaru ao lado, telhado hachurado. */
export function SertaoCasa({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 300 220" className={className} aria-hidden>
      {/* Corpo da casa */}
      <path fill="currentColor" d="M60 110 L200 108 L202 200 L58 202 Z" />
      {/* Telhado */}
      <path fill="currentColor" d="M46 112 L130 58 L214 110 Z" />
      <g stroke="currentColor" strokeWidth="3.5">
        <line x1="96" y1="86" x2="112" y2="110" />
        <line x1="118" y1="72" x2="138" y2="108" />
        <line x1="140" y1="66" x2="164" y2="108" />
        <line x1="158" y1="76" x2="184" y2="110" />
      </g>
      {/* Porta e janela vazadas no preto */}
      <path fill="var(--color-kambada-papel)" d="M112 200 L114 142 L146 141 L147 200 Z" />
      <rect x="164" y="132" width="24" height="24" fill="var(--color-kambada-papel)" />
      {/* Mandacaru */}
      <path
        fill="currentColor"
        d="M244 202 L243 96 C243 84 259 84 259 96 L258 132 L272 131 C280 131 280 118 272 118 L268 118 L268 104 C268 92 284 92 284 104 L284 130 C284 140 277 144 268 144 L258 145 L259 202 Z"
      />
      <path
        fill="currentColor"
        d="M243 150 L230 149 C222 149 222 136 230 136 L233 136 L233 124 C233 112 218 112 218 124 L218 148 C218 158 226 162 234 162 L243 163 Z"
      />
      {/* Chão */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="20" y1="206" x2="290" y2="204" />
        <line x1="42" y1="214" x2="120" y2="213" />
        <line x1="180" y1="214" x2="262" y2="213" />
      </g>
    </svg>
  );
}

/** Moitas de mato rasteiro do primeiro plano. */
export function SertaoMato({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 800 120" className={className} aria-hidden preserveAspectRatio="none">
      <g stroke="currentColor" strokeWidth="5">
        <path d="M40 116 C38 84 30 70 18 58" fill="none" />
        <path d="M52 116 C54 78 62 64 74 52" fill="none" />
        <path d="M46 116 C46 88 46 72 44 40" fill="none" />
        <path d="M240 118 C236 92 228 80 214 70" fill="none" />
        <path d="M252 118 C256 86 266 72 280 62" fill="none" />
        <path d="M246 118 C246 92 248 74 246 52" fill="none" />
        <path d="M470 116 C466 88 458 76 446 64" fill="none" />
        <path d="M482 116 C486 82 494 68 508 58" fill="none" />
        <path d="M476 116 C476 90 476 70 474 46" fill="none" />
        <path d="M690 118 C686 94 678 82 666 74" fill="none" />
        <path d="M702 118 C706 88 714 76 726 66" fill="none" />
        <path d="M696 118 C696 94 698 76 696 56" fill="none" />
      </g>
      <g stroke="currentColor" strokeWidth="4">
        <line x1="110" y1="112" x2="150" y2="110" />
        <line x1="330" y1="112" x2="392" y2="110" />
        <line x1="560" y1="112" x2="620" y2="110" />
      </g>
    </svg>
  );
}

/** Lua cheia hachurada cercada de estrelas de quatro pontas. */
export function SertaoLua({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 260 200" className={className} aria-hidden>
      <circle cx="130" cy="96" r="54" fill="none" stroke="currentColor" strokeWidth="6" />
      <g stroke="currentColor" strokeWidth="3">
        <line x1="94" y1="70" x2="166" y2="122" />
        <line x1="100" y1="58" x2="176" y2="112" />
        <line x1="112" y1="50" x2="182" y2="100" />
        <line x1="88" y1="84" x2="154" y2="132" />
        <line x1="88" y1="100" x2="140" y2="140" />
      </g>
      <g fill="currentColor">
        <path className="anim-piscar" d="M34 40 L38 30 L42 40 L52 44 L42 48 L38 58 L34 48 L24 44 Z" />
        <path
          className="anim-piscar"
          style={{ animationDelay: "0.9s" }}
          d="M216 62 L220 52 L224 62 L234 66 L224 70 L220 80 L216 70 L206 66 Z"
        />
        <path
          className="anim-piscar"
          style={{ animationDelay: "1.7s" }}
          d="M196 150 L199 142 L202 150 L210 153 L202 156 L199 164 L196 156 L188 153 Z"
        />
        <path
          className="anim-piscar"
          style={{ animationDelay: "0.4s" }}
          d="M56 148 L59 140 L62 148 L70 151 L62 154 L59 162 L56 154 L48 151 Z"
        />
      </g>
    </svg>
  );
}
