import Image from "next/image";
import Link from "next/link";
import type { Produto } from "@/lib/catalogo";
import { disponibilidade, precoExibido } from "@/lib/catalogo";
import { fotoDoProduto } from "@/lib/fotoDoProduto";
import { eixosDasOpcoes } from "@/lib/loja/seletorDuplo";

/** Até quantas opções o cartão mostra como quadrinhos; acima disso, só o resumo. */
const MAXIMO_DE_QUADRINHOS = 6;

/**
 * As opções no cartão da vitrine, sem textão (Alexandre, 21/10/2026): a matraca
 * listava as 56 combinações estampa × suporte por extenso. Agora, produto com
 * dois eixos mostra só "14 estampas · 4 suportes"; lista curta vira
 * quadrinhos; lista longa, "N opções". A escolha em si fica na página da peça.
 */
function ResumoDasOpcoes({ produto }: { produto: Produto }) {
  const eixos = eixosDasOpcoes(produto.opcoes ?? []);
  if (eixos) {
    return (
      <p className="mt-2 flex-1 text-sm text-texto-suave">
        {eixos.map((e) => `${e.valores.length} ${e.valores.length === 1 ? e.chave : `${e.chave}s`}`).join(" · ")}
      </p>
    );
  }
  if (produto.variacoes.length > MAXIMO_DE_QUADRINHOS) {
    return <p className="mt-2 flex-1 text-sm text-texto-suave">{produto.variacoes.length} opções</p>;
  }
  return (
    <ul className="mt-2 flex flex-1 flex-wrap content-start gap-1.5" aria-label="Opções disponíveis">
      {produto.variacoes.map((v) => (
        <li key={v} className="rounded-md border border-borda px-2 py-0.5 text-xs text-texto-suave">
          {v}
        </li>
      ))}
    </ul>
  );
}

/**
 * `compacto` (vitrine da home, 18/11/2026): o mesmo cartão com menos moldura
 * (respiro menor, nome e preço um degrau menores, sem a lista de opções). A foto
 * é a mesma, na mesma proporção e no mesmo recorte.
 */
export default function CartaoProduto({ produto, compacto = false }: { produto: Produto; compacto?: boolean }) {
  const estoque = disponibilidade(produto);
  const href = `/loja/${produto.categoria}/${produto.slug}`;
  const foto = fotoDoProduto(produto);

  return (
    <li className={`group relative flex flex-col rounded-2xl border border-borda bg-superficie transition-colors hover:border-kambada-amarelo-escuro ${compacto ? "p-3 sm:p-4" : "p-6"}`}>
      {foto ? (
        <div className={`relative aspect-[4/5] overflow-hidden rounded-xl ${compacto ? "mb-3" : "mb-5"}`}>
          {/* 4:5 é quase a proporção das fotos (3:4): a peça inteira, sem barra. */}
          <Image
            src={foto.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        // Peça ainda sem foto no acervo: espaço honesto, não imagem genérica.
        <div
          aria-hidden="true"
          className={`flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed border-borda text-3xl ${compacto ? "mb-3" : "mb-5"}`}
        >
          🦀
        </div>
      )}

      <h3 className={`font-display leading-snug font-semibold ${compacto ? "flex-1 text-base" : "text-lg"}`}>
        {/*
          O link cobre o cartão inteiro (via `after:absolute`), para que o alvo
          de toque seja o cartão e não só o texto — mas quem lê com leitor de
          tela ouve apenas o nome da peça, que é o rótulo certo.
        */}
        <Link
          href={href}
          // Medição: o clique no cartão vira `select_item` (ver lib/analytics/cliques.ts).
          data-evento="select_item"
          data-item-id={String(produto.idBling ?? produto.slug)}
          data-item-nome={produto.nome}
          data-item-categoria={produto.categoria}
          className="after:absolute after:inset-0 group-hover:text-kambada-amarelo-escuro"
        >
          {produto.nome}
        </Link>
      </h3>

      {!compacto && <ResumoDasOpcoes produto={produto} />}

      <p className={`font-display font-bold ${compacto ? "mt-2 text-lg" : "mt-4 text-xl"}`}>
        {precoExibido(produto)}
      </p>

      <p className="mt-1 text-xs font-medium text-texto-tenue">
        {estoque.texto}
      </p>

      <p
        aria-hidden="true"
        className={
          estoque.disponivel
            ? `rounded-full bg-kambada-amarelo px-5 text-center font-display text-sm font-semibold text-kambada-grafite transition-colors group-hover:bg-kambada-amarelo-escuro ${compacto ? "mt-3 py-2" : "mt-4 py-3"}`
            : `rounded-full border border-borda px-5 text-center font-display text-sm font-semibold text-texto-tenue ${compacto ? "mt-3 py-2" : "mt-4 py-3"}`
        }
      >
        Ver peça
      </p>
    </li>
  );
}
