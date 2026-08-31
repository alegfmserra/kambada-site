import type { Produto } from "@/lib/catalogo";
import { disponibilidade, precoExibido } from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/site";

export default function CartaoProduto({ produto }: { produto: Produto }) {
  const estoque = disponibilidade(produto);

  return (
    <li className="flex flex-col rounded-2xl border border-borda bg-superficie p-6">
      {/* Sem foto ainda: as imagens dos produtos entram junto com o Bling. */}
      <div
        aria-hidden="true"
        className="mb-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-borda text-3xl"
      >
        🦀
      </div>

      <h3 className="font-display text-lg leading-snug font-semibold">
        {produto.nome}
      </h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-texto-suave">
        <span className="sr-only">Opções disponíveis: </span>
        {produto.variacoes.join(" · ")}
      </p>

      <p className="mt-4 font-display text-xl font-bold">
        {precoExibido(produto)}
      </p>

      <p
        className={
          estoque.disponivel
            ? "mt-1 text-xs font-medium text-texto-tenue"
            : "mt-1 text-xs font-medium text-texto-tenue"
        }
      >
        {estoque.texto}
      </p>

      {estoque.disponivel ? (
        <a
          href={linkWhatsApp(
            `Oi! Tenho interesse na peça "${produto.nome}". Ainda tem disponível?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 rounded-full bg-kambada-amarelo px-5 py-3 text-center font-display text-sm font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Pedir pelo WhatsApp
        </a>
      ) : (
        <p className="mt-4 rounded-full border border-borda px-5 py-3 text-center font-display text-sm font-semibold text-texto-tenue">
          Esgotado
        </p>
      )}
    </li>
  );
}
