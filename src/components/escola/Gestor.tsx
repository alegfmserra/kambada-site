"use client";

import Link from "next/link";
import { useState } from "react";
import { rotaEscola } from "@/lib/escola/host";
import type { MembroPublico } from "@/lib/escola/servico";
import { DISCIPLINAS, NOME_ETAPA, NOME_PAPEL, PERMISSOES, TODAS_PERMISSOES, type Etapa, type Permissao } from "@/lib/escola/tipos";
import { BOTAO, BOTAO_SECUNDARIO, CAMPO } from "./chamar";
import { useAcao, type TurmaGestao } from "./Coordenacao";
import { COR_DISCIPLINA } from "./Marca";

/**
 * Hub da gestão Kambada: cadastro de coordenação e professores, permissões de
 * cada professor (liga/desliga), suspender acesso e as turmas da escola.
 * Toda regra é conferida no servidor (`servico.ts`); aqui é só a tela.
 */

const alterna = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
type Acesso = { acesso: { usuario: string; senha: string } };

function Chave({ ligada, rotulo, explica, onClick, ocupado }: { ligada: boolean; rotulo: string; explica: string; onClick: () => void; ocupado: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligada}
      disabled={ocupado}
      onClick={onClick}
      title={explica}
      className={`flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-xs font-bold transition-colors ${
        ligada ? "border-kambada-green bg-kambada-green/10" : "border-borda text-texto-suave"
      }`}
    >
      <span className={`relative h-5 w-9 rounded-full transition-colors ${ligada ? "bg-kambada-green" : "bg-borda"}`} aria-hidden>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${ligada ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
      {rotulo}
    </button>
  );
}

function Selo({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: cor }}>
      {children}
    </span>
  );
}

function Pessoa({ p, turmas }: { p: MembroPublico; turmas: TurmaGestao[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(p.nome);
  const [usuario, setUsuario] = useState(p.usuario);
  const [discs, setDiscs] = useState<string[]>(p.disciplinas);
  const prof = p.papel === "professor";
  const cor = prof ? "#518FC2" : "#F5821F";

  return (
    <li className={`space-y-3 rounded-3xl border-2 p-4 ${p.ativo ? "border-borda" : "border-dashed border-kambada-red/50 bg-kambada-red/5"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-extrabold text-white" style={{ background: cor }} aria-hidden>
          {p.nome.trim()[0]?.toUpperCase()}
        </span>
        <div className="min-w-[10rem] flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <b>{p.nome}</b>
            <Selo cor={cor}>{NOME_PAPEL[p.papel]}</Selo>
            {!p.ativo && <Selo cor="#D4432B">suspenso</Selo>}
          </p>
          <p className="text-sm text-texto-suave">
            usuário <b className="text-texto">{p.usuario}</b>
            {p.disciplinas.length > 0 && ` · ${p.disciplinas.join(", ")}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <button type="button" className="underline" onClick={() => setEditando((x) => !x)}>
            {editando ? "Fechar" : "Editar"}
          </button>
          <button
            type="button"
            className="underline"
            disabled={ocupado}
            onClick={() => rodar<Acesso>({ acao: "nova-senha-professor", membro: p.id }, (r) => `Nova senha de ${r.acesso.usuario}: ${r.acesso.senha} (anote agora; ela não aparece de novo).`)}
          >
            Nova senha
          </button>
          <button
            type="button"
            className="underline"
            disabled={ocupado}
            onClick={() => rodar({ acao: "ativar-membro", membro: p.id, ativo: !p.ativo }, () => (p.ativo ? `${p.nome} está suspenso: não entra mais.` : `${p.nome} pode entrar de novo.`))}
          >
            {p.ativo ? "Suspender" : "Reativar"}
          </button>
          <button
            type="button"
            className="text-kambada-red underline"
            disabled={ocupado}
            onClick={() => window.confirm(`Remover ${p.nome} da equipe?`) && rodar({ acao: "remover-professor", membro: p.id }, () => `${p.nome} saiu da equipe.`)}
          >
            Remover
          </button>
        </div>
      </div>

      {editando && (
        <form
          className="space-y-3 rounded-2xl bg-superficie p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await rodar({ acao: "editar-membro", membro: p.id, nome, usuario, disciplinas: discs }, () => "Dados salvos.")) setEditando(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Nome
              <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">
              Usuário
              <input className={CAMPO} value={usuario} onChange={(e) => setUsuario(e.target.value.toLowerCase())} autoCapitalize="none" />
            </label>
          </div>
          <fieldset className="flex flex-wrap gap-2 text-sm">
            <legend className="mb-1 w-full font-semibold">Disciplinas</legend>
            {DISCIPLINAS.map((d) => (
              <label key={d} className="flex items-center gap-1.5 rounded-full border border-borda px-3 py-1">
                <input type="checkbox" checked={discs.includes(d)} onChange={() => setDiscs((l) => alterna(l, d))} /> {d}
              </label>
            ))}
          </fieldset>
          <button type="submit" className={BOTAO} disabled={ocupado}>Salvar</button>
        </form>
      )}

      {prof ? (
        <>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-texto-suave">Turmas</p>
            <div className="flex flex-wrap gap-2">
              {turmas.map((t) => {
                const ligado = t.professorIds.includes(p.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={ocupado}
                    onClick={() => rodar({ acao: "vincular", professor: p.id, turma: t.id, ligado: !ligado })}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${ligado ? "bg-kambada-grafite text-white" : "border border-borda text-texto-suave"}`}
                    aria-pressed={ligado}
                  >
                    {ligado ? "✓ " : "+ "}
                    {t.nome}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-texto-suave">Permissões</p>
            <div className="flex flex-wrap gap-2">
              {PERMISSOES.map((x) => {
                const ligada = p.permissoes.includes(x.id);
                return (
                  <Chave
                    key={x.id}
                    ligada={ligada}
                    rotulo={x.rotulo}
                    explica={x.explica}
                    ocupado={ocupado}
                    onClick={() => rodar({ acao: "permissao", membro: p.id, permissao: x.id, ligada: !ligada })}
                  />
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-texto-suave">Coordenação vê todas as turmas e pode tudo na escola (menos o que é só da gestão Kambada).</p>
      )}
      {avisos}
    </li>
  );
}

export function GestaoPessoas({ membros, turmas }: { membros: MembroPublico[]; turmas: TurmaGestao[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [papel, setPapel] = useState<"professor" | "coordenacao">("professor");
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [discs, setDiscs] = useState<string[]>([]);
  const [turmasSel, setTurmasSel] = useState<string[]>([]);
  const [perms, setPerms] = useState<Permissao[]>(TODAS_PERMISSOES);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const corpo = { acao: "criar-membro", papel, nome, usuario, disciplinas: discs, turmas: papel === "professor" ? turmasSel : [], permissoes: perms };
    const ok = await rodar<Acesso>(corpo, (r) => `Acesso criado. Usuário: ${r.acesso.usuario} · senha inicial: ${r.acesso.senha} (anote agora; ela não aparece de novo).`);
    if (ok) {
      setNome("");
      setUsuario("");
      setDiscs([]);
      setTurmasSel([]);
      setPerms(TODAS_PERMISSOES);
    }
  }

  const grupos: [string, MembroPublico[]][] = [
    ["Coordenação", membros.filter((m) => m.papel === "coordenacao")],
    ["Professores", membros.filter((m) => m.papel === "professor")],
  ];

  return (
    <div className="space-y-6">
      {grupos.map(([titulo, lista]) => (
        <div key={titulo} className="space-y-3">
          <h3 className="font-display text-lg font-bold">
            {titulo} <span className="text-sm font-semibold text-texto-suave">({lista.length})</span>
          </h3>
          {lista.length === 0 ? (
            <p className="rounded-2xl bg-superficie p-4 text-sm text-texto-suave">Ninguém ainda.</p>
          ) : (
            <ul className="space-y-3">
              {lista.map((p) => (
                <Pessoa key={p.id} p={p} turmas={turmas} />
              ))}
            </ul>
          )}
        </div>
      ))}

      <form onSubmit={criar} className="space-y-4 rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5">
        <h3 className="font-display text-lg font-bold">+ Cadastrar acesso</h3>
        <div className="flex flex-wrap gap-2">
          {(["professor", "coordenacao"] as const).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setPapel(x)}
              aria-pressed={papel === x}
              className={`rounded-full px-4 py-2 text-sm font-bold ${papel === x ? "bg-kambada-grafite text-white" : "border-2 border-borda"}`}
            >
              {NOME_PAPEL[x]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nome
            <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={papel === "professor" ? "ex.: Joana Pereira" : "ex.: Coordenação do Fundamental"} />
          </label>
          <label className="text-sm font-semibold">
            Usuário
            <input
              className={CAMPO}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.toLowerCase())}
              placeholder={papel === "professor" ? "ex.: prof.joana" : "ex.: coord.fund"}
              autoCapitalize="none"
            />
          </label>
        </div>
        {papel === "professor" && (
          <>
            <fieldset className="flex flex-wrap gap-2 text-sm">
              <legend className="mb-1 w-full font-semibold">Disciplinas</legend>
              {DISCIPLINAS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 rounded-full border border-borda bg-fundo px-3 py-1">
                  <input type="checkbox" checked={discs.includes(d)} onChange={() => setDiscs((l) => alterna(l, d))} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_DISCIPLINA[d] }} aria-hidden /> {d}
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap gap-2 text-sm">
              <legend className="mb-1 w-full font-semibold">Turmas</legend>
              {turmas.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 rounded-full border border-borda bg-fundo px-3 py-1">
                  <input type="checkbox" checked={turmasSel.includes(t.id)} onChange={() => setTurmasSel((l) => alterna(l, t.id))} /> {t.nome}
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="mb-1 w-full text-sm font-semibold">Permissões</legend>
              {PERMISSOES.map((x) => (
                <Chave key={x.id} ligada={perms.includes(x.id)} rotulo={x.rotulo} explica={x.explica} ocupado={false} onClick={() => setPerms((l) => alterna(l, x.id))} />
              ))}
            </fieldset>
          </>
        )}
        {avisos}
        <button type="submit" className={BOTAO} disabled={ocupado}>Criar acesso</button>
        <p className="text-xs text-texto-suave">A senha inicial aparece uma vez só. A pessoa troca em “Senha” depois de entrar.</p>
      </form>
    </div>
  );
}

function TurmaLinha({ t, professores }: { t: TurmaGestao; professores: MembroPublico[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(t.nome);
  const [etapa, setEtapa] = useState<Etapa>(t.etapa);
  const nomes = t.professorIds.map((id) => professores.find((p) => p.id === id)?.nome).filter(Boolean);

  return (
    <li className="space-y-3 rounded-3xl border-2 border-borda p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-kambada-grafite px-3 py-1.5 text-center text-white">
          <span className="block text-[10px] uppercase tracking-wider text-white/60">código</span>
          <span className="font-display text-lg font-extrabold tracking-widest text-kambada-amarelo">{t.codigo}</span>
        </span>
        <div className="min-w-[10rem] flex-1">
          <b className="font-display text-lg">{t.nome}</b>
          <p className="text-sm text-texto-suave">
            {NOME_ETAPA[t.etapa]} · {nomes.join(", ") || "sem professor"}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <Link href={rotaEscola(`/professor/turma/${t.id}`)} className="font-semibold underline">Relatório</Link>
          <Link href={rotaEscola(`/professor/turma/${t.id}?aba=alunos`)} className="font-semibold underline">Alunos e cartões</Link>
          <button type="button" className="underline" onClick={() => setEditando((x) => !x)}>
            {editando ? "Fechar" : "Editar"}
          </button>
          <button
            type="button"
            className="underline"
            disabled={ocupado}
            onClick={() =>
              window.confirm(`Gerar código novo para o ${t.nome}? O código ${t.codigo} deixa de valer e os cartões precisam ser reimpressos.`) &&
              rodar<{ turma: { codigo: string } }>({ acao: "novo-codigo", turma: t.id }, (r) => `Código novo do ${t.nome}: ${r.turma.codigo}.`)
            }
          >
            Novo código
          </button>
          <button
            type="button"
            className="text-kambada-red underline"
            disabled={ocupado}
            onClick={() => window.confirm(`Apagar a turma ${t.nome}, com os alunos e as respostas?`) && rodar({ acao: "remover-turma", turma: t.id }, () => `${t.nome} apagada.`)}
          >
            Apagar
          </button>
        </div>
      </div>
      {editando && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-2xl bg-superficie p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await rodar({ acao: "editar-turma", turma: t.id, nome, etapa }, () => "Turma salva.")) setEditando(false);
          }}
        >
          <label className="min-w-[10rem] flex-1 text-sm font-semibold">
            Nome
            <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Etapa
            <select className={CAMPO} value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa)}>
              <option value="f1">{NOME_ETAPA.f1}</option>
              <option value="f2">{NOME_ETAPA.f2}</option>
            </select>
          </label>
          <button type="submit" className={BOTAO} disabled={ocupado}>Salvar</button>
          <p className="w-full text-xs text-texto-suave">Mudar a etapa muda os desafios que a turma vê. As respostas antigas ficam no relatório.</p>
        </form>
      )}
      {avisos}
    </li>
  );
}

export function GestaoTurmasHub({ turmas, professores }: { turmas: TurmaGestao[]; professores: MembroPublico[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [nome, setNome] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("f1");
  const [profs, setProfs] = useState<string[]>([]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await rodar<{ turma: { codigo: string } }>({ acao: "criar-turma", nome, etapa, professores: profs }, (r) => `Turma criada. Código para os alunos: ${r.turma.codigo}`);
    if (ok) {
      setNome("");
      setProfs([]);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {turmas.map((t) => (
          <TurmaLinha key={t.id} t={t} professores={professores} />
        ))}
      </ul>
      <form onSubmit={criar} className="space-y-3 rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5">
        <h3 className="font-display text-lg font-bold">+ Nova turma</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[10rem] flex-1 text-sm font-semibold">
            Nome
            <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: 3º ano C" />
          </label>
          <label className="text-sm font-semibold">
            Etapa
            <select className={CAMPO} value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa)}>
              <option value="f1">{NOME_ETAPA.f1}</option>
              <option value="f2">{NOME_ETAPA.f2}</option>
            </select>
          </label>
        </div>
        {professores.length > 0 && (
          <fieldset className="flex flex-wrap gap-2 text-sm">
            <legend className="mb-1 w-full font-semibold">Professores</legend>
            {professores.map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 rounded-full border border-borda bg-fundo px-3 py-1">
                <input type="checkbox" checked={profs.includes(p.id)} onChange={() => setProfs((l) => alterna(l, p.id))} /> {p.nome}
              </label>
            ))}
          </fieldset>
        )}
        {avisos}
        <button type="submit" className={BOTAO_SECUNDARIO} disabled={ocupado || nome.trim().length < 2}>Criar turma</button>
      </form>
    </div>
  );
}
