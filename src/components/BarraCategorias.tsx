import Link from "next/link";
import { CATEGORIAS } from "@/lib/catalogo";

/**
 * Atalhos de categoria, presentes em toda página da loja.
 * `ativa` recebe o slug da categoria atual (ou nada, na vitrine completa).
 */
export default function BarraCategorias({ ativa }: { ativa?: string }) {
  const itens = [{ slug: "", nome: "Tudo" }, ...CATEGORIAS];

  return (
    <nav aria-label="Categorias da loja" className="border-b border-borda">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="-mx-1 flex gap-2 overflow-x-auto py-3">
          {itens.map((item) => {
            const href = item.slug ? `/loja/${item.slug}` : "/loja";
            const selecionada = (ativa ?? "") === item.slug;
            return (
              <li key={item.slug || "tudo"} className="shrink-0">
                <Link
                  href={href}
                  aria-current={selecionada ? "page" : undefined}
                  className={
                    selecionada
                      ? "block rounded-full bg-kambada-amarelo px-5 py-2 font-display text-sm font-semibold text-kambada-grafite"
                      : "block rounded-full border border-borda px-5 py-2 font-display text-sm font-semibold text-texto-suave transition-colors hover:border-kambada-amarelo-escuro hover:text-kambada-amarelo-escuro"
                  }
                >
                  {item.nome}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
