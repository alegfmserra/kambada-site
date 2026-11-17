"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useId, type ReactNode } from "react";
import { evento } from "@/lib/analytics/eventos";
import { tipoDaPagina } from "@/lib/analytics/cliques";
import {
  aplicar,
  escolhaParaUrl,
  lerEscolha,
  ORDENS,
  publicosDaLista,
  ROTULO_DO_PUBLICO,
  SEM_ESCOLHA,
  tamanhosDaLista,
  temFiltro,
  type Escolha,
  type ItemFiltravel,
  type Ordem,
} from "@/lib/loja/filtros";

/**
 * Vitrine de uma categoria com ordenação e, nas Camisas, filtro de público e de
 * tamanho disponível (17/11/2026).
 *
 * Os cartões chegam prontos do servidor (`cartoes`, na ordem da vitrine); aqui só
 * se decide quais aparecem e em que ordem. Assim a página continua estática e o
 * Google lê a lista inteira, sem parâmetros. A escolha mora na URL
 * (?publico=infantil&tamanho=M&ordem=preco) para o link poder ser compartilhado;
 * o endereço oficial (canonical) segue sendo o da categoria, sem parâmetros.
 */
type Props = {
  /** Dados de filtro de cada peça, na mesma ordem de `cartoes`. */
  itens: ItemFiltravel[];
  cartoes: ReactNode[];
  /** Nome da lista para a medição ("Categoria: Camisas"). */
  lista: string;
};

const classeDoChip = (ligado: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-4 font-display text-sm font-semibold transition-colors ${
    ligado
      ? "bg-kambada-amarelo text-kambada-grafite"
      : "border border-borda-campo text-texto hover:border-kambada-amarelo-escuro"
  }`;

/** Lê a escolha da URL e a reescreve a cada mudança (só no navegador). */
function ComUrl({ itens, cartoes, lista }: Props) {
  const caminho = usePathname() ?? "/";
  const parametros = useSearchParams();
  const escolha = lerEscolha(new URLSearchParams(parametros?.toString() ?? ""), itens);

  /** Troca a escolha e escreve na URL sem recarregar nem empilhar histórico. */
  function mudar(nova: Escolha, alvo: string) {
    // Tamanho que não existe no público novo sai junto (P de adulto não vale em infantil).
    const tamanhoVale = nova.tamanho && tamanhosDaLista(itens, nova.publico).includes(nova.tamanho);
    const limpa = { ...nova, tamanho: tamanhoVale ? nova.tamanho : null };
    // Mantém o que mais houver na URL (utm, por exemplo); só troca os três parâmetros daqui.
    const q = new URLSearchParams(window.location.search);
    for (const chave of ["publico", "tamanho", "ordem"]) q.delete(chave);
    for (const [chave, valor] of new URLSearchParams(escolhaParaUrl(limpa))) q.set(chave, valor);
    const texto = q.toString();
    window.history.replaceState(null, "", `${caminho}${texto ? `?${texto}` : ""}`);
    evento("clique", { area: "filtros", alvo, pagina: tipoDaPagina(caminho) });
  }

  return <Painel itens={itens} cartoes={cartoes} lista={lista} escolha={escolha} mudar={mudar} />;
}

function Painel({ itens, cartoes, lista, escolha, mudar }: Props & { escolha: Escolha; mudar: (nova: Escolha, alvo: string) => void }) {
  const idOrdem = useId();
  const publicos = publicosDaLista(itens);
  const tamanhos = tamanhosDaLista(itens, escolha.publico);
  const indices = aplicar(itens, escolha);

  return (
    <>
      <div className="mb-8 space-y-5" data-area="filtros">
        {publicos.length > 0 && (
          <div role="group" aria-label="Filtrar por público">
            <p className="font-display text-sm font-semibold text-texto-suave">Para quem</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {publicos.map((p) => {
                const ligado = escolha.publico === p;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={ligado}
                    data-evento="clique"
                    onClick={() => mudar({ ...escolha, publico: ligado ? null : p }, `publico-${p}`)}
                    className={classeDoChip(ligado)}
                  >
                    {ROTULO_DO_PUBLICO[p]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tamanhos.length > 0 && (
          <div role="group" aria-label="Filtrar por tamanho disponível">
            <p className="font-display text-sm font-semibold text-texto-suave">Tamanho disponível</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tamanhos.map((t) => {
                const ligado = escolha.tamanho === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={ligado}
                    data-evento="clique"
                    onClick={() => mudar({ ...escolha, tamanho: ligado ? null : t }, `tamanho-${t.replace(/\s+/g, "-").toLowerCase()}`)}
                    className={classeDoChip(ligado)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p role="status" aria-live="polite" className="text-sm text-texto-suave">
            {indices.length === 0
              ? "Nenhuma peça com esses filtros"
              : `${indices.length} ${indices.length === 1 ? "peça" : "peças"}${indices.length < itens.length ? ` de ${itens.length}` : ""}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={idOrdem} className="text-sm font-semibold">
              Ordenar por
            </label>
            <select
              id={idOrdem}
              value={escolha.ordem}
              onChange={(e) => mudar({ ...escolha, ordem: e.target.value as Ordem }, `ordem-${e.target.value}`)}
              className="min-h-11 rounded-xl border border-borda-campo bg-superficie px-3 py-2 text-sm text-texto"
            >
              {ORDENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
            {temFiltro(escolha) && (
              <button
                type="button"
                data-evento="clique"
                onClick={() => mudar(SEM_ESCOLHA, "limpar-filtros")}
                className="min-h-11 px-1 text-sm font-semibold text-texto underline underline-offset-4 hover-marca"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {indices.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-lista={lista}>
          {indices.map((i) => cartoes[i])}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-borda bg-superficie p-10 text-center">
          <p className="font-display text-xl font-bold">Nenhuma peça com esses filtros</p>
          <p className="mt-2 text-texto-suave">Tire um filtro ou veja todas as peças da categoria.</p>
          <button
            type="button"
            data-evento="clique"
            onClick={() => mudar(SEM_ESCOLHA, "limpar-filtros")}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-kambada-amarelo px-7 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </>
  );
}

export default function VitrineFiltrada(props: Props) {
  // Ler a URL no navegador exige uma fronteira de espera. Até lá (e no HTML que o
  // Google lê) aparece a lista completa com os controles no padrão, para a página
  // não pular quando os filtros ligam.
  return (
    <Suspense fallback={<Painel {...props} escolha={SEM_ESCOLHA} mudar={() => {}} />}>
      <ComUrl {...props} />
    </Suspense>
  );
}
