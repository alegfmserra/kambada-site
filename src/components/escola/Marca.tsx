import Image from "next/image";
import type { Disciplina } from "@/lib/escola/tipos";

/**
 * Peças visuais da Kambada no portal da escola, no padrão do site:
 * etiqueta pequena em amarelo, título em duas cores, o Kambadinha (recorte
 * da capa de "A Hora dos Guarás", traço do Ricardo Pontes) falando com a turma.
 */

export function Etiqueta({ children, escuro = false }: { children: React.ReactNode; escuro?: boolean }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em]">
      <span className={escuro ? "text-kambada-amarelo" : "destaque"}>{children}</span>
    </p>
  );
}

/** Título com a segunda parte em amarelo, como "A beleza que é ser / maranhense que só". */
export function TituloDuo({ antes, destaque, escuro = false, nivel = 1 }: { antes: string; destaque: string; escuro?: boolean; nivel?: 1 | 2 }) {
  const Tag = nivel === 1 ? "h1" : "h2";
  return (
    <Tag className={`font-display font-extrabold leading-[1.08] ${nivel === 1 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
      {antes} <span className={escuro ? "text-kambada-amarelo" : "destaque"}>{destaque}</span>
    </Tag>
  );
}

export function Kambadinha({ tamanho = 72, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <Image
      src="/escola/kambadinha.webp"
      alt="Kambadinha, o caranguejo da Kambada"
      width={tamanho}
      height={tamanho}
      className={`shrink-0 rounded-full border-4 border-kambada-amarelo object-cover shadow-lg shadow-black/20 ${className}`}
    />
  );
}

/** Kambadinha com balão de fala. */
export function FalaKambadinha({ children, tamanho = 64, escuro = false }: { children: React.ReactNode; tamanho?: number; escuro?: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <Kambadinha tamanho={tamanho} />
      <p
        className={`relative mb-2 rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-semibold leading-snug sm:text-base ${
          escuro ? "bg-white text-kambada-grafite" : "bg-kambada-amarelo text-kambada-grafite"
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/** Varal de bandeirinhas (as cores do Play). */
export function Bandeirinhas({ className = "" }: { className?: string }) {
  const cores = ["#D4432B", "#FFCC29", "#518FC2", "#F1F1F1", "#3B8D5D", "#E0AF14"];
  return (
    <svg aria-hidden className={className} viewBox="0 0 360 34" fill="none" preserveAspectRatio="none">
      <path d="M0 3 Q 180 11 360 3" stroke="#F5EDE0" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: 10 }, (_, i) => {
        const x = i * 36;
        return <polygon key={i} points={`${x + 3},${5 + (i % 2)} ${x + 33},${5 + (i % 2)} ${x + 18},${30 + (i % 2) * 2}`} fill={cores[i % cores.length]} opacity="0.92" />;
      })}
    </svg>
  );
}

/** Cordão de miçangas como divisor de seção. */
export function Micangas({ className = "" }: { className?: string }) {
  const cores = ["#D4432B", "#FFCC29", "#518FC2", "#3B8D5D", "#E0AF14"];
  const n = 13;
  return (
    <svg aria-hidden className={className} viewBox={`0 0 ${(n - 1) * 26 + 20} 20`} fill="none">
      <line x1="0" y1="10" x2={(n - 1) * 26 + 20} y2="10" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={i * 26 + 4} y="4" width="12" height="12" rx={i % 2 ? 6 : 2} fill={cores[i % cores.length]} />
      ))}
    </svg>
  );
}

/** Cor de cada disciplina (a mesma em cartões, abas e relatório). */
export const COR_DISCIPLINA: Record<Disciplina, string> = {
  Matemática: "#FFCC29",
  Português: "#D4432B",
  Inglês: "#518FC2",
};

export function SeloDisciplina({ disciplina }: { disciplina: Disciplina }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie px-3 py-1 text-xs font-bold">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_DISCIPLINA[disciplina] }} />
      {disciplina}
    </span>
  );
}
