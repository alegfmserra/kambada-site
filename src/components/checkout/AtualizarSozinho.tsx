"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Reconsulta a página a cada `segundos`, por no máximo `vezes`. Usado na
 * espera do Pix: assim que o Mercado Pago aprova, o servidor percebe e leva o
 * cliente à confirmação — sem ele precisar recarregar nada.
 */
export default function AtualizarSozinho({ segundos = 10, vezes = 30 }: { segundos?: number; vezes?: number }) {
  const router = useRouter();
  const [feitas, setFeitas] = useState(0);

  useEffect(() => {
    if (feitas >= vezes) return;
    const t = setTimeout(() => {
      router.refresh();
      setFeitas((n) => n + 1);
    }, segundos * 1000);
    return () => clearTimeout(t);
  }, [feitas, vezes, segundos, router]);

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="mt-6 min-h-11 rounded-full border border-borda px-6 py-2.5 font-display text-sm font-semibold hover:border-kambada-amarelo-escuro"
    >
      Já paguei — verificar agora
    </button>
  );
}
