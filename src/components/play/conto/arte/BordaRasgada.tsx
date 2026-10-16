type BordaProps = {
  className?: string;
  /** Qual das três cristas de rasgo usar; alterne por cena, papel rasgado nunca repete. */
  variante?: 0 | 1 | 2;
};

/**
 * Borda vertical de papel rasgado, posicionada na emenda entre cenas.
 * O rasgo herda currentColor: tinja com a cor da cena vizinha.
 * Três cristas de amplitude irregular + fio escuro de 1px na quebra,
 * pra dar espessura de papel de verdade.
 */
const CRISTAS: number[][][] = [
  [
    [16, 800], [24, 758], [9, 722], [21, 690], [6, 648], [26, 606], [13, 566],
    [23, 530], [5, 484], [19, 446], [11, 402], [27, 362], [8, 328], [22, 284],
    [14, 240], [25, 196], [7, 158], [20, 118], [12, 74], [23, 36], [15, 0],
  ],
  [
    [13, 800], [27, 762], [11, 734], [22, 704], [7, 660], [24, 622], [16, 590],
    [28, 548], [9, 510], [21, 470], [6, 428], [25, 390], [12, 350], [23, 310],
    [8, 262], [26, 224], [15, 184], [24, 148], [10, 104], [21, 62], [13, 24], [18, 0],
  ],
  [
    [18, 800], [8, 756], [25, 716], [12, 678], [27, 636], [10, 596], [22, 552],
    [7, 516], [24, 476], [14, 434], [26, 398], [9, 354], [20, 312], [6, 270],
    [23, 232], [11, 190], [28, 150], [13, 110], [24, 70], [9, 34], [17, 0],
  ],
];

const linha = (pontos: number[][]) =>
  pontos.map(([x, y]) => `${x} ${y}`).join(" L");

export function BordaRasgada({ className = "", variante = 0 }: BordaProps) {
  const pontos = CRISTAS[variante] ?? CRISTAS[0];
  return (
    <svg
      viewBox="0 0 40 800"
      className={className}
      aria-hidden
      preserveAspectRatio="none"
      fill="currentColor"
    >
      <path d={`M40 0 L40 800 L${linha(pontos)} Z`} />
      <path
        d={`M${linha(pontos)}`}
        fill="none"
        stroke="var(--color-kambada-ink)"
        strokeOpacity={0.3}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
