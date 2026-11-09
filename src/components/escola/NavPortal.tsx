"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Menu do portal com o "você está aqui": a página atual fica marcada (cor e
 * `aria-current`), e o aluno vê um ícone ao lado de cada palavra, para quem
 * ainda lê devagar. Sem item marcado por engano: vale o caminho mais longo
 * que casa; o que sobra dentro de /aluno/ (um desafio, o Arraial) é Desafios.
 */
export function NavPortal({ itens, aluno }: { itens: { rotulo: string; href: string; icone?: string }[]; aluno: boolean }) {
  const caminho = usePathname() ?? "";
  const casa = (href: string) => caminho === href || caminho.startsWith(`${href}/`);
  let ativo = itens.filter((i) => casa(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  if (aluno && ativo && ativo === itens[0]?.href && caminho !== itens[0].href) {
    ativo = itens.find((i) => i.rotulo === "Desafios")?.href ?? ativo;
  }
  return (
    <>
      {aluno && (
        // No celular, o menu do aluno vira barra de abas no rodapé (ícone + palavra), sempre ao alcance do polegar.
        <>
          <nav aria-label="Portal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-white/15 bg-kambada-grafite pb-[env(safe-area-inset-bottom)] sm:hidden">
            {itens.map((i) => {
              const aqui = i.href === ativo;
              return (
                <Link key={i.href} href={i.href} aria-current={aqui ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold leading-tight ${aqui ? "text-kambada-amarelo" : "text-white/80"}`}>
                  <span aria-hidden className={`grid h-7 w-10 place-items-center rounded-full text-lg ${aqui ? "bg-kambada-amarelo/20" : ""}`}>{i.icone}</span>
                  {i.rotulo === "Minhas notas" ? "Notas" : i.rotulo}
                </Link>
              );
            })}
          </nav>
          {/* Espaço no fim da página para a barra não cobrir o rodapé. */}
          <style>{`@media (max-width: 639px) { .escola-root { padding-bottom: 4.5rem } }`}</style>
        </>
      )}
    <nav className={`${aluno ? "hidden sm:flex" : "flex"} flex-wrap gap-1 text-sm font-semibold sm:ml-2`} aria-label="Portal">
      {itens.map((i) => {
        const aqui = i.href === ativo;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={aqui ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 ${aqui ? "bg-kambada-amarelo text-kambada-grafite" : "hover:bg-white/10 hover:text-kambada-amarelo"}`}
          >
            {i.icone && <span aria-hidden className="mr-1">{i.icone}</span>}
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
