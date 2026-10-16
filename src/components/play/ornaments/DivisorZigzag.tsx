/**
 * Faixa de emenda entre seções: dentes de zigue-zague preenchidos na cor da
 * seção seguinte (via currentColor), como a borda de miçangas do capelo.
 * Posicionar colado na borda inferior da seção anterior.
 */
export function DivisorZigzag({ className = "" }: { className?: string }) {
  const largura = 720;
  const altura = 22;
  const passo = 48;
  const dentes: string[] = [`0,${altura}`];
  for (let x = 0; x <= largura; x += passo) {
    dentes.push(`${x + passo / 2},2`);
    dentes.push(`${x + passo},${altura}`);
  }
  return (
    <svg
      aria-hidden
      className={className}
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      fill="currentColor"
    >
      <polygon points={dentes.join(" ")} />
    </svg>
  );
}
