/** Linha em zigue-zague, como a borda de miçangas brancas do capelo. Cor via currentColor. */
export function Zigzag({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 360 16"
      fill="none"
      preserveAspectRatio="none"
    >
      <polyline
        points="0,14 15,2 30,14 45,2 60,14 75,2 90,14 105,2 120,14 135,2 150,14 165,2 180,14 195,2 210,14 225,2 240,14 255,2 270,14 285,2 300,14 315,2 330,14 345,2 360,14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
