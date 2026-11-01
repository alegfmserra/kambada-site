import Link from "next/link";
import { IdentidadeEscola, RestaurarDemo } from "@/components/escola/Coordenacao";
import { GestaoPessoas, GestaoTurmasHub } from "@/components/escola/Gestor";
import { Etiqueta, FalaKambadinha, Micangas, TituloDuo } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { CORES_ESCOLA, equipe, escolaPublica, visaoGeral } from "@/lib/escola/servico";

export const metadata = { title: "Hub Kambada" };

function Secao({ id, etiqueta, titulo, children }: { id: string; etiqueta: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div>
        <Etiqueta>{etiqueta}</Etiqueta>
        <h2 className="font-display text-2xl font-extrabold">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

/** Quem pode o quê: a régua que o servidor aplica (servico.ts), escrita para gente. */
const SIM = "✓";
const NAO = "—";
const LIGADO = "se ligado";
const MATRIZ: [string, string, string, string, string][] = [
  ["Jogar os desafios da etapa da turma", SIM, NAO, NAO, NAO],
  ["Ver o ranking", SIM, SIM, SIM, SIM],
  ["Ver relatório por habilidade", NAO, LIGADO, SIM, SIM],
  ["Cadastrar alunos (apelido)", NAO, LIGADO, SIM, SIM],
  ["Imprimir cartões e trocar figuras", NAO, LIGADO, SIM, SIM],
  ["Remover alunos", NAO, LIGADO, SIM, SIM],
  ["Cadastrar professor e vincular turmas", NAO, NAO, SIM, SIM],
  ["Criar, editar e apagar turmas", NAO, NAO, SIM, SIM],
  ["Identidade do portal (nome, sigla, cor)", NAO, NAO, SIM, SIM],
  ["Cadastrar e remover a coordenação", NAO, NAO, NAO, SIM],
  ["Ligar e desligar permissões do professor", NAO, NAO, NAO, SIM],
  ["Suspender acesso e editar dados da equipe", NAO, NAO, NAO, SIM],
  ["Restaurar a demonstração e ver o registro", NAO, NAO, NAO, SIM],
];

const ATALHOS: [string, string][] = [
  ["#pessoas", "Pessoas e permissões"],
  ["#turmas", "Turmas"],
  ["#regras", "Quem pode o quê"],
  ["#portal", "Portal"],
  ["#registro", "Registro"],
];

export default async function GestorPagina() {
  const { membro } = await exigir("gestor");
  const [visao, eq, escola] = await Promise.all([visaoGeral(membro), equipe(membro), escolaPublica()]);
  const professores = eq.membros.filter((m) => m.papel === "professor");
  const pessoas = eq.membros.filter((m) => m.papel !== "gestor");
  const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Fortaleza" });

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-kambada-grafite p-6 text-white ring-1 ring-white/10 sm:p-8">
        <div className="space-y-4">
          <Etiqueta escuro>Gestão Kambada · {escola.nome}</Etiqueta>
          <TituloDuo antes="Hub de gestão" destaque="da escola" escuro />
          <FalaKambadinha escuro>Daqui tu cria os acessos, liga e desliga o que cada professor pode e acompanha tudo da escola.</FalaKambadinha>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            [visao.turmas, "turmas"],
            [visao.alunos, "alunos"],
            [visao.professores, "professores"],
            [visao.coordenacao, "coordenação"],
            [visao.ativos7d, "jogaram em 7 dias"],
            [visao.respostas7d, "respostas em 7 dias"],
          ].map(([n, r]) => (
            <div key={String(r)} className="rounded-2xl bg-white/10 p-4">
              <p className="font-display text-3xl font-extrabold text-kambada-amarelo">{n}</p>
              <p className="text-sm text-white/70">{r}</p>
            </div>
          ))}
        </div>
        {visao.suspensos > 0 && (
          <p className="mt-4 text-sm font-semibold text-kambada-amarelo">
            {visao.suspensos} {visao.suspensos === 1 ? "acesso suspenso" : "acessos suspensos"}
          </p>
        )}
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Seções do hub">
        {ATALHOS.map(([href, rotulo]) => (
          <a key={href} href={href} className="rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo">
            {rotulo}
          </a>
        ))}
        <Link href={rotaEscola("/coordenacao")} className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
          Ver como a coordenação →
        </Link>
      </nav>

      <Secao id="pessoas" etiqueta="Acessos da equipe" titulo="Pessoas e permissões">
        <p className="text-texto-suave">
          Cada professor só vê as turmas marcadas. As chaves verdes dizem o que ele pode fazer nelas; desligou, vale na hora (inclusive para quem já está dentro).
        </p>
        <GestaoPessoas membros={pessoas} turmas={eq.turmas} />
      </Secao>

      <Micangas className="mx-auto h-4 w-72 text-texto" />

      <Secao id="turmas" etiqueta="Escola" titulo="Turmas">
        <GestaoTurmasHub turmas={eq.turmas} professores={professores} />
      </Secao>

      <Secao id="regras" etiqueta="Régua de acesso" titulo="Quem pode o quê">
        <div className="overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full min-w-[38rem] text-sm">
            <thead className="bg-kambada-grafite text-left text-white">
              <tr>
                <th className="px-3 py-2.5">Ação</th>
                <th className="px-3 py-2.5 text-center">Aluno</th>
                <th className="px-3 py-2.5 text-center">Professor</th>
                <th className="px-3 py-2.5 text-center">Coordenação</th>
                <th className="px-3 py-2.5 text-center text-kambada-amarelo">Gestão Kambada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {MATRIZ.map(([acao, ...cols]) => (
                <tr key={acao}>
                  <td className="px-3 py-2">{acao}</td>
                  {cols.map((v, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2 text-center font-bold ${v === SIM ? "text-kambada-green" : v === LIGADO ? "text-xs text-kambada-amarelo-escuro" : "text-texto-tenue"}`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-texto-suave">“Se ligado” = depende das chaves do professor em Pessoas e permissões. Professor e coordenação só veem a escola deles.</p>
      </Secao>

      <Secao id="portal" etiqueta="Portal" titulo="Identidade e demonstração">
        <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
          <IdentidadeEscola escola={escola} cores={CORES_ESCOLA} />
          {escola.demo && (
            <div className="space-y-2 rounded-2xl bg-superficie p-4">
              <p className="font-bold">Demonstração</p>
              <p className="text-sm text-texto-suave">Volta turmas, alunos, professores e senhas ao estado da ficha. O seu acesso Kambada fica como está.</p>
              <RestaurarDemo />
            </div>
          )}
        </div>
      </Secao>

      <Secao id="registro" etiqueta="Histórico" titulo="Registro de atividades">
        {visao.log.length === 0 ? (
          <p className="rounded-2xl bg-superficie p-4 text-sm text-texto-suave">Nada registrado ainda. Cadastros, permissões, turmas e senhas aparecem aqui.</p>
        ) : (
          <ol className="divide-y divide-borda rounded-2xl border border-borda">
            {visao.log.map((e, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 px-4 py-2.5 text-sm">
                <span className="w-24 shrink-0 tabular-nums text-texto-suave">{quando.format(new Date(e.em))}</span>
                <b>{e.quem}</b>
                <span>{e.texto}</span>
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </div>
  );
}
