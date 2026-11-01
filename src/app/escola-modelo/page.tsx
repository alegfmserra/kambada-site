import Link from "next/link";
import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";
import { inicioDoPapel, quemNaPagina } from "@/lib/escola/pagina";
import { escolaPublica } from "@/lib/escola/servico";

/** Entrada do portal: quem já entrou vai para a sua tela; quem não, escolhe a porta. */
export default async function PortalDaEscola() {
  const quem = await quemNaPagina();
  if (quem) redirect(inicioDoPapel(quem.papel));
  const escola = await escolaPublica();

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-kambada-grafite p-6 text-white sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-kambada-amarelo">Kambada Play · {escola.nome}</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          A cultura do Maranhão no jogo da sala de aula.
        </h1>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
          <span className="text-3xl" aria-hidden>{escola.temporada.emoji}</span>
          <span>
            <span className="block text-xs uppercase tracking-wider text-white/60">Agora na escola</span>
            <span className="block font-bold">{escola.temporada.titulo}</span>
            <span className="block text-sm text-white/80">{escola.temporada.texto}</span>
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href={rotaEscola("/entrar")} className="group rounded-3xl border-2 border-borda p-6 transition-colors hover:border-kambada-amarelo">
          <span className="text-4xl" aria-hidden>🎒</span>
          <h2 className="mt-3 font-display text-2xl font-bold">Sou aluno</h2>
          <p className="mt-1 text-texto-suave">Digite o código da turma, escolha o seu apelido e as suas figuras.</p>
          <span className="mt-4 inline-block font-bold text-texto group-hover:underline">Entrar para jogar →</span>
        </Link>
        <Link href={rotaEscola("/equipe")} className="group rounded-3xl border-2 border-borda p-6 transition-colors hover:border-kambada-amarelo">
          <span className="text-4xl" aria-hidden>🧑‍🏫</span>
          <h2 className="mt-3 font-display text-2xl font-bold">Sou professor ou coordenação</h2>
          <p className="mt-1 text-texto-suave">Turmas, apelidos, cartões de acesso e o relatório por habilidade.</p>
          <span className="mt-4 inline-block font-bold text-texto group-hover:underline">Entrar com usuário e senha →</span>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["🎒", "Aluno", "Entra só com apelido, código da turma e senha de figuras. Joga e sobe no ranking."],
          ["🧑‍🏫", "Professor", "Cadastra os apelidos, imprime os cartões e vê quem já entendeu e quem precisa de reforço."],
          ["🏫", "Coordenação", "Cadastra professores e turmas e acompanha o relatório geral da escola."],
        ].map(([e, t, d]) => (
          <div key={t} className="rounded-2xl bg-superficie p-5">
            <p className="text-2xl" aria-hidden>{e}</p>
            <h3 className="mt-2 font-bold">{t}</h3>
            <p className="mt-1 text-sm text-texto-suave">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
