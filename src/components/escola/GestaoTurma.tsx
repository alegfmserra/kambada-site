"use client";

import Link from "next/link";
import { useState } from "react";
import { rotaEscola } from "@/lib/escola/host";
import type { AlunoComFiguras } from "@/lib/escola/servico";
import { FIGURAS } from "@/lib/escola/tipos";
import { BOTAO, BOTAO_SECUNDARIO, CAMPO, chamar } from "./chamar";

type Pode = { cadastrar: boolean; cartoes: boolean; remover: boolean };

/** Professor: cadastra apelidos, troca a senha de figuras e tira aluno da turma (o que as permissões dele deixarem). */
/** `veNomes`: a escola vê e cadastra o nome de verdade; a gestão Kambada, não. */
export function GestaoTurma({ turmaId, turmaNome, codigo, alunosIniciais, pode, veNomes }: { turmaId: string; turmaNome: string; codigo: string; alunosIniciais: AlunoComFiguras[]; pode: Pode; veNomes: boolean }) {
  const [alunos, setAlunos] = useState(alunosIniciais);
  const [apelido, setApelido] = useState("");
  const [nome, setNome] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMsg("");
    setOcupado(true);
    const r = await chamar<{ aluno: AlunoComFiguras }>("gestao", { acao: "criar-aluno", turma: turmaId, apelido, nome: veNomes ? nome : undefined });
    setOcupado(false);
    if (!r.ok) return setErro(r.mensagem ?? "Não deu para cadastrar.");
    setAlunos((l) => [...l, r.aluno].sort((a, b) => a.apelido.localeCompare(b.apelido, "pt-BR")));
    setApelido("");
    setNome("");
    setMsg(pode.cartoes ? `${r.aluno.apelido} cadastrado. Senha de figuras: ${r.aluno.figuras.map((f) => FIGURAS[f]).join(" ")}` : `${r.aluno.apelido} cadastrado. A coordenação entrega o cartão.`);
  }

  async function novaSenha(a: AlunoComFiguras) {
    if (!window.confirm(`Trocar as figuras de ${a.apelido}? O cartão antigo deixa de valer.`)) return;
    const r = await chamar<{ aluno: AlunoComFiguras }>("gestao", { acao: "novas-figuras", aluno: a.id });
    if (!r.ok) return setErro(r.mensagem ?? "Não deu para trocar.");
    setAlunos((l) => l.map((x) => (x.id === a.id ? r.aluno : x)));
    setMsg(`Novas figuras de ${a.apelido}: ${r.aluno.figuras.map((f) => FIGURAS[f]).join(" ")}. Imprima o cartão de novo.`);
  }

  async function salvarNome(a: AlunoComFiguras) {
    const r = await chamar<{ aluno: AlunoComFiguras }>("gestao", { acao: "nomear-aluno", aluno: a.id, nome: nomeEditado });
    if (!r.ok) return setErro(r.mensagem ?? "Não deu para salvar o nome.");
    setAlunos((l) => l.map((x) => (x.id === a.id ? { ...x, nome: r.aluno.nome } : x)));
    setEditando(null);
    setMsg(`Nome de ${a.apelido} salvo (só a escola vê).`);
  }

  async function remover(a: AlunoComFiguras) {
    if (!window.confirm(`Tirar ${a.apelido} da turma? As respostas dele também saem.`)) return;
    const r = await chamar("gestao", { acao: "remover-aluno", aluno: a.id });
    if (!r.ok) return setErro(r.mensagem ?? "Não deu para remover.");
    setAlunos((l) => l.filter((x) => x.id !== a.id));
    setMsg(`${a.apelido} saiu da turma.`);
  }

  return (
    <div className="space-y-6">
      {pode.cadastrar && (
        <form onSubmit={criar} className="flex flex-wrap items-end gap-3 rounded-2xl bg-superficie p-4">
          <label className="min-w-[14rem] flex-1 text-sm font-semibold">
            Novo aluno (apelido)
            <input className={CAMPO} value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={20} placeholder="ex.: GuaraVeloz" />
          </label>
          {veNomes && (
            <label className="min-w-[14rem] flex-1 text-sm font-semibold">
              Nome do aluno (só a escola vê, opcional)
              <input className={CAMPO} value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} placeholder="ex.: Davi Santos" />
            </label>
          )}
          <button type="submit" className={BOTAO} disabled={ocupado || apelido.trim().length < 3}>
            Cadastrar
          </button>
          <p className="w-full text-xs text-texto-suave">O apelido é o que aparece no jogo e no ranking (sem nome completo, sem espaço). O nome fica só para a escola montar o reforço. O sistema sorteia a senha de figuras.</p>
        </form>
      )}

      {msg && <p className="rounded-2xl bg-kambada-green/15 p-3 font-semibold" role="status">{msg}</p>}
      {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <b>{alunos.length}</b> alunos no {turmaNome} · entram com o código <b className="tracking-widest">{codigo}</b>
        </p>
        {pode.cartoes && (
          <Link href={rotaEscola(`/professor/turma/${turmaId}/cartoes`)} className={BOTAO_SECUNDARIO} target="_blank">
            🖨️ Imprimir cartões de acesso
          </Link>
        )}
      </div>

      <ul className="divide-y divide-borda rounded-2xl border border-borda">
        {alunos.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="text-2xl" aria-hidden>{a.avatar}</span>
            <span className="min-w-[8rem] flex-1 leading-tight">
              <b className="block">{a.apelido}</b>
              {veNomes &&
                (editando === a.id ? (
                  <span className="mt-1 flex flex-wrap gap-2">
                    <input className="rounded-lg border-2 border-borda bg-fundo px-2 py-1 text-sm" value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} maxLength={80} aria-label={`Nome de ${a.apelido}`} autoFocus />
                    <button type="button" className="text-sm font-bold underline" onClick={() => salvarNome(a)}>Salvar</button>
                    <button type="button" className="text-sm underline" onClick={() => setEditando(null)}>Cancelar</button>
                  </span>
                ) : (
                  <span className="text-xs text-texto-suave">
                    {a.nome || "sem nome"}
                    {pode.cadastrar && (
                      <button type="button" className="ml-2 underline" onClick={() => { setEditando(a.id); setNomeEditado(a.nome ?? ""); }}>
                        {a.nome ? "editar nome" : "pôr nome"}
                      </button>
                    )}
                  </span>
                ))}
            </span>
            {pode.cartoes && (
              <>
                <span className="text-2xl tracking-widest" title="Senha de figuras">{a.figuras.map((f) => FIGURAS[f]).join("")}</span>
                <button type="button" className="text-sm underline" onClick={() => novaSenha(a)}>Novas figuras</button>
              </>
            )}
            {pode.remover && <button type="button" className="text-sm text-kambada-red underline" onClick={() => remover(a)}>Remover</button>}
          </li>
        ))}
        {alunos.length === 0 && (
          <li className="px-4 py-6 text-center text-texto-suave">{pode.cadastrar ? "Nenhum aluno ainda. Cadastre o primeiro apelido acima." : "Nenhum aluno ainda."}</li>
        )}
      </ul>
    </div>
  );
}
