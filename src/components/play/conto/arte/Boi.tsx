type ArteProps = { className?: string };

/** O boi estrela: silhueta de perfil com manta bordada, franjas e estrela na testa. */
export function BoiEstrela({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 420 300" className={className} aria-hidden>
      <g fill="currentColor">
        {/* Corpo */}
        <path d="M96 128 C110 96 190 88 260 96 C300 100 330 116 336 148 C340 172 330 196 314 206 L312 262 L292 262 L290 212 L250 216 L248 262 L228 262 L226 216 L156 214 L152 262 L132 262 L130 210 C106 198 88 164 96 128 Z" />
        {/* Cabeça */}
        <path d="M330 118 C356 108 380 116 390 136 C398 152 394 172 380 182 C368 190 350 190 340 182 L326 160 Z" />
        {/* Chifres em lira */}
        <path d="M352 112 C348 92 356 76 372 68 C362 84 360 98 366 112 Z" />
        <path d="M378 116 C382 96 396 84 412 82 C398 94 390 106 390 120 Z" />
        {/* Rabo */}
        <path d="M100 132 C84 128 72 136 68 150 C76 144 86 144 94 150 L98 144 Z" />
        <circle cx="66" cy="156" r="8" />
      </g>
      {/* Estrela da testa, vazada no papel */}
      <path
        fill="var(--color-kambada-papel)"
        d="M368 132 L372 122 L376 132 L386 136 L376 140 L372 150 L368 140 L358 136 Z"
      />
      {/* Olho */}
      <circle cx="378" cy="158" r="4" fill="var(--color-kambada-papel)" />
      {/* Manta bordada: faixa vazada com losangos e franja */}
      <g>
        <path
          fill="var(--color-kambada-papel)"
          d="M130 128 L300 122 L304 168 L134 176 Z"
        />
        <g fill="currentColor">
          <path d="M162 136 L174 148 L162 160 L150 148 Z" />
          <path d="M218 134 L230 146 L218 158 L206 146 Z" />
          <path d="M274 132 L286 144 L274 156 L262 144 Z" />
        </g>
        {/* Franja da manta */}
        <g stroke="currentColor" strokeWidth="4">
          <line x1="140" y1="176" x2="140" y2="192" />
          <line x1="164" y1="175" x2="164" y2="191" />
          <line x1="188" y1="174" x2="188" y2="190" />
          <line x1="212" y1="172" x2="212" y2="188" />
          <line x1="236" y1="171" x2="236" y2="187" />
          <line x1="260" y1="170" x2="260" y2="186" />
          <line x1="284" y1="169" x2="284" y2="185" />
        </g>
      </g>
      {/* Chão */}
      <g stroke="currentColor" strokeWidth="4">
        <line x1="60" y1="268" x2="380" y2="266" />
        <line x1="110" y1="278" x2="200" y2="277" />
        <line x1="250" y1="277" x2="340" y2="276" />
      </g>
    </svg>
  );
}

/** Cerca de curral: mourões tortos e duas travessas hachuradas. */
export function BoiCurral({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 800 220" className={className} aria-hidden preserveAspectRatio="none">
      <g fill="currentColor">
        <path d="M60 40 L74 40 L78 210 L58 210 Z" />
        <path d="M240 32 L254 34 L256 210 L238 210 Z" />
        <path d="M420 38 L434 36 L438 210 L418 210 Z" />
        <path d="M600 30 L614 32 L618 210 L598 210 Z" />
        <path d="M760 42 L774 40 L778 210 L758 210 Z" />
        {/* Travessas */}
        <path d="M30 78 L790 66 L790 82 L30 94 Z" />
        <path d="M30 148 L790 138 L790 154 L30 164 Z" />
      </g>
      {/* Veios da madeira */}
      <g stroke="var(--color-kambada-papel)" strokeWidth="3">
        <line x1="110" y1="84" x2="200" y2="82" />
        <line x1="480" y1="76" x2="570" y2="74" />
        <line x1="90" y1="156" x2="180" y2="154" />
        <line x1="500" y1="148" x2="590" y2="146" />
      </g>
    </svg>
  );
}
