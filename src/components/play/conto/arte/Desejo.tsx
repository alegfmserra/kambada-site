type ArteProps = { className?: string };

/** Catirina e Pai Francisco em silhueta: ela de lenço e ventre redondo, ele de chapéu de couro. */
export function DesejoCasal({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 320 300" className={className} aria-hidden>
      {/* Catirina */}
      <g fill="currentColor">
        <circle cx="104" cy="74" r="26" />
        {/* Lenço amarrado */}
        <path d="M78 66 C82 44 126 44 130 66 L134 58 L140 70 L128 76 C120 60 88 60 82 76 L70 70 Z" />
        {/* Corpo com ventre redondo e saia rodada */}
        <path d="M88 98 C70 118 66 150 74 172 C56 210 52 250 60 284 L152 284 C160 246 154 206 140 174 C154 152 148 118 122 100 C112 94 96 92 88 98 Z" />
        {/* Braço na cintura */}
        <path d="M84 128 C70 140 68 156 78 164 L92 154 C84 148 84 138 92 132 Z" />
      </g>
      {/* Barras da saia em hachura vazada */}
      <g stroke="var(--color-kambada-papel)" strokeWidth="4">
        <line x1="66" y1="252" x2="148" y2="250" />
        <line x1="63" y1="266" x2="151" y2="264" />
      </g>
      {/* Pai Francisco */}
      <g fill="currentColor">
        <circle cx="228" cy="82" r="24" />
        {/* Chapéu de couro de aba larga */}
        <path d="M186 70 L270 68 C272 60 262 54 252 54 C250 42 206 42 204 56 C194 56 186 62 186 70 Z" />
        {/* Corpo */}
        <path d="M206 106 C192 128 190 168 198 200 L196 284 L222 284 L226 220 L234 220 L240 284 L264 284 L260 198 C268 164 264 126 248 106 C236 98 216 98 206 106 Z" />
        {/* Braço coçando a cabeça, dúvida armada */}
        <path d="M246 108 C262 116 270 104 264 92 L276 84 C290 104 274 130 248 122 Z" />
      </g>
      {/* Chão */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="30" y1="288" x2="292" y2="286" />
      </g>
    </svg>
  );
}

/** Cozinha de taipa: mesa, panela no fogo e réstias penduradas. */
export function DesejoCozinha({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 360 260" className={className} aria-hidden>
      {/* Réstias de cebola e ervas penduradas */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="30" y1="10" x2="330" y2="8" />
        <line x1="70" y1="10" x2="70" y2="42" />
        <line x1="150" y1="9" x2="150" y2="34" />
        <line x1="290" y1="8" x2="290" y2="46" />
      </g>
      <g fill="currentColor">
        <circle cx="70" cy="52" r="10" />
        <circle cx="70" cy="70" r="9" />
        <path d="M144 34 C136 52 138 66 150 76 C162 66 164 52 156 34 Z" />
        <circle cx="290" cy="56" r="10" />
        <circle cx="290" cy="74" r="9" />
      </g>
      {/* Mesa */}
      <g fill="currentColor">
        <path d="M24 160 L336 158 L336 172 L24 174 Z" />
        <path d="M44 174 L56 244 L68 244 L60 174 Z" />
        <path d="M300 172 L292 244 L304 244 L312 172 Z" />
      </g>
      {/* Panela sobre trempe com fogo */}
      <g fill="currentColor">
        <path d="M160 118 L224 116 C226 140 214 156 192 156 C170 156 158 140 160 118 Z" />
        <path d="M154 112 L230 110 L230 120 L154 122 Z" />
        {/* Alças */}
        <path d="M150 118 C140 118 140 132 150 132 L156 132 L156 124 L152 124 Z" />
        <path d="M234 116 C244 116 244 130 234 130 L228 130 L228 122 L232 122 Z" />
      </g>
      {/* Chamas sob a panela */}
      <g className="anim-chama" fill="currentColor">
        <path d="M178 158 C172 146 176 138 184 132 C182 142 190 144 190 152 Z" />
        <path d="M196 158 C192 144 198 136 206 130 C202 142 212 146 210 156 Z" />
      </g>
      {/* Hachura do tampo */}
      <g stroke="var(--color-kambada-papel)" strokeWidth="3">
        <line x1="60" y1="166" x2="120" y2="165" />
        <line x1="240" y1="164" x2="310" y2="163" />
      </g>
    </svg>
  );
}
