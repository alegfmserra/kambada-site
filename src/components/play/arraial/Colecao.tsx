"use client";

import { useEffect, useRef, useState } from "react";
import { MINIS, type MiniId } from "@/lib/play/jogos/minis";
import { XP, type ItemPublico, type PerfilPublico } from "@/lib/play/jogos/perfil";
import { MiniAtividade } from "./MiniAtividade";
import { HISTORIAS_REVISADAS } from "@/lib/play/jogos/amizades";
import { FICHAS_REVISADAS, SLOTS, type Slot } from "@/lib/play/jogos/itens";
import { chamar } from "@/components/play/jogos/jogador";
import { emitirPerfil } from "./perfilStore";

const NOME_DO_SLOT: Record<Slot, string> = { chapeu: "Chapéu", camisa: "Camisa", fita: "Fita do chapéu" };

type Aba = "vestir" | "colecao" | "amigos" | "atividades";
const NOME_DA_ABA: Record<Aba, string> = { vestir: "Vestir", colecao: "Coleção", amigos: "Amigos", atividades: "Atividades" };

/** Janela "Meu brincante": trocar o visual do personagem, ver a coleção com as fichas e abrir o baú do dia. */
export function Colecao({ perfil, aoFechar }: { perfil: PerfilPublico; aoFechar: () => void }) {
  const [aba, setAba] = useState<Aba>("vestir");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mini, setMini] = useState<MiniId | null>(null);
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fechar.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  async function vestir(slot: Slot, id: string) {
    if (ocupado) return;
    setOcupado(true);
    const r = await chamar<{ perfil?: PerfilPublico }>("/api/play/arraial", { acao: "equipar", slot, item: id });
    setOcupado(false);
    if (r.ok && r.perfil) {
      emitirPerfil({ perfil: r.perfil });
      setMsg("");
    } else setMsg(r.mensagem ?? "Não deu para trocar agora.");
  }

  async function abrirBau() {
    if (ocupado) return;
    setOcupado(true);
    const r = await chamar<{ perfil?: PerfilPublico; item?: { nome: string; ficha: string }; xp?: number }>("/api/play/arraial", { acao: "bau" });
    setOcupado(false);
    if (r.ok && r.perfil) {
      emitirPerfil({ perfil: r.perfil });
      setMsg(r.item ? `Do baú saiu: ${r.item.nome}! ${r.item.ficha}` : `Você já tem tudo do baú! +${r.xp ?? 0} XP guardados.`);
      setAba("colecao");
    } else setMsg(r.mensagem ?? "Não deu para abrir o baú agora.");
  }

  const doSlot = (slot: Slot) => perfil.colecao.filter((i) => i.slot === slot);
  const colecionaveis = perfil.colecao.filter((i) => !i.slot);
  const tens = perfil.colecao.filter((i) => i.tem).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-3 pb-3 pt-16 sm:items-center" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Meu brincante"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88%] w-full max-w-md overflow-y-auto rounded-2xl bg-kambada-noite p-4 font-body text-kambada-cream shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-kambada-gold">Meu brincante</h2>
            <p className="text-[12px] text-kambada-cream/70">
              Nível {perfil.nivel} · {perfil.titulo} · {tens}/{perfil.colecao.length} itens
            </p>
          </div>
          <button ref={fechar} type="button" onClick={aoFechar} className="rounded-lg bg-kambada-cream/10 px-3 py-1 text-[12px] font-bold">
            Fechar
          </button>
        </div>

        <button
          type="button"
          onClick={abrirBau}
          disabled={!perfil.bauPronto || ocupado}
          className="mt-3 w-full rounded-xl bg-kambada-gold px-3 py-2 text-[13px] font-bold text-kambada-ink disabled:bg-kambada-cream/15 disabled:text-kambada-cream/60"
        >
          {perfil.bauPronto ? "🎁 Abrir o baú do dia" : "🎁 Baú de hoje já aberto — volte amanhã"}
        </button>
        {msg ? (
          <p role="status" className="mt-2 rounded-lg bg-kambada-cream/10 p-2 text-[12px]">
            {msg}
          </p>
        ) : null}

        <div role="tablist" aria-label="Seções" className="mt-3 flex gap-2 text-[12px] font-bold">
          {(["vestir", "colecao", "amigos", "atividades"] as const).map((a) => (
            <button
              key={a}
              role="tab"
              type="button"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className={`rounded-full px-3 py-1 ${aba === a ? "bg-kambada-gold text-kambada-ink" : "bg-kambada-cream/10"}`}
            >
              {NOME_DA_ABA[a]}
            </button>
          ))}
        </div>

        {aba === "vestir" ? (
          <div className="mt-3 space-y-3">
            {SLOTS.map((slot) => (
              <fieldset key={slot}>
                <legend className="text-[12px] font-bold text-kambada-gold">{NOME_DO_SLOT[slot]}</legend>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {doSlot(slot).map((i) => (
                    <BotaoDeItem key={i.id} item={i} vestido={perfil.visual[slot] === i.id} aoClicar={() => vestir(slot, i.id)} />
                  ))}
                </div>
              </fieldset>
            ))}
            <p className="text-[11px] text-kambada-cream/60">Itens novos chegam com o nível, com dias seguidos e no baú do dia.</p>
          </div>
        ) : aba === "atividades" ? (
          <ul className="mt-3 space-y-2">
            {MINIS.map((m) => (
              <li key={m.id} className="rounded-lg bg-kambada-cream/10 p-2 text-[12px]">
                <p className="font-bold">
                  {m.nome} {perfil.minisHoje.includes(m.id) ? "✓ XP de hoje ganho" : `· até +${XP.miniPerfeita} XP hoje`}
                </p>
                <p className="text-kambada-cream/70">{m.instrucao}</p>
                <button type="button" onClick={() => setMini(m.id)} className="mt-1.5 rounded-full bg-kambada-gold px-4 py-1.5 font-bold text-kambada-ink">
                  Jogar
                </button>
              </li>
            ))}
            <li className="text-[11px] text-kambada-cream/60">Cada atividade paga XP uma vez por dia; jogar de novo é só pela brincadeira.</li>
          </ul>
        ) : aba === "amigos" ? (
          <ul className="mt-3 space-y-2">
            {perfil.amigos.map((a) => (
              <li key={a.id} className="rounded-lg bg-kambada-cream/10 p-2 text-[12px]">
                <p className="font-bold">
                  {a.nome}{" "}
                  <span aria-label={`${a.coracoes} de 5 corações`} className="text-kambada-gold">
                    {"♥".repeat(a.coracoes)}
                    <span className="text-kambada-cream/30">{"♥".repeat(5 - a.coracoes)}</span>
                  </span>
                </p>
                <p className="text-kambada-cream/60">
                  {a.faltam === null ? "Amizade completa!" : `Mais ${a.faltam} ${a.faltam === 1 ? "conversa" : "conversas"} para o próximo coração`}
                </p>
                {a.historias.map((h) => (
                  <details key={h.titulo} className="mt-1">
                    <summary className="cursor-pointer font-bold text-kambada-gold">{h.titulo}</summary>
                    <p className="mt-0.5 text-kambada-cream/85">{h.texto}</p>
                  </details>
                ))}
                {a.fechadas ? <p className="mt-1 text-kambada-cream/50">🔒 {a.fechadas === 1 ? "1 história" : `${a.fechadas} histórias`} para abrir</p> : null}
              </li>
            ))}
            {!HISTORIAS_REVISADAS ? <li className="text-[11px] text-kambada-cream/60">Histórias em revisão com mestres e brincantes: algumas palavras ainda podem mudar.</li> : null}
          </ul>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...colecionaveis, ...perfil.colecao.filter((i) => i.slot)].map((i) => (
              <li key={i.id} className={`rounded-lg p-2 text-[12px] ${i.tem ? "bg-kambada-cream/10" : "bg-kambada-cream/5 text-kambada-cream/50"}`}>
                <p className="font-bold">
                  {i.tem ? "✓ " : "🔒 "}
                  {i.nome}
                  {i.tem ? "" : ` · ${i.requisito}`}
                </p>
                {i.tem ? <p className="mt-0.5 text-kambada-cream/80">{i.ficha}</p> : null}
              </li>
            ))}
            {!FICHAS_REVISADAS ? <li className="text-[11px] text-kambada-cream/60">Fichas em revisão com mestres e brincantes: algumas palavras ainda podem mudar.</li> : null}
          </ul>
        )}
      </div>
      {mini ? <MiniAtividade mini={mini} aoFechar={() => setMini(null)} /> : null}
    </div>
  );
}

function BotaoDeItem({ item, vestido, aoClicar }: { item: ItemPublico; vestido: boolean; aoClicar: () => void }) {
  return (
    <button
      type="button"
      disabled={!item.tem}
      aria-pressed={vestido}
      onClick={aoClicar}
      title={item.tem ? item.ficha : `Desbloqueia em: ${item.requisito}`}
      className={`rounded-lg px-2.5 py-1.5 text-[12px] ${
        vestido ? "bg-kambada-gold font-bold text-kambada-ink" : item.tem ? "bg-kambada-cream/15" : "bg-kambada-cream/5 text-kambada-cream/50"
      }`}
    >
      {item.tem ? item.nome : `🔒 ${item.nome} · ${item.requisito}`}
    </button>
  );
}
