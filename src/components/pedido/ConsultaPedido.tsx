"use client";

import Link from "next/link";
import { useActionState } from "react";
import { consultarPedido, type RespostaConsulta } from "@/app/pedido/acoes";
import { formatarReais } from "@/lib/loja/dinheiro";
import { linkWhatsApp } from "@/lib/site";

const COR_DO_TOM = {
  ok: "bg-kambada-amarelo text-kambada-grafite",
  espera: "border border-borda",
  problema: "border border-red-500 text-red-500",
} as const;

export default function ConsultaPedido({ refInicial }: { refInicial: string }) {
  const [resposta, consultar, consultando] = useActionState<RespostaConsulta, FormData>(
    consultarPedido,
    { estado: "inicial" },
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
      <form action={consultar} className="h-fit space-y-4 rounded-3xl border border-borda bg-superficie p-6">
        <div>
          <label htmlFor="pd-ref" className="block text-sm font-semibold">
            Número do pedido
          </label>
          <input
            id="pd-ref"
            name="ref"
            required
            defaultValue={refInicial}
            placeholder="KMB-20261008-ABC123"
            autoCapitalize="characters"
            spellCheck={false}
            className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 font-mono uppercase outline-none focus:border-kambada-amarelo-escuro"
          />
          <p className="mt-1 text-xs text-texto-tenue">Está na página de confirmação da compra.</p>
        </div>
        <div>
          <label htmlFor="pd-email" className="block text-sm font-semibold">
            E-mail usado na compra
          </label>
          <input
            id="pd-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 outline-none focus:border-kambada-amarelo-escuro"
          />
        </div>
        <button
          type="submit"
          disabled={consultando}
          className="w-full rounded-full bg-kambada-amarelo px-6 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro disabled:opacity-50"
        >
          {consultando ? "Consultando…" : "Ver meu pedido"}
        </button>
      </form>

      <div aria-live="polite">
        {resposta.estado === "inicial" && (
          <p className="text-texto-suave">
            Informe o número do pedido e o e-mail que você usou na compra para ver a situação do
            pagamento, da separação e da entrega.
          </p>
        )}
        {resposta.estado === "nao_encontrado" && (
          <div className="rounded-2xl border border-borda p-6">
            <h2 className="font-display text-xl font-bold">Não encontramos este pedido</h2>
            <p className="mt-2 text-texto-suave">
              Confira o número (começa com KMB-) e o e-mail usado na compra. Comprou pelo WhatsApp?
              Aí o acompanhamento é por lá mesmo.
            </p>
            <a
              href={linkWhatsApp("Oi! Queria saber como está o meu pedido.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro"
            >
              Falar no WhatsApp
            </a>
          </div>
        )}
        {resposta.estado === "limite" && (
          <p className="rounded-2xl border border-borda p-6">
            Muitas consultas seguidas. Espere alguns minutos e tente de novo — ou fale com a gente
            no WhatsApp.
          </p>
        )}
        {resposta.estado === "erro" && (
          <p className="rounded-2xl border border-borda p-6">
            Não conseguimos consultar agora. Tente de novo em instantes.
          </p>
        )}
        {resposta.estado === "ok" && <Resultado resposta={resposta} />}
      </div>
    </div>
  );
}

function Resultado({ resposta }: { resposta: Extract<RespostaConsulta, { estado: "ok" }> }) {
  const { dados, enderecoRetirada } = resposta;
  const passos = [
    { nome: "Pagamento", texto: dados.pagamento.texto, tom: dados.pagamento.tom },
    ...(dados.pedido
      ? [{ nome: "Pedido", texto: dados.pedido.situacao, tom: "ok" as const }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-sm text-texto-tenue">Pedido</p>
        <h2 className="font-mono text-2xl font-bold">{dados.ref}</h2>
        {dados.feitoEm && (
          <p className="text-sm text-texto-suave">
            feito em {new Date(dados.feitoEm).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}
          </p>
        )}
      </div>

      <ul className="flex flex-wrap gap-3">
        {passos.map((p) => (
          <li key={p.nome} className={`rounded-full px-4 py-2 text-sm font-semibold ${COR_DO_TOM[p.tom]}`}>
            {p.nome}: {p.texto}
          </li>
        ))}
      </ul>

      {dados.pedido && dados.pedido.rastreios.length > 0 && (
        <div className="rounded-2xl border border-borda p-5">
          <h3 className="font-display font-bold">Rastreio</h3>
          <ul className="mt-2 space-y-1">
            {dados.pedido.rastreios.map((r) => (
              <li key={r.codigo}>
                {r.servico ? `${r.servico}: ` : ""}
                <a
                  href={`https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(r.codigo)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-semibold underline underline-offset-4"
                >
                  {r.codigo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {enderecoRetirada && (
        <div className="rounded-2xl border border-kambada-amarelo-escuro p-5">
          <h3 className="font-display font-bold">Retirada no ateliê</h3>
          <p className="mt-1 font-semibold">{enderecoRetirada}</p>
          <p className="mt-1 text-sm text-texto-suave">Combine o dia e o horário pelo WhatsApp antes de vir.</p>
        </div>
      )}

      <div className="rounded-2xl border border-borda p-5">
        <h3 className="font-display font-bold">O que foi comprado</h3>
        <ul className="mt-3 space-y-1 text-sm">
          {dados.itens.map((i) => (
            <li key={i.nome} className="flex justify-between gap-4">
              <span>
                {i.quantidade}× {i.nome}
              </span>
              <span className="shrink-0">{formatarReais(i.preco * i.quantidade)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 text-texto-suave">
            <span>{dados.entrega.retirada ? "Retirada no ateliê" : dados.entrega.descricao}</span>
            <span className="shrink-0">{dados.entrega.valor > 0 ? formatarReais(dados.entrega.valor) : "Grátis"}</span>
          </li>
          <li className="flex justify-between gap-4 border-t border-borda pt-2 font-display font-bold">
            <span>Total</span>
            <span>{formatarReais(dados.total)}</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/pedido/atendimento?ref=${encodeURIComponent(dados.ref)}`}
          className="rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
        >
          Reclamação, troca ou devolução
        </Link>
        <Link
          href="/trocas-e-devolucoes"
          className="rounded-full border border-borda px-6 py-3 font-display font-semibold hover:border-kambada-amarelo-escuro"
        >
          Política de trocas
        </Link>
      </div>
    </div>
  );
}
