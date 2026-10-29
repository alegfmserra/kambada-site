"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { evento } from "@/lib/analytics/eventos";
import { MAXIMO_POR_ITEM } from "@/lib/carrinho/logica";
import type { Opcao } from "@/lib/catalogo";
import { formatarReais } from "@/lib/loja/dinheiro";
import { useOpcaoAtiva } from "@/components/produto/OpcaoAtiva";
import { ANCORA_GUIA_DE_TAMANHOS } from "@/components/produto/GuiaDeTamanhos";
import {
  acharOpcao,
  eixoMudaPreco,
  eixosDasOpcoes,
  escolher as escolherValor,
  opcaoParaFoto,
  precoDoValor,
  rotuloDoValor,
  valorExiste,
} from "@/lib/loja/seletorDuplo";
import { chaveDaFotoDoSuporte } from "@/lib/fotosSuportes";
import { useCarrinho } from "./ProvedorCarrinho";

type Props = {
  slug: string;
  categoria: string;
  nome: string;
  /** Só as opções que podem ir para o carrinho (com embalagem conhecida). */
  opcoes: Opcao[];
  /** Feita por encomenda: o saldo não limita a compra. */
  sobEncomenda?: boolean;
  /** A página tem guia de tamanhos: mostra "Qual meu tamanho?" junto da escolha. */
  temGuiaDeTamanhos?: boolean;
};

export default function AdicionarAoCarrinho({ slug, categoria, nome, opcoes, sobEncomenda = false, temGuiaDeTamanhos = false }: Props) {
  const { adicionar, itens } = useCarrinho();
  const fotoAtiva = useOpcaoAtiva();
  const idGrupo = useId();
  const unica = opcoes.length === 1;

  // Com mais de uma opção, nada vem marcado: "G" pré-escolhido virava
  // compra do tamanho errado por descuido (auditoria de 10/10/2026).
  const [escolhida, setEscolhida] = useState<number | null>(unica ? opcoes[0].idBling : null);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  // Matracas Estampa × Suporte (21/10/2026): um grupo de botões por atributo.
  // Eixo com um valor só (ex.: todas com o mesmo suporte) já vem marcado.
  const eixos = unica ? null : eixosDasOpcoes(opcoes);
  const [escolha, setEscolha] = useState<Record<string, string>>(() =>
    Object.fromEntries((eixos ?? []).filter((e) => e.valores.length === 1).map((e) => [e.chave, e.valores[0]])),
  );

  const opcao = eixos ? acharOpcao(opcoes, eixos, escolha) : (opcoes.find((o) => o.idBling === escolhida) ?? null);
  const noCarrinho = opcao ? (itens.find((i) => i.idBling === opcao.idBling)?.quantidade ?? 0) : 0;
  const disponivelNaOpcao = (o: Opcao) => (sobEncomenda ? MAXIMO_POR_ITEM : o.quantidade);
  const teto = opcao ? Math.max(0, Math.min(disponivelNaOpcao(opcao), MAXIMO_POR_ITEM) - noCarrinho) : 0;
  const esgotada = opcao !== null && disponivelNaOpcao(opcao) <= 0;
  const ehTamanho = opcoes.some((o) => /(^|\s)(PP|P|M|G|GG|XG|XGG|EG|\d+\s*anos?)$/i.test(o.rotulo.trim()));

  function escolher(id: number) {
    setEscolhida(id);
    fotoAtiva?.escolher(id);
    setQuantidade(1);
    setAdicionado(false);
  }

  function escolherNoEixo(chave: string, valor: string) {
    if (!eixos) return;
    const nova = escolherValor(opcoes, eixos, escolha, chave, valor);
    setEscolha(nova);
    // A foto acompanha a estampa assim que ela é escolhida, mesmo sem o suporte.
    const paraFoto = acharOpcao(opcoes, eixos, nova) ?? opcaoParaFoto(opcoes, eixos, nova);
    if (paraFoto) fotoAtiva?.escolher(paraFoto.idBling);
    // Clicou no suporte: a foto mostra a demonstração dele; clicou na estampa:
    // volta a foto da estampa (21/10/2026).
    // Folhas: preto no Boi Blackout, colorido nas outras (chaveDaFotoDoSuporte).
    if (chave === "suporte") fotoAtiva?.destacarSuporte(valor === "Sem suporte" ? null : chaveDaFotoDoSuporte(valor, nova.estampa));
    else fotoAtiva?.destacarSuporte(null);
    setQuantidade(1);
    setAdicionado(false);
  }

  function aoAdicionar() {
    if (!opcao || teto <= 0) return;
    adicionar({
      idBling: opcao.idBling,
      slug,
      categoria,
      nome,
      rotulo: opcao.rotulo,
      preco: opcao.preco,
      quantidade: Math.min(quantidade, teto),
      estoque: disponivelNaOpcao(opcao),
    });
    evento("add_to_cart", {
      currency: "BRL",
      value: opcao.preco * Math.min(quantidade, teto),
      items: [{ item_id: String(opcao.idBling), item_name: nome, item_category: categoria, price: opcao.preco, quantity: Math.min(quantidade, teto) }],
    });
    setQuantidade(1);
    setAdicionado(true);
  }

  // Pesquisa de 29/10: "saber melhor tamanho e caimento" — a tabela existia,
  // mas ficava abaixo do botão de comprar.
  const linkMedidas = temGuiaDeTamanhos ? (
    <a
      href={`#${ANCORA_GUIA_DE_TAMANHOS}`}
      className="mt-3 inline-block text-sm font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro"
    >
      📏 Qual meu tamanho? Ver as medidas
    </a>
  ) : null;

  return (
    <div className="mt-8">
      {eixos &&
        eixos.map((eixo) => {
          const mostrarPreco = eixoMudaPreco(opcoes, eixo);
          return (
            <fieldset key={eixo.chave} className="mt-6 first:mt-0">
              <legend className="font-display text-sm font-semibold text-texto-tenue uppercase">
                {eixo.chave === "suporte"
                  ? eixo.valores.length > 2
                    ? "Escolha o suporte"
                    : "Com ou sem suporte?"
                  : `Escolha a ${eixo.rotulo.toLowerCase()}`}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {eixo.valores.map((valor) => {
                  const id = `${idGrupo}-${eixo.chave}-${valor}`;
                  const existe = valorExiste(opcoes, eixos, escolha, eixo.chave, valor);
                  const marcado = escolha[eixo.chave] === valor;
                  const preco = mostrarPreco ? precoDoValor(opcoes, eixo.chave, valor) : null;
                  return (
                    <label
                      key={valor}
                      htmlFor={id}
                      className={`min-h-11 cursor-pointer rounded-full border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kambada-amarelo-escuro ${
                        marcado
                          ? "border-kambada-amarelo-escuro bg-kambada-amarelo font-semibold text-kambada-grafite"
                          : "border-borda hover:border-kambada-amarelo-escuro"
                      } ${existe ? "" : "border-dashed text-texto-tenue"}`}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`${idGrupo}-${eixo.chave}`}
                        value={valor}
                        checked={marcado}
                        onChange={() => escolherNoEixo(eixo.chave, valor)}
                        className="sr-only"
                      />
                      {rotuloDoValor(eixo.chave, valor)}
                      {preco !== null && <span className={`ml-1 ${marcado ? "" : "text-texto-suave"}`}>· {formatarReais(preco)}</span>}
                      {!existe && <span className="sr-only"> (não existe nesta combinação)</span>}
                    </label>
                  );
                })}
              </div>
              {eixo.chave === "tamanho" && linkMedidas}
            </fieldset>
          );
        })}

      {escolha.suporte && escolha.suporte !== "Sem suporte" && (
        <p className="mt-3 text-sm text-texto-suave">
          A foto do suporte é ilustrativa: a matraca vai com a estampa que você escolheu
          {escolha.estampa ? ` (${rotuloDoValor("estampa", escolha.estampa)})` : ""}.
        </p>
      )}

      {!unica && !eixos && (
        <fieldset>
          <legend className="font-display text-sm font-semibold text-texto-tenue uppercase">
            {ehTamanho ? "Escolha o tamanho" : "Escolha a opção"}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {opcoes.map((o) => {
              const id = `${idGrupo}-${o.idBling}`;
              const semEstoque = disponivelNaOpcao(o) <= 0;
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
          {ehTamanho && linkMedidas}
        </fieldset>
      )}

      {opcao && opcoes.some((o) => o.preco !== opcoes[0].preco) && (
        <p className="mt-4 text-sm text-texto-suave" aria-live="polite">
          {eixos ? eixos.map((e) => rotuloDoValor(e.chave, opcao.atributos?.[e.chave] ?? "")).join(" · ") : opcao.rotulo}:{" "}
          <strong className="font-display text-2xl text-texto">{formatarReais(opcao.preco)}</strong>
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
            disabled={!opcao || teto <= 0}
            className="min-h-12 rounded-full bg-kambada-amarelo px-8 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            Adicionar ao carrinho
          </button>
        </div>
      )}

      {!opcao && (
        <p className="mt-3 text-sm text-texto-suave">
          {eixos
            ? `Escolha ${eixos.filter((e) => !escolha[e.chave]).map((e) => (e.chave === "suporte" ? (e.valores.length > 2 ? "o suporte" : "com ou sem suporte") : `a ${e.rotulo.toLowerCase()}`)).join(" e ") || "outra combinação"} para adicionar ao carrinho.`
            : ehTamanho
              ? "Escolha o tamanho para adicionar ao carrinho."
              : "Escolha uma opção para adicionar ao carrinho."}
        </p>
      )}
      {opcao && teto <= 0 && !esgotada && (
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
