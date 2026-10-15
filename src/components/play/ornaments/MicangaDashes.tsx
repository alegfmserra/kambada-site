import { paletaMicanga as CORES } from "@/lib/play/cores";

/** Fileira de tracinhos de miçanga, como os do capelo da matraca. */
export function MicangaDashes({ count = 6, className = "" }: { count?: number; className?: string }) {
  return (
    <span aria-hidden className={`inline-flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="h-1 w-4 rounded-full"
          style={{ backgroundColor: CORES[i % CORES.length] }}
        />
      ))}
    </span>
  );
}
