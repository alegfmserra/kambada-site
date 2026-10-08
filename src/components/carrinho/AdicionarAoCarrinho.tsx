"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { MAXIMO_POR_ITEM } from "@/lib/carrinho/logica";
import type { Opcao } from "@/lib/catalogo";
import { formatarReais } from "@/lib/loja/dinheiro";
import { useCarrinho } from "./ProvedorCarrinho";

type Props = {
  slug: string;
  categoria: string;
  nome: string;
  /** Só as opções que podem ir para o carrinho (com embalagem conhecida). */
  opcoes: Opcao[];
};

export default function AdicionarAoCarrinho({ slug, categoria, nome, opcoes }: Props) {
  const { adicionar, itens } = useCarrinho();
  const idGrupo = useId();
  const unica = opcoes.length === 1;

  const primeiraDisponivel = opcoes.find((o) => o.quantidade > 0) ?? opcoes[0];
  const [escolhida, setEscolhida] = useState<number>(primeiraDisponivel.idBling);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  const opcao = opcoes.find((o) => o.idBling === escolhida) ?? primeiraDisponivel;
  const noCarrinho = itens.find((i) => i.idBling === opcao.idBling)?.quantidade ?? 0;
  const teto = Math.max(0, Math.min(opcao.quantidade, MAXIMO_POR_ITEM) - noCarrinho);
  const esgotada = opcao.quantidade <= 0;

  function escolher(id: number) {
    setEscolhida(id);
    setQuantidade(1);
    setAdicionado(false);
  }

  function aoAdicionar() {
    if (teto <= 0) return;
    adicionar({
      idBling: opcao.idBling,
      slug,
      categoria,
      nome,
      rotulo: opcao.rotulo,
      preco: opcao.preco,
      quantidade: Math.min(quantidade, teto),
      estoque: opcao.quantidade,
    });
    setQuantidade(1);
    setAdicionado(true);
  }

  return (
    <div className="mt-8">
      {!unica && (
        <fieldset>
          <legend className="font-display text-sm font-semibold text-texto-tenue uppercase">
            Escolha a opção
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {opcoes.map((o) => {
              const id = `${idGrupo}-${o.idBling}`;
              const semEstoque = o.quantidade <= 0;
              return (
                <label
                  key={o.idBling}
                  htmlFor={id}
                  className={`min-h-11 cursor-pointer rounded-full border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kambada-amarelo-escuro ${
                    escolhida === o.idBling
                      ? "border-kambada-amarelo-escuro bg-kambada-amarelo font-semibold text-kambada-grafite"
                      : "border-borda hover:border-kambada-amarelo-escuro"
                  } ${semEstoque ? "text-texto-tenue line-through" : ""}`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={idGrupo}
                    value={o.idBling}
                    checked={escolhida === o.idBling}
                    onChange={() => escolher(o.idBling)}
                    className="sr-only"
                  />
                  {o.rotulo}
                  {semEstoque && <span className="sr-only"> (esgotada)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {opcoes.some((o) => o.preco !== opcoes[0].preco) && (
        <p className="mt-4 text-sm text-texto-suave" aria-live="polite">
          {opcao.rotulo}: <strong className="text-texto">{formatarReais(opcao.preco)}</strong>
        </p>
      )}

      {esgotada ? (
        <p className="mt-6 text-sm font-semibold text-texto-tenue">Esta opção esgotou.</p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-full border border-borda" role="group" aria-label="Quantidade">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center font-display font-semibold" aria-live="polite">
              {Math.min(quantidade, Math.max(teto, 1))}
            </span>
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.min(teto, q + 1))}
              disabled={quantidade >= teto}
              aria-label="Aumentar quantidade"
              className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={aoAdicionar}
            disabled={teto <= 0}
            className="min-h-12 rounded-full bg-kambada-amarelo px-8 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar ao carrinho
          </button>
        </div>
      )}

      {teto <= 0 && !esgotada && (
        <p className="mt-3 text-sm text-texto-suave">
          Você já tem no carrinho todas as unidades disponíveis desta opção.
        </p>
      )}

      <p aria-live="polite" className="mt-4 min-h-6 text-sm">
        {adicionado && (
          <>
            Pronto, está no carrinho.{" "}
            <Link href="/carrinho" className="font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro">
              Ver carrinho
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
