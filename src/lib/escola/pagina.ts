import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { rotaEscola } from "./host";
import { quemEsta, type Quem } from "./servico";
import { COOKIE_ESCOLA, lerSessaoEscola } from "./sessao";
import type { Papel } from "./tipos";

/** Para as páginas do portal (componentes de servidor). */
export async function quemNaPagina(): Promise<Quem | null> {
  const c = await cookies();
  return quemEsta(lerSessaoEscola(c.get(COOKIE_ESCOLA)?.value));
}

export function inicioDoPapel(p: Papel): string {
  return rotaEscola({ aluno: "/aluno", professor: "/professor", coordenacao: "/coordenacao", gestor: "/gestor" }[p]);
}

/** Sem sessão (ou papel errado) → tela de entrada certa. */
export async function exigir<P extends Papel>(...papeis: P[]): Promise<Extract<Quem, { papel: P }>> {
  const q = await quemNaPagina();
  if (!q) redirect(rotaEscola(papeis.includes("aluno" as P) ? "/entrar" : "/equipe"));
  if (!papeis.includes(q.papel as P)) redirect(inicioDoPapel(q.papel));
  return q as Extract<Quem, { papel: P }>;
}
