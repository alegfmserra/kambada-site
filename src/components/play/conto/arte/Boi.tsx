import { BoiKambada } from "@/components/play/ilustracoes/BoiKambada";

type ArteProps = { className?: string };

/** O boi do Maranhão no traço da Kambada (cores da bandeira, capelo e fitas). */
export function BoiEstrela({ className = "" }: ArteProps) {
  return <BoiKambada className={className} />;
}

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
