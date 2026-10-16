import { useId } from "react";

/**
 * Boi do Maranhão no traço da Kambada: figura chapada e ingênua, como nas
 * nossas placas pintadas à mão. Capelo branco com franja e fitas ao vento,
 * "couro" em saia com as cores da bandeira do Maranhão (vermelho, branco e
 * preto, com o campo azul e a estrela), pesponto tracejado e folhas verdes.
 * Desenho original da Kambada para o Play: nada de boi de outra região.
 */

const K = "#1d1e20"; // grafite da marca (contorno)
const R = "#c8242c";
const B = "#1f4f93";
const W = "#fbf7ee";
const Y = "#f5b81c";
const G = "#4d8c2f";

/** Desenho do boi de pé, em um espaço de 400 x 520. */
function Corpo({ id }: { id: string }) {
  const saia = "M130 232 Q122 330 62 480 L338 480 Q278 330 270 232 Z";
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <clipPath id={`${id}-saia`}>
          <path d={saia} />
        </clipPath>
      </defs>

      {/* Fitas ao vento, saindo do capelo */}
      <g transform="translate(200 156) scale(1.26) translate(-200 -156)">
      <g fill="none">
        <path d="M204 70 C224 38 250 62 272 30" stroke={K} strokeWidth="10" />
        <path d="M208 68 C234 48 258 74 296 50" stroke={K} strokeWidth="10" />
        <path d="M200 66 C214 40 232 30 244 8" stroke={K} strokeWidth="10" />
        <path d="M204 70 C224 38 250 62 272 30" stroke={R} strokeWidth="6" />
        <path d="M208 68 C234 48 258 74 296 50" stroke={W} strokeWidth="6" />
        <path d="M200 66 C214 40 232 30 244 8" stroke={B} strokeWidth="6" />
      </g>
      </g>

      {/* Rabo enrolado */}
      <path d="M272 262 C322 252 346 214 322 190 C310 178 332 168 348 182" fill="none" stroke={K} strokeWidth="5" />
      <ellipse cx="350" cy="186" rx="9" ry="6" fill={K} />

      {/* Couro em saia: listras da bandeira */}
      <g clipPath={`url(#${id}-saia)`}>
        <rect x="50" y="225" width="70" height="262" fill={R} />
        <rect x="120" y="225" width="56" height="262" fill={W} />
        <rect x="176" y="225" width="50" height="262" fill={K} />
        <rect x="226" y="225" width="56" height="262" fill={W} />
        <rect x="282" y="225" width="70" height="262" fill={R} />
        <g stroke={K} strokeWidth="3">
          <line x1="120" y1="225" x2="120" y2="487" />
          <line x1="176" y1="225" x2="176" y2="487" />
          <line x1="226" y1="225" x2="226" y2="487" />
          <line x1="282" y1="225" x2="282" y2="487" />
        </g>
      </g>
      <path d={saia} fill="none" stroke={K} strokeWidth="4" />

      {/* Campo azul com a estrela e pesponto */}
      <path d="M126 236 C160 220 240 220 274 236 L292 318 Q200 362 108 318 Z" fill={B} stroke={K} strokeWidth="3" />
      <path d="M114 322 Q200 362 286 322" fill="none" stroke={W} strokeWidth="3" strokeDasharray="8 6" />
      <path
        d="M200 252 L210 278 L238 280 L216 297 L224 324 L200 308 L176 324 L184 297 L162 280 L190 278 Z"
        fill={W}
        stroke={K}
        strokeWidth="2"
      />

      {/* Pescoço e ombros */}
      <path d="M140 244 C142 200 158 176 168 154 L238 154 C248 176 262 200 266 244 C230 228 176 228 140 244 Z" fill={K} />
      <g fill={W}>
        <circle cx="176" cy="204" r="3.4" />
        <circle cx="206" cy="192" r="3.4" />
        <circle cx="232" cy="204" r="3.4" />
        <circle cx="248" cy="226" r="3.4" />
        <circle cx="190" cy="226" r="3.4" />
      </g>

      {/* Colar amarelo com pesponto */}
      <path d="M165 152 L239 152 L244 174 Q203 186 160 174 Z" fill={Y} stroke={K} strokeWidth="3" />
      <path d="M170 163 Q203 172 236 163" fill="none" stroke={K} strokeWidth="2.5" strokeDasharray="7 5" />

      {/* Folhas verdes no ombro */}
      <path d="M150 240 C120 224 104 200 110 180 C138 184 156 208 150 240 Z" fill={G} stroke={K} strokeWidth="3" />
      <path d="M152 262 C124 250 112 232 114 214 C140 218 156 238 152 262 Z" fill={G} stroke={K} strokeWidth="3" />
      <path d="M146 232 C132 218 124 204 122 192" fill="none" stroke={K} strokeWidth="2" strokeDasharray="5 4" />

      <g transform="translate(200 156) scale(1.26) translate(-200 -156)">
      {/* Chifres */}
      <path d="M226 94 C248 86 264 96 270 76 C262 108 242 114 226 110 Z" fill={W} stroke={K} strokeWidth="3" />
      <path d="M178 92 C170 76 150 72 142 56 C162 68 184 74 192 90 Z" fill={W} stroke={K} strokeWidth="3" />

      {/* Cabeça: crânio preto e focinho branco */}
      <path d="M150 120 C150 94 176 82 204 84 C232 86 246 102 244 126 C242 148 222 158 202 158 C176 158 150 148 150 120 Z" fill={K} />
      <path d="M124 128 L168 108 L194 152 L150 154 Z" fill={W} stroke={K} strokeWidth="3" />
      <circle cx="136" cy="136" r="3" fill={K} />
      <path d="M158 102 L126 86 L150 118 Z" fill={W} stroke={K} strokeWidth="3" />
      {/* Olho fechado, sereno */}
      <path d="M190 114 Q202 124 214 114" fill="none" stroke={W} strokeWidth="3.5" />

      {/* Capelo branco com franja */}
      <path d="M166 78 Q204 58 242 78 L240 90 Q204 74 168 92 Z" fill={W} stroke={K} strokeWidth="3" />
      <g stroke={W} strokeWidth="3">
        <line x1="176" y1="92" x2="176" y2="104" />
        <line x1="188" y1="86" x2="188" y2="99" />
        <line x1="200" y1="83" x2="200" y2="96" />
        <line x1="212" y1="83" x2="212" y2="96" />
        <line x1="224" y1="86" x2="224" y2="99" />
        <line x1="234" y1="90" x2="234" y2="102" />
      </g>
      </g>
    </g>
  );
}

/** Boi de pé, para capas, destaques e seções. */
export function BoiKambada({
  className = "",
  titulo = "Boi do Maranhão, no traço da Kambada",
}: {
  className?: string;
  titulo?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 -50 400 570" className={className} role="img" aria-label={titulo}>
      <ellipse cx="200" cy="486" rx="150" ry="9" fill={K} opacity="0.14" />
      <Corpo id={id} />
    </svg>
  );
}

/** Boi deitado (cena do cordel em que o boi cai), no mesmo traço. */
export function BoiKambadaDeitado({
  className = "",
  titulo = "O boi deitado, no traço da Kambada",
}: {
  className?: string;
  titulo?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 560 360" className={className} role="img" aria-label={titulo}>
      <ellipse cx="290" cy="326" rx="240" ry="12" fill={K} opacity="0.16" />
      <g transform="translate(118 330) rotate(-84) scale(0.62)">
        <Corpo id={id} />
      </g>
      {/* Estrelinhas do sono */}
      <g fill={Y} stroke={K} strokeWidth="2">
        <path d="M70 70 L76 84 L90 86 L79 95 L83 109 L70 101 L57 109 L61 95 L50 86 L64 84 Z" />
        <path d="M130 30 L134 40 L145 41 L137 48 L140 58 L130 52 L120 58 L123 48 L115 41 L126 40 Z" />
      </g>
    </svg>
  );
}
