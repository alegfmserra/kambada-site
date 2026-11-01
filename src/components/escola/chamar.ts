"use client";

/** POST em JSON para a API do portal; devolve o corpo (com `ok` e `mensagem`). */
export async function chamar<T = Record<string, unknown>>(rota: string, corpo: unknown): Promise<T & { ok: boolean; mensagem?: string }> {
  try {
    const r = await fetch(`/api/escola/${rota}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    return (await r.json()) as T & { ok: boolean; mensagem?: string };
  } catch {
    return { ok: false, mensagem: "Sem conexão. Confira a internet e tente de novo." } as T & { ok: boolean; mensagem?: string };
  }
}

export const BOTAO =
  "inline-flex items-center justify-center gap-2 rounded-full bg-kambada-amarelo px-6 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-60";
export const BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-borda px-5 py-2.5 font-semibold text-texto transition-colors hover:border-kambada-amarelo disabled:opacity-60";
export const CAMPO =
  "mt-1 w-full rounded-lg border-2 border-borda bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo";
