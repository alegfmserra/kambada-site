/** Estrela de cinco pontas com raios, como a estrela de miçangas do capelo. Cor via currentColor. */
export function EstrelaRaiada({ className = "" }: { className?: string }) {
  const raios = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI * 2) / 16 - Math.PI / 2;
    const r1 = 58 + (i % 2 === 0 ? 0 : 6);
    const r2 = r1 + (i % 2 === 0 ? 22 : 12);
    return {
      x1: 100 + Math.cos(a) * r1,
      y1: 100 + Math.sin(a) * r1,
      x2: 100 + Math.cos(a) * r2,
      y2: 100 + Math.sin(a) * r2,
    };
  });

  const pontas = Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? 48 : 20;
    return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`;
  }).join(" ");

  return (
    <svg aria-hidden className={className} viewBox="0 0 200 200" fill="none">
      {raios.map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}
      <polygon points={pontas} fill="currentColor" />
    </svg>
  );
}
