type ArteProps = { className?: string };

/**
 * O pajé de cocar erguendo o maracá.
 * Cena invertida: traço em currentColor sobre a noite.
 */
export function MilagrePaje({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 260 340" className={className} aria-hidden>
      <g fill="currentColor">
        {/* Cabeça */}
        <circle cx="130" cy="96" r="24" />
        {/* Corpo com saiote de palha */}
        <path d="M112 122 C98 146 96 186 104 214 L92 320 L114 320 L124 236 L136 236 L146 320 L168 320 L156 212 C164 184 162 144 148 122 C138 116 122 116 112 122 Z" />
        {/* Braço erguido com o maracá */}
        <path d="M146 130 C164 122 176 104 178 84 L192 88 C190 114 174 138 152 146 Z" />
        {/* Braço com a pena benzedora */}
        <path d="M112 132 C96 142 86 158 84 176 L98 180 C100 166 108 154 120 148 Z" />
      </g>
      {/* Cocar em raios */}
      <g stroke="currentColor" strokeWidth="5">
        <line x1="130" y1="70" x2="130" y2="34" />
        <line x1="114" y1="74" x2="102" y2="42" />
        <line x1="146" y1="74" x2="158" y2="42" />
        <line x1="102" y1="84" x2="76" y2="62" />
        <line x1="158" y1="84" x2="184" y2="62" />
      </g>
      {/* Pontas de pena do cocar */}
      <g fill="currentColor">
        <circle cx="130" cy="30" r="6" />
        <circle cx="100" cy="38" r="5" />
        <circle cx="160" cy="38" r="5" />
        <circle cx="72" cy="58" r="5" />
        <circle cx="188" cy="58" r="5" />
      </g>
      {/* Maracá */}
      <g>
        <circle cx="200" cy="70" r="16" fill="currentColor" />
        <line x1="194" y1="84" x2="190" y2="94" stroke="currentColor" strokeWidth="6" />
        {/* Sementes vazadas na cabaça */}
        <g fill="var(--color-kambada-noite)">
          <circle cx="196" cy="66" r="2.5" />
          <circle cx="204" cy="72" r="2.5" />
          <circle cx="200" cy="60" r="2" />
        </g>
      </g>
      {/* Saiote de palha em hachura */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="100" y1="216" x2="94" y2="244" />
        <line x1="116" y1="220" x2="112" y2="248" />
        <line x1="132" y1="222" x2="132" y2="250" />
        <line x1="148" y1="220" x2="152" y2="248" />
        <line x1="162" y1="216" x2="168" y2="244" />
      </g>
      {/* Chão */}
      <line x1="60" y1="326" x2="206" y2="324" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

/** Espirais de fumaça da reza subindo. */
export function MilagreFumaca({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 300 320" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="5">
        <path
          className="anim-fumaca"
          d="M150 300 C120 270 176 250 150 220 C124 192 178 172 152 144"
        />
        <path
          className="anim-fumaca"
          style={{ animationDelay: "1.4s" }}
          d="M96 290 C76 264 116 248 98 222 C82 198 120 182 104 158"
        />
        <path
          className="anim-fumaca"
          style={{ animationDelay: "2.6s" }}
          d="M206 288 C226 262 186 246 204 220 C220 196 182 180 198 156"
        />
      </g>
      {/* Espiral que coroa a reza */}
      <path
        d="M150 120 C126 120 118 92 140 82 C158 74 172 92 160 104 C152 112 140 106 144 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}
