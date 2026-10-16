import { BoiKambadaDeitado } from "@/components/play/ilustracoes/BoiKambada";

type ArteProps = { className?: string };

/** O boi deitado, no traço da Kambada. */
export function MorteBoiCaido({ className = "" }: ArteProps) {
  return <BoiKambadaDeitado className={className} />;
}

/** Nuvens pesadas de luto, hachuradas por dentro. */
export function MorteNuvens({ className = "" }: ArteProps) {
  return (
    <svg viewBox="0 0 700 200" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6">
        <path d="M70 120 C50 120 44 96 62 86 C58 62 92 50 108 66 C118 46 156 50 160 74 C182 70 194 96 178 110 C176 120 160 124 150 120 Z" />
        <path d="M420 96 C398 96 392 70 412 60 C408 36 444 24 462 40 C472 20 512 24 516 50 C540 46 552 72 534 88 C532 98 514 102 504 96 Z" />
        <path d="M600 150 C586 150 582 132 594 126 C592 110 616 102 626 112 C634 98 660 102 662 118 C678 116 686 134 674 144 Z" />
      </g>
      <g stroke="currentColor" strokeWidth="3">
        <line x1="80" y1="94" x2="120" y2="112" />
        <line x1="96" y1="80" x2="146" y2="104" />
        <line x1="430" y1="68" x2="478" y2="88" />
        <line x1="448" y1="52" x2="500" y2="78" />
        <line x1="606" y1="126" x2="644" y2="140" />
      </g>
    </svg>
  );
}
