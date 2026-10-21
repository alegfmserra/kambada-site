"use client";

import { useFormStatus } from "react-dom";

/**
 * Botão de formulário da área de controle que mostra que está trabalhando —
 * cancelar e estornar leva alguns segundos (Mercado Pago + Bling + e-mail) e,
 * parado, parecia que nada tinha acontecido (Alexandre, 21/10/2026).
 */
export default function BotaoComEspera({
  children,
  esperando,
  className,
  title,
}: {
  children: React.ReactNode;
  esperando: string;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className ?? ""} disabled:cursor-wait disabled:opacity-80`} title={title}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {esperando}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
