import Image from "next/image";
import Link from "next/link";
import type { Produto } from "@/lib/catalogo";
import { disponibilidade, precoExibido } from "@/lib/catalogo";
import { fotoDoProduto } from "@/lib/fotoDoProduto";

export default function CartaoProduto({ produto }: { produto: Produto }) {
  const estoque = disponibilidade(produto);
  const href = `/loja/${produto.categoria}/${produto.slug}`;
  const foto = fotoDoProduto(produto);

  return (
    <li className="group relative flex flex-col rounded-2xl border border-borda bg-superficie p-6 transition-colors hover:border-kambada-amarelo-escuro">
      {foto ? (
        <div className="relative mb-5 h-56 overflow-hidden rounded-xl bg-white">
          <Image
            src={foto.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        // Peça ainda sem foto no acervo: espaço honesto, não imagem genérica.
        <div
          aria-hidden="true"
          className="mb-5 flex h-56 items-center justify-center rounded-xl border border-dashed border-borda text-3xl"
        >
          🦀
        </div>
      )}

      <h3 className="font-display text-lg leading-snug font-semibold">
        {/*
          O link cobre o cartão inteiro (via `after:absolute`), para que o alvo
          de toque seja o cartão e não só o texto — mas quem lê com leitor de
          tela ouve apenas o nome da peça, que é o rótulo certo.
        */}
        <Link
          href={href}
          className="after:absolute after:inset-0 group-hover:text-kambada-amarelo-escuro"
        >
          {produto.nome}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-texto-suave">
        <span className="sr-only">Opções disponíveis: </span>
        {produto.variacoes.join(" · ")}
      </p>

      <p className="mt-4 font-display text-xl font-bold">
        {precoExibido(produto)}
      </p>

      <p className="mt-1 text-xs font-medium text-texto-tenue">
        {estoque.texto}
      </p>

      <p
        aria-hidden="true"
        className={
          estoque.disponivel
            ? "mt-4 rounded-full bg-kambada-amarelo px-5 py-3 text-center font-display text-sm font-semibold text-kambada-grafite transition-colors group-hover:bg-kambada-amarelo-escuro"
            : "mt-4 rounded-full border border-borda px-5 py-3 text-center font-display text-sm font-semibold text-texto-tenue"
        }
      >
        {estoque.disponivel ? "Ver peça" : "Esgotado"}
      </p>
    </li>
  );
}
