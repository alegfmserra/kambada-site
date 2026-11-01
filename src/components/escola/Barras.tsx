/** Barra empilhada ✓ / ↻ / ✗ / ainda não jogou (sem JavaScript). */
export function BarraStatus({ domina, quase, reforco, nada }: { domina: number; quase: number; reforco: number; nada: number }) {
  const total = domina + quase + reforco + nada || 1;
  const partes = [
    { n: domina, cor: "bg-kambada-green", rotulo: "já domina" },
    { n: quase, cor: "bg-kambada-amarelo", rotulo: "quase lá" },
    { n: reforco, cor: "bg-kambada-red", rotulo: "precisa de reforço" },
    { n: nada, cor: "bg-borda", rotulo: "ainda não jogou" },
  ];
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-superficie"
      role="img"
      aria-label={partes.map((p) => `${p.n} ${p.rotulo}`).join(", ")}
    >
      {partes.map((p) =>
        p.n ? <span key={p.rotulo} className={p.cor} style={{ width: `${(p.n / total) * 100}%` }} title={`${p.n} ${p.rotulo}`} /> : null,
      )}
    </div>
  );
}

export function Legenda() {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
      <span><b className="text-kambada-green">✓</b> já domina</span>
      <span><b className="text-kambada-amarelo-escuro">↻</b> quase lá (acerta na segunda)</span>
      <span><b className="text-kambada-red">✗</b> precisa de reforço</span>
      <span><b>·</b> ainda não jogou</span>
    </p>
  );
}
