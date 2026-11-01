import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Etiqueta, FalaKambadinha, Micangas, TituloDuo } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";
import { escolaPublica } from "@/lib/escola/servico";

/** Entrada do portal: quem já entrou vai para a sua tela; quem não, escolhe a porta. */
export default async function PortalDaEscola() {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  const escola = await escolaPublica();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-kambada-grafite p-6 text-white ring-1 ring-white/10 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <Etiqueta escuro>Kambada Play · {escola.nome}</Etiqueta>
            <TituloDuo antes="A cultura do Maranhão" destaque="no jogo da sala de aula." escuro />
            <p className="max-w-lg text-white/80">
              Desafios de matemática, português e inglês dentro do arraial, do mangue e da barraca de juçara. O professor vê quem já
              entendeu e quem precisa de reforço.
            </p>
            <FalaKambadinha escuro>Éguas! Chegou a escola! Bora jogar?</FalaKambadinha>
          </div>
          <div className="relative mx-auto w-full max-w-xs">
            <div className="rounded-2xl bg-white/10 p-4">
              <Etiqueta escuro>Agora na escola</Etiqueta>
              <div className="mt-3 flex gap-4">
                <Image src="/escola/capa-tambor.webp" alt="Capa da HQ Kambadinha em: Na Batida do Tambor" width={120} height={170} className="h-auto w-24 rounded-lg shadow-lg" />
                <div>
                  <p className="text-2xl" aria-hidden>{escola.temporada.emoji}</p>
                  <p className="font-display font-bold leading-tight">{escola.temporada.titulo}</p>
                  <p className="mt-1 text-sm text-white/75">{escola.temporada.texto}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href={rotaEscola("/entrar")} className="group relative overflow-hidden rounded-3xl border-2 border-borda p-6 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-kambada-amarelo" aria-hidden />
          <span className="text-5xl" aria-hidden>🎒</span>
          <h2 className="mt-3 font-display text-2xl font-extrabold">Sou aluno</h2>
          <p className="mt-1 text-texto-suave">Código da turma, o seu apelido e as suas 3 figuras. Sem e-mail, sem senha de letras.</p>
          <span className="mt-5 inline-flex rounded-full bg-kambada-amarelo px-5 py-2.5 font-bold text-kambada-grafite">Entrar para jogar →</span>
        </Link>
        <Link href={rotaEscola("/equipe")} className="group relative overflow-hidden rounded-3xl border-2 border-borda p-6 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo">
          <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: "var(--escola)" }} aria-hidden />
          <span className="text-5xl" aria-hidden>🧑‍🏫</span>
          <h2 className="mt-3 font-display text-2xl font-extrabold">Sou professor ou coordenação</h2>
          <p className="mt-1 text-texto-suave">Turmas, apelidos, cartões de acesso e o relatório por habilidade.</p>
          <span className="mt-5 inline-flex rounded-full border-2 border-borda px-5 py-2 font-bold group-hover:border-kambada-amarelo">Entrar com usuário e senha →</span>
        </Link>
      </section>

      <Micangas className="mx-auto h-4 w-72 text-texto" />

      <section className="space-y-5">
        <div className="text-center">
          <Etiqueta>Cada um vê o que precisa</Etiqueta>
          <TituloDuo antes="Três perfis," destaque="um só portal." nivel={2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["🎒", "Aluno", "Entra só com apelido e código da turma. Joga os desafios e sobe no ranking.", "#FFCC29"],
            ["🧑‍🏫", "Professor", "Cadastra os apelidos, imprime os cartões e vê quem já entendeu e quem precisa de reforço.", "#D4432B"],
            ["🏫", "Coordenação", "Cadastra professores e turmas e acompanha o relatório geral da escola.", "#518FC2"],
          ].map(([e, t, d, cor]) => (
            <div key={t} className="rounded-2xl bg-superficie p-5" style={{ borderTop: `4px solid ${cor}` }}>
              <p className="text-3xl" aria-hidden>{e}</p>
              <h3 className="mt-2 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-texto-suave">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
