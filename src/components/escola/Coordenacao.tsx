"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MembroPublico } from "@/lib/escola/servico";
import { DISCIPLINAS, NOME_ETAPA, type Etapa, type EscolaPublica } from "@/lib/escola/tipos";
import { BOTAO, BOTAO_SECUNDARIO, CAMPO, chamar } from "./chamar";

export type TurmaGestao = { id: string; nome: string; etapa: Etapa; codigo: string; professorIds: string[] };

export function useAcao() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function rodar<T>(corpo: Record<string, unknown>, sucesso?: (r: T) => string | void): Promise<boolean> {
    setErro("");
    setMsg("");
    setOcupado(true);
    const r = await chamar<T>("gestao", corpo);
    setOcupado(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu certo.");
      return false;
    }
    const m = sucesso?.(r);
    if (m) setMsg(m);
    router.refresh();
    return true;
  }
  const avisos = (
    <>
      {msg && <p className="rounded-2xl bg-kambada-green/15 p-3 font-semibold" role="status">{msg}</p>}
      {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}
    </>
  );
  return { rodar, ocupado, avisos };
}

export function GestaoEquipe({ membros, turmas }: { membros: MembroPublico[]; turmas: TurmaGestao[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [discs, setDiscs] = useState<string[]>([]);
  const [turmasSel, setTurmasSel] = useState<string[]>([]);
  const alterna = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await rodar<{ acesso: { usuario: string; senha: string } }>(
      { acao: "criar-professor", nome, usuario, disciplinas: discs, turmas: turmasSel },
      (r) => `Acesso criado. Usuário: ${r.acesso.usuario} · senha inicial: ${r.acesso.senha} (anote agora; ela não aparece de novo).`,
    );
    if (ok) {
      setNome("");
      setUsuario("");
      setDiscs([]);
      setTurmasSel([]);
    }
  }

  const professores = membros.filter((m) => m.papel === "professor");
  return (
    <div className="space-y-4">
      {avisos}
      <ul className="divide-y divide-borda rounded-2xl border border-borda">
        {professores.map((p) => (
          <li key={p.id} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <b>{p.nome}</b>
              <span className="text-sm text-texto-suave">{p.usuario} · {p.disciplinas.join(", ") || "sem disciplina"}</span>
              <span className="ml-auto flex gap-3 text-sm">
                <button
                  type="button"
                  className="underline"
                  disabled={ocupado}
                  onClick={() =>
                    rodar<{ acesso: { usuario: string; senha: string } }>({ acao: "nova-senha-professor", professor: p.id }, (r) => `Nova senha de ${r.acesso.usuario}: ${r.acesso.senha} (anote agora).`)
                  }
                >
                  Nova senha
                </button>
                <button
                  type="button"
                  className="text-kambada-red underline"
                  disabled={ocupado}
                  onClick={() => window.confirm(`Remover ${p.nome} da equipe?`) && rodar({ acao: "remover-professor", professor: p.id }, () => `${p.nome} saiu da equipe.`)}
                >
                  Remover
                </button>
              </span>
            </div>
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
          </li>
        ))}
      </ul>

      <form onSubmit={criar} className="space-y-3 rounded-2xl bg-superficie p-4">
        <h3 className="font-bold">Cadastrar professor</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nome
            <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Joana Pereira" />
          </label>
          <label className="text-sm font-semibold">
            Usuário
            <input className={CAMPO} value={usuario} onChange={(e) => setUsuario(e.target.value.toLowerCase())} placeholder="ex.: prof.joana" autoCapitalize="none" />
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
        <fieldset className="flex flex-wrap gap-2 text-sm">
          <legend className="mb-1 w-full font-semibold">Turmas</legend>
          {turmas.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5 rounded-full border border-borda px-3 py-1">
              <input type="checkbox" checked={turmasSel.includes(t.id)} onChange={() => setTurmasSel((l) => alterna(l, t.id))} /> {t.nome}
            </label>
          ))}
        </fieldset>
        <button type="submit" className={BOTAO} disabled={ocupado}>Criar acesso</button>
        <p className="text-xs text-texto-suave">A senha inicial aparece uma vez só. O professor troca em “Senha” depois de entrar.</p>
      </form>
    </div>
  );
}

export function GestaoTurmas({ turmas, professores }: { turmas: TurmaGestao[]; professores: MembroPublico[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [nome, setNome] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("f1");

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await rodar<{ turma: { codigo: string } }>({ acao: "criar-turma", nome, etapa, professores: [] }, (r) => `Turma criada. Código para os alunos: ${r.turma.codigo}`);
    if (ok) setNome("");
  }

  return (
    <div className="space-y-4">
      {avisos}
      <ul className="divide-y divide-borda rounded-2xl border border-borda">
        {turmas.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <b className="min-w-[6rem]">{t.nome}</b>
            <span className="text-sm text-texto-suave">{NOME_ETAPA[t.etapa]}</span>
            <span className="text-sm">código <b className="tracking-widest">{t.codigo}</b></span>
            <span className="text-sm text-texto-suave">{t.professorIds.map((id) => professores.find((p) => p.id === id)?.nome).filter(Boolean).join(", ") || "sem professor"}</span>
            <button
              type="button"
              className="ml-auto text-sm text-kambada-red underline"
              disabled={ocupado}
              onClick={() => window.confirm(`Apagar a turma ${t.nome}, com os alunos e as respostas?`) && rodar({ acao: "remover-turma", turma: t.id }, () => `${t.nome} apagada.`)}
            >
              Apagar
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={criar} className="flex flex-wrap items-end gap-3 rounded-2xl bg-superficie p-4">
        <label className="min-w-[10rem] flex-1 text-sm font-semibold">
          Nova turma
          <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: 3º ano C" />
        </label>
        <label className="text-sm font-semibold">
          Etapa
          <select className={CAMPO} value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa)}>
            <option value="f1">{NOME_ETAPA.f1}</option>
            <option value="f2">{NOME_ETAPA.f2}</option>
          </select>
        </label>
        <button type="submit" className={BOTAO} disabled={ocupado || nome.trim().length < 2}>Criar turma</button>
      </form>
    </div>
  );
}

export function IdentidadeEscola({ escola, cores }: { escola: EscolaPublica; cores: string[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [nome, setNome] = useState(escola.nome);
  const [sigla, setSigla] = useState(escola.sigla);
  const [cor, setCor] = useState(escola.cor);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void rodar({ acao: "editar-escola", nome, sigla, cor }, () => "Identidade da escola salva.");
      }}
    >
      {avisos}
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="text-sm font-semibold">
          Nome da escola
          <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Sigla
          <input className={CAMPO} value={sigla} maxLength={4} onChange={(e) => setSigla(e.target.value.toUpperCase())} />
        </label>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Cor da escola</legend>
        <div className="flex flex-wrap gap-2">
          {cores.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-fundo ${cor === c ? "ring-2 ring-texto" : ""}`}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
              aria-pressed={cor === c}
            />
          ))}
        </div>
      </fieldset>
      <button type="submit" className={BOTAO} disabled={ocupado}>Salvar</button>
    </form>
  );
}

export function RestaurarDemo() {
  const { rodar, ocupado, avisos } = useAcao();
  return (
    <div className="space-y-2">
      {avisos}
      <button
        type="button"
        className={BOTAO_SECUNDARIO}
        disabled={ocupado}
        onClick={() =>
          window.confirm("Voltar a Escola Modelo ao começo? Tudo o que foi criado na demonstração some (os códigos e cartões originais voltam a valer).") &&
          rodar({ acao: "restaurar-demo" }, () => "Demonstração restaurada.")
        }
      >
        ↺ Restaurar a demonstração
      </button>
      <p className="text-xs text-texto-suave">Use antes de cada reunião com uma escola.</p>
    </div>
  );
}

export function TrocarSenha() {
  const { rodar, ocupado, avisos } = useAcao();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  return (
    <form
      className="mx-auto max-w-sm space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await rodar({ acao: "trocar-senha", atual, nova }, () => "Senha trocada.")) {
          setAtual("");
          setNova("");
        }
      }}
    >
      {avisos}
      <label className="block text-sm font-semibold">
        Senha atual
        <input className={CAMPO} type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" />
      </label>
      <label className="block text-sm font-semibold">
        Senha nova (8 caracteres ou mais)
        <input className={CAMPO} type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" />
      </label>
      <button type="submit" className={`${BOTAO} w-full`} disabled={ocupado}>Trocar senha</button>
    </form>
  );
}
