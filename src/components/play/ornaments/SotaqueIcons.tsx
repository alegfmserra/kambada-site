type IconProps = { className?: string };

const stroke = {
  stroke: "currentColor",
  strokeWidth: 4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

/** Par de matracas de madeira. */
export function IconMatraca({ className = "" }: IconProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 64 64">
      <rect x="12" y="8" width="14" height="48" rx="3" {...stroke} />
      <rect x="38" y="8" width="14" height="48" rx="3" {...stroke} />
      <line x1="19" y1="20" x2="19" y2="26" {...stroke} />
      <line x1="45" y1="38" x2="45" y2="44" {...stroke} />
    </svg>
  );
}

/** Zabumba: tambor grave. */
export function IconZabumba({ className = "" }: IconProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 64 64">
      <ellipse cx="32" cy="18" rx="22" ry="8" {...stroke} />
      <path d="M10 18 v24 c0 4.4 9.8 8 22 8 s22 -3.6 22 -8 V18" {...stroke} />
      <line x1="16" y1="24" x2="24" y2="44" {...stroke} />
      <line x1="48" y1="24" x2="40" y2="44" {...stroke} />
    </svg>
  );
}

/** Orquestra: sopro (corneta). */
export function IconOrquestra({ className = "" }: IconProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 64 64">
      <path d="M10 32 h22" {...stroke} />
      <path d="M32 32 c8 0 10 -10 18 -12 v24 c-8 -2 -10 -12 -18 -12 z" {...stroke} />
      <circle cx="14" cy="32" r="4" {...stroke} />
      <line x1="24" y1="26" x2="24" y2="38" {...stroke} />
    </svg>
  );
}

/** Costa de mão: mão aberta sobre o pandeirão. */
export function IconCostaDeMao({ className = "" }: IconProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 64 64">
      <circle cx="32" cy="36" r="20" {...stroke} />
      <path d="M24 36 v-12 M30 34 v-16 M36 34 v-16 M42 36 v-12" {...stroke} />
      <path d="M24 36 c0 8 16 8 18 0" {...stroke} />
    </svg>
  );
}
