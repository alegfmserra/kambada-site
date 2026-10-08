"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fotoDoItem } from "@/lib/fotoDoProduto";
import { faltaParaFreteGratis } from "@/lib/frete/regras";
import { formatarReais } from "@/lib/loja/dinheiro";
import { useCarrinho } from "./ProvedorCarrinho";

/** Quanto tempo o aviso fica aberto sem interação. */
const SEGUNDOS_ABERTO = 8;

/**
 * "Adicionado ao carrinho" — o retorno que faltava (pedido do Alexandre em
 * 08/10/2026: só a contagem no ícone não deixava claro que a peça tinha
 * entrado).
 *
 * Painel não-modal no alto da tela: mostra a peça, o total do carrinho, quanto
 * falta para o frete grátis e os dois caminhos — finalizar ou continuar. Some
 * sozinho depois de alguns segundos, mas NÃO enquanto o mouse ou o foco do
 * teclado estiverem nele. Esc fecha. Leitores de tela ouvem o anúncio pela
 * região `aria-live`, sem o foco ser arrancado de onde a pessoa estava.
 */
export default function AvisoAdicionado() {
  const { ultimaAdicao, fecharAviso, subtotal, pecas } = useCarrinho();
  const caminho = usePathname();
  const [pausado, setPausado] = useState(false);
  const painel = useRef<HTMLDivElement>(null);

  // Fecha sozinho — a contagem recomeça a cada nova adição.
  useEffect(() => {
    if (!ultimaAdicao || pausado) return;
    const t = setTimeout(fecharAviso, SEGUNDOS_ABERTO * 1000);
    return () => clearTimeout(t);
  }, [ultimaAdicao, pausado, fecharAviso]);

  // Esc fecha.
  useEffect(() => {
    if (!ultimaAdicao) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fecharAviso();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [ultimaAdicao, fecharAviso]);

  // Mudou de página (foi ao carrinho, por exemplo): o aviso cumpriu o papel.
  useEffect(() => {
    fecharAviso();
  }, [caminho, fecharAviso]);

  const item = ultimaAdicao?.item;
  const foto = item ? fotoDoItem(item.idBling, item.slug) : null;
  const falta = faltaParaFreteGratis(subtotal);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-end sm:inset-x-6">
      {item && (
        <div
          ref={painel}
          key={ultimaAdicao.vez}
          role="region"
          aria-label="Peça adicionada ao carrinho"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={(e) => {
            if (!painel.current?.contains(e.relatedTarget as Node)) setPausado(false);
          }}
          className="aviso-entrada pointer-events-auto w-full max-w-sm rounded-2xl border border-kambada-amarelo-escuro bg-superficie p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-display font-bold">
              <span aria-hidden="true" className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-kambada-amarelo text-sm text-kambada-grafite">
                ✓
              </span>
              Adicionado ao carrinho
            </p>
            <button
              type="button"
              onClick={fecharAviso}
              aria-label="Fechar aviso"
              className="-mt-1 -mr-1 h-9 w-9 shrink-0 rounded-full text-xl leading-none text-texto-tenue hover:bg-fundo hover:text-texto"
            >
              ×
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {foto ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                <Image src={foto.src} alt="" fill sizes="64px" className="object-contain" />
              </div>
            ) : (
              <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-borda text-2xl">
                🦀
              </div>
            )}
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{item.nome}</p>
              {item.rotulo && item.rotulo !== "Único" && <p className="text-texto-suave">{item.rotulo}</p>}
              <p className="text-texto-suave">
                {item.quantidade}× {formatarReais(item.preco)}
              </p>
            </div>
          </div>

          <p className="mt-4 border-t border-borda pt-3 text-sm">
            No carrinho: <strong>{pecas} {pecas === 1 ? "peça" : "peças"}</strong> ·{" "}
            <strong>{formatarReais(subtotal)}</strong>
          </p>
          <p className="mt-1 text-xs text-texto-suave">
            {falta > 0 ? (
              <>Faltam {formatarReais(falta)} para o frete grátis.</>
            ) : (
              <>Você ganhou frete grátis na entrega mais econômica.</>
            )}
          </p>

          <div className="mt-4 grid gap-2">
            <Link
              href="/carrinho"
              className="rounded-full bg-kambada-amarelo px-5 py-3 text-center font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
            >
              Ver carrinho e finalizar
            </Link>
            <button
              type="button"
              onClick={fecharAviso}
              className="min-h-11 rounded-full border border-borda px-5 py-2.5 font-display text-sm font-semibold hover:border-kambada-amarelo-escuro"
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
