"use client";

import { useRef, useState } from "react";
import type { ArquivoGuardado } from "@/lib/escola/dados";

const ACEITOS = "application/pdf,image/jpeg,image/png";
const LIMITE = 5 * 1024 * 1024;

const tamanho = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const urlDoArquivo = (a: ArquivoGuardado) => `/api/escola/arquivo/${a.id}`;

/** Link para abrir o arquivo (abre em outra aba; a rota confere quem pode ver). Foto aparece em miniatura. */
export function LinkArquivo({ a, rotulo }: { a: ArquivoGuardado; rotulo: string }) {
  return (
    <a href={urlDoArquivo(a)} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl border-2 border-borda p-3 text-sm hover:border-kambada-amarelo">
      {a.tipo === "application/pdf" ? (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-kambada-red/15 text-xl" aria-hidden>📄</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- arquivo com sessão, servido pela rota do portal
        <img src={urlDoArquivo(a)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      )}
      <span className="min-w-0">
        <b className="block">{rotulo}</b>
        <span className="block truncate text-texto-suave">
          {a.nome} · {tamanho(a.tamanho)}
        </span>
      </span>
    </a>
  );
}

/**
 * Botão de mandar arquivo (PDF, JPG ou PNG, até 5 MB). Confere o tamanho
 * antes de subir; o servidor confere de novo, e o tipo pelos bytes.
 */
export function MandarArquivo({ rotulo, campos, onPronto }: { rotulo: string; campos?: Record<string, string>; onPronto: (resposta: Record<string, unknown>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function mandar(f: File) {
    setErro("");
    if (f.size > LIMITE) {
      setErro("O arquivo passa de 5 MB. Diminua a foto ou o PDF e tente de novo.");
      return;
    }
    const form = new FormData();
    form.append("arquivo", f);
    for (const [k, v] of Object.entries(campos ?? {})) form.append(k, v);
    setEnviando(true);
    try {
      const r = await fetch("/api/escola/arquivo", { method: "POST", body: form });
      const j = (await r.json()) as Record<string, unknown> & { ok: boolean; mensagem?: string };
      if (!j.ok) setErro(j.mensagem ?? "Não deu para mandar o arquivo.");
      else onPronto(j);
    } catch {
      setErro("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo">
        📎 {enviando ? "Mandando…" : rotulo}
        <input
          ref={input}
          type="file"
          accept={ACEITOS}
          className="sr-only"
          disabled={enviando}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void mandar(f);
          }}
        />
      </label>
      <p className="text-xs text-texto-suave">PDF ou foto (JPG, PNG), até 5 MB.</p>
      {erro && <p className="text-sm font-semibold text-kambada-red" role="alert">{erro}</p>}
    </div>
  );
}
