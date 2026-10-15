/**
 * Fonte única das cores de acento da marca, usadas em materiais Three.js
 * (que não leem `var(--)` do CSS) e em componentes DOM que precisam do
 * hex literal em vez da classe Tailwind de token.
 *
 * Espelha os tokens `--color-kambada-*` de `src/app/globals.css`, que são a
 * fonte canônica em OKLCH; aqui vive a conversão sRGB (hex) de cada um.
 * Ao mudar um token lá, reconverter aqui (OKLCH -> hex) pra não driftar.
 */
export const acento = {
  vermelho: "#D4432B",
  amarelo: "#FFCC29",
  azul: "#518FC2",
  verde: "#3B8D5D",
  dourado: "#E0AF14",
  creme: "#F1F1F1",
  tinta: "#1D1E20",
} as const;

/** Ordem usada nas fitinhas do arraial e nos bonecos (sem o creme). */
export const paletaAcento5 = [
  acento.vermelho,
  acento.amarelo,
  acento.azul,
  acento.verde,
  acento.dourado,
];

/** Ordem usada na faixa de bandeirinhas e no varal decorativo. */
export const paletaBandeira = [
  acento.vermelho,
  acento.amarelo,
  acento.azul,
  acento.creme,
  acento.verde,
  acento.dourado,
];

/** Ordem usada nos tracinhos de miçanga. */
export const paletaMicanga = [
  acento.amarelo,
  acento.azul,
  acento.vermelho,
  acento.verde,
  acento.creme,
  acento.dourado,
];

/** Converte hex #RRGGBB nos componentes RGB (0 a 255). */
function hexParaRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Mistura linear entre duas cores hex, com t entre 0 (fica em `a`) e 1 (fica em `b`). */
function misturarHex(a: string, b: string, t: number): string {
  const pa = hexParaRgb(a);
  const pb = hexParaRgb(b);
  const canal = (ca: number, cb: number) => Math.round(ca + (cb - ca) * t);
  const r = canal(pa.r, pb.r);
  const g = canal(pa.g, pb.g);
  const bch = canal(pa.b, pb.b);
  return `#${[r, g, bch].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Espelha `--color-kambada-noite` de globals.css, base da luz ambiente do arraial. */
const noite = "#1D1E20";

/**
 * Céu em gradiente do arraial: índigo profundo no zênite e violeta no
 * horizonte (referência geral da clareira, ver
 * docs/evidencias/gauntlet-arraial-3d/referencias-analise.md).
 */
export const ceuArraial = {
  zenite: "#101112",
  horizonte: "#4A3A1A",
  /** Cor da névoa de profundidade da clareira (fica entre o horizonte e a noite). */
  nevoa: "#2A2B2E",
} as const;

/**
 * Luzes derivadas dos tokens de acento pro clima noturno do arraial:
 * direcional quente, ambiente azulada mais fraca e brilho das faíscas da
 * fogueira. Cada valor é calculado uma vez, na carga do módulo.
 */
export const luzArraial = {
  quente: acento.dourado,
  ambiente: misturarHex(noite, acento.azul, 0.3),
  faisca: misturarHex(acento.dourado, acento.vermelho, 0.35),
} as const;
