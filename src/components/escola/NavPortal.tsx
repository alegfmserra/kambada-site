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
    <nav className="flex flex-wrap gap-1 text-sm font-semibold sm:ml-2" aria-label="Portal">
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
  );
}
