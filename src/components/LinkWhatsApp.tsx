"use client";

import type { ComponentPropsWithoutRef } from "react";
import { evento } from "@/lib/analytics/eventos";

/**
 * Link para o WhatsApp da loja que conta o clique como contato no Google
 * Analytics (`generate_lead`), com a origem: de qual botão a conversa saiu.
 * Só o rótulo da origem vai junto; nada do que a pessoa digitou.
 *
 * No Kambada Play nada é medido: `evento()` já não dispara em /kambadaplay,
 * então o botão fixo (que aparece no site todo) fica mudo lá.
 */
export default function LinkWhatsApp({
  origem,
  onClick,
  children,
  ...resto
}: { origem: string } & ComponentPropsWithoutRef<"a">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...resto}
      onClick={(e) => {
        evento("generate_lead", { origem });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
