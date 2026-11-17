"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import LinkWhatsApp from "@/components/LinkWhatsApp";
import { evento } from "@/lib/analytics/eventos";
import { lerCepSalvo, mascaraCep, salvarCep } from "@/lib/checkout/rascunho";
import { detalheDaEntrega, mensagemDeErroDoFrete, precoDaEntrega, type OpcaoFreteNaTela } from "@/lib/frete/exibir";
import { linkWhatsApp } from "@/lib/site";

/**
 * Campo de CEP que mostra as opções de entrega ANTES do checkout (17/11/2026):
 * no carrinho e na página da peça. Usa a mesma cotação do checkout
 * (POST /api/frete), então o que aparece aqui é o que será cobrado lá:
 * transportadoras, entrega por aplicativo na Grande São Luís, retirada no
 * ateliê e frete grátis. Nenhuma regra de frete mora neste componente.
 *
 * O CEP calculado entra no rascunho do checkout (só nesta aba): o checkout abre
 * com ele preenchido. O CEP nunca vai para a medição.
 */
type Props = {
  /** O que cotar: o carrinho inteiro, ou 1 unidade da peça. Vazio = nada a cotar ainda. */
  itens: { idBling: number; quantidade: number }[];
  /** De onde vem o cálculo, para a medição. */
  local: "carrinho" | "produto";
  /** Avisa quem está em volta (o resumo do carrinho) do resultado. */
  aoCotar?: (opcoes: OpcaoFreteNaTela[] | null) => void;
  /** Cota sozinho ao abrir, se já houver CEP guardado nesta visita (carrinho). */
  cotarAoAbrir?: boolean;
  /** Frase curta sobre o que está sendo cotado ("Para 1 unidade desta peça."). */
  nota?: string;
};

type Estado =
  | { fase: "parado" }
  | { fase: "cotando" }
  | { fase: "pronto"; opcoes: OpcaoFreteNaTela[]; aviso?: string }
  | { fase: "erro"; mensagem: string; doCep?: boolean };

export default function CalculoDeFrete({ itens, local, aoCotar, cotarAoAbrir = false, nota }: Props) {
  const id = useId();
  const [cep, setCep] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "parado" });
  const pedido = useRef(0);
  const chaveDosItens = JSON.stringify(itens);
  const ultimaChave = useRef<string | null>(null);
  const avisar = useRef(aoCotar);
  useEffect(() => {
    avisar.current = aoCotar;
  });

  /** `medir`: conta no Analytics. Recálculo automático (o carrinho mudou) não conta de novo. */
  async function cotar(cepDigitos: string, quais: Props["itens"], medir: boolean) {
    const vez = ++pedido.current;
    setEstado({ fase: "cotando" });
    try {
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cepDigitos, itens: quais }),
      });
      const d = (await r.json().catch(() => ({}))) as { opcoes?: OpcaoFreteNaTela[]; erro?: string; aviso?: string };
      // Chegou uma resposta velha (a pessoa já mudou o carrinho ou o CEP): descarta.
      if (vez !== pedido.current) return;
      if (!r.ok) {
        setEstado({ fase: "erro", mensagem: mensagemDeErroDoFrete(r.status, d.erro), doCep: r.status === 422 });
        avisar.current?.(null);
        return;
      }
      const opcoes = d.opcoes ?? [];
      salvarCep(cepDigitos);
      setEstado({ fase: "pronto", opcoes, aviso: d.aviso });
      avisar.current?.(opcoes);
      // Sem CEP nos parâmetros: só de onde foi calculado e o que voltou.
      if (medir) evento("frete_calculado", {
        local,
        opcoes: opcoes.filter((o) => !o.retirada).length,
        frete_gratis: opcoes.some((o) => o.gratis && !o.retirada),
        entrega_local: opcoes.some((o) => o.local),
      });
    } catch {
      if (vez !== pedido.current) return;
      setEstado({ fase: "erro", mensagem: "Sem conexão para calcular o frete. Tente de novo." });
      avisar.current?.(null);
    }
  }

  // CEP já informado nesta visita (aqui ou no checkout): o campo abre preenchido.
  useEffect(() => {
    const salvo = lerCepSalvo();
    if (!salvo) return;
    // O rascunho só existe no navegador; por isso é lido depois de montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCep(salvo);
  }, []);

  // Carrinho: cota ao abrir (se houver CEP) e de novo quando as peças mudam,
  // com uma pausa para não disparar a cada toque no "+".
  const cepDigitos = cep.replace(/\D/g, "");
  const jaCotou = estado.fase === "pronto";
  useEffect(() => {
    if (itens.length === 0 || cepDigitos.length !== 8) return;
    const primeira = ultimaChave.current === null;
    if (ultimaChave.current === chaveDosItens) return;
    if (primeira && !cotarAoAbrir) return;
    if (!primeira && !jaCotou) return;
    const t = setTimeout(() => {
      ultimaChave.current = chaveDosItens;
      void cotar(cepDigitos, itens, primeira);
    }, primeira ? 0 : 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `itens` muda de identidade a cada render; a chave em texto é quem diz se mudou
  }, [chaveDosItens, cepDigitos, cotarAoAbrir, jaCotou]);

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (cepDigitos.length !== 8) {
      setEstado({ fase: "erro", mensagem: "Digite o CEP com 8 números.", doCep: true });
      return;
    }
    if (itens.length === 0) {
      setEstado({ fase: "erro", mensagem: "Escolha uma opção da peça para calcular o frete." });
      return;
    }
    ultimaChave.current = chaveDosItens;
    void cotar(cepDigitos, itens, true);
  }

  const erroNoCep = estado.fase === "erro" && estado.doCep;

  return (
    <div data-area={`frete-${local}`}>
      <form onSubmit={aoEnviar} noValidate className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-cep`} className="block text-sm font-semibold">
            Calcular frete
          </label>
          <input
            id={`${id}-cep`}
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => {
              setCep(mascaraCep(e.target.value));
              // CEP mudou: o resultado antigo não vale mais.
              if (estado.fase !== "parado") {
                pedido.current += 1;
                ultimaChave.current = null;
                setEstado({ fase: "parado" });
                avisar.current?.(null);
              }
            }}
            aria-invalid={erroNoCep || undefined}
            aria-describedby={`${id}-resultado`}
            className="mt-1 min-h-11 w-full rounded-xl border border-borda-campo bg-superficie px-4 py-2 text-texto outline-none focus:border-kambada-amarelo-escuro aria-[invalid=true]:border-erro"
          />
        </div>
        <button
          type="submit"
          disabled={estado.fase === "cotando"}
          data-evento="frete_calculado"
          className="min-h-11 shrink-0 rounded-xl border border-borda-campo px-4 text-sm font-semibold text-texto hover:border-kambada-amarelo-escuro disabled:opacity-60"
        >
          {estado.fase === "cotando" ? "Calculando…" : "Calcular"}
        </button>
      </form>
      {nota && <p className="mt-1 text-xs text-texto-tenue">{nota}</p>}

      {/* Região viva: quem usa leitor de tela ouve o resultado sem sair do campo. */}
      <div id={`${id}-resultado`} role="status" aria-live="polite" className="mt-3 text-sm">
        {estado.fase === "cotando" && <p className="text-texto-suave">Calculando o frete…</p>}

        {estado.fase === "erro" && (
          <p className="text-erro">
            {estado.mensagem}
            {!estado.doCep && (
              <>
                {" "}
                <LinkWhatsApp
                  origem={`frete-${local}-erro`}
                  href={linkWhatsApp("Oi! Tentei calcular o frete no site e não consegui. Pode me ajudar?")}
                  className="font-semibold text-texto underline underline-offset-4"
                >
                  Pedir o frete no WhatsApp
                </LinkWhatsApp>
              </>
            )}
          </p>
        )}

        {estado.fase === "pronto" && (
          <>
            {estado.aviso && <p className="mb-2 rounded-xl bg-fundo px-3 py-2 text-texto-suave">{estado.aviso}</p>}
            <ul className="divide-y divide-borda rounded-xl border border-borda" aria-label="Opções de entrega para este CEP">
              {estado.opcoes.map((o) => {
                const preco = precoDaEntrega(o);
                return (
                  <li key={o.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.nome}</span>
                      <span className="block text-xs leading-snug text-texto-suave">{detalheDaEntrega(o)}</span>
                    </span>
                    <span className="shrink-0 text-right font-display font-bold">
                      {preco.gratis ? <span className="destaque font-semibold">{preco.texto}</span> : preco.texto}
                      {preco.riscado && <span className="block text-xs font-normal text-texto-tenue line-through">{preco.riscado}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-texto-tenue">Você escolhe a entrega ao finalizar a compra.</p>
          </>
        )}
      </div>
    </div>
  );
}
