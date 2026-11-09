import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ApoioFapema } from "@/components/play/ApoioFapema";
import { BotaoSair } from "@/components/escola/BotaoSair";
import { NavPortal } from "@/components/escola/NavPortal";
import { Bandeirinhas } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { quemNaPagina } from "@/lib/escola/pagina";
import { escolaPublica } from "@/lib/escola/servico";
import { NOME_PAPEL } from "@/lib/escola/tipos";

export const metadata: Metadata = {
  title: { absolute: "Kambada Play na escola", template: "%s | Kambada Play na escola" },
  robots: { index: false, follow: false },
};

/**
 * Raiz do portal da escola (só no subdomínio `modelo.`; ver lib/escola/host.ts).
 * O layout da loja continua por fora (é o layout raiz); aqui escondemos o
 * cabeçalho, o rodapé, o WhatsApp e a pesquisa da loja: nada de carrinho nem
 * pesquisa de satisfação na tela de uma criança.
 */
const ESCONDE_LOJA = `body:has(.escola-root) > :not(main):not(script):not(next-route-announcer){display:none!important}`;

export default async function EscolaLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const [escola, quem] = await Promise.all([escolaPublica(), quemNaPagina()]);
  const nav =
    quem?.papel === "aluno"
      ? [["Início", "/aluno", "🏠"], ["Desafios", "/aluno/desafios", "🎯"], ["Quiz", "/aluno/quiz", "❓"], ["Cultura", "/aluno/cultura", "🌴"], ["Minhas notas", "/aluno/notas", "📊"], ["Ranking", "/ranking", "🏆"]]
      : quem?.papel === "professor"
        ? [["Minhas turmas", "/professor"], ["Fora da tela", "/imprimir"], ["Ranking", "/ranking"], ["Senha", "/senha"]]
        : quem?.papel === "coordenacao"
          ? [["Painel", "/coordenacao"], ["Fora da tela", "/imprimir"], ["Ranking", "/ranking"], ["Senha", "/senha"]]
          : quem?.papel === "gestor"
            ? [["Hub Kambada", "/gestor"], ["Visão da coordenação", "/coordenacao"], ["Turmas", "/professor"], ["Ranking", "/ranking"], ["Senha", "/senha"]]
            : [];
  const nomeDeQuem = quem ? (quem.papel === "aluno" ? `${quem.aluno.avatar} ${quem.aluno.apelido} · ${quem.turma.nome}` : quem.membro.nome) : null;
  const papel = quem ? NOME_PAPEL[quem.papel] : null;

  return (
    <div className="escola-root flex min-h-screen flex-col bg-fundo text-texto" style={{ "--escola": escola.cor } as React.CSSProperties}>
      <style>{ESCONDE_LOJA}</style>
      <header className="bg-kambada-grafite text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
          <Link href={rotaEscola()} className="flex items-center gap-3" aria-label={`${escola.nome} · Kambada Play`}>
            <Image src="/marca/kambada-logo-horizontal-amarelo.png" alt="Kambada" width={360} height={120} priority className="h-auto w-28" />
            <span className="h-9 w-px bg-white/25" aria-hidden />
            <span className="grid h-10 w-10 place-items-center rounded-xl font-display font-extrabold text-white" style={{ background: "var(--escola)" }}>
              {escola.sigla}
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold">{escola.nome}</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-kambada-amarelo">Play na escola</span>
            </span>
          </Link>
          {nav.length > 0 && (
            <NavPortal itens={nav.map(([rotulo, caminho, icone]) => ({ rotulo, href: rotaEscola(caminho), icone }))} aluno={quem?.papel === "aluno"} />
          )}
          {nomeDeQuem && (
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="text-right leading-tight">
                <span className="block text-white/90">{nomeDeQuem}</span>
                <span className="block text-[11px] uppercase tracking-wider text-kambada-amarelo">{papel}</span>
              </span>
              <BotaoSair />
            </div>
          )}
        </div>
        <Bandeirinhas className="block h-5 w-full" />
      </header>
      {escola.demo && (
        <p className="px-4 py-1.5 text-center text-xs font-semibold text-white" style={{ background: "var(--escola)" }}>
          Demonstração · escola e alunos fictícios · alunos aparecem só por apelido
        </p>
      )}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
      <footer className="bg-kambada-grafite px-4 py-8 text-center text-xs text-white/70">
        <Image src="/marca/kambada-logo-horizontal-amarelo.png" alt="Kambada" width={360} height={120} className="mx-auto h-auto w-32" />
        <p className="mt-3">Aluno entra só com apelido e código da turma · sem rastreador de publicidade · os dados são da escola</p>
        <p className="mt-1">
          <ApoioFapema compacto />
        </p>
      </footer>
    </div>
  );
}
