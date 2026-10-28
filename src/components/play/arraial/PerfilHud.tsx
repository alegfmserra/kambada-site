"use client";

import { useEffect, useState } from "react";
import type { Ganho, PerfilPublico } from "@/lib/play/jogos/perfil";
import { chamar } from "@/components/play/jogos/jogador";
import { Colecao } from "./Colecao";
import { emitirPerfil, EVENTO_PERFIL, usePerfilAtual } from "./perfilStore";

export { emitirPerfil };

/**
 * Carreira de brincante no canto do arraial: nível, barra de XP, as 3
 * diárias e a janela "Meu brincante" (visual, coleção e baú do dia). Sem
 * conta (demonstração) não aparece nada.
 */
export function PerfilHud() {
  const perfil = usePerfilAtual();
  const [aberto, setAberto] = useState(false);
  const [colecao, setColecao] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let vivo = true;
    chamar<{ perfil: PerfilPublico | null }>("/api/play/arraial", { acao: "perfil" }).then((r) => {
      if (vivo && r.ok && r.perfil) emitirPerfil({ perfil: r.perfil });
    });
    function aoChegar(e: Event) {
      const { ganho } = (e as CustomEvent<{ ganho?: Ganho }>).detail;
      if (ganho && (ganho.xp > 0 || ganho.itensNovos?.length || ganho.amizade)) {
        const partes = ganho.xp > 0 ? [`+${ganho.xp} XP`] : [];
        if (ganho.diariasConcluidas.length) partes.push(`missão do dia: ${ganho.diariasConcluidas.join(", ")}`);
        if (ganho.bonusSequencia) partes.push(`sequência! +${ganho.bonusSequencia}`);
        if (ganho.subiuPara) partes.push(`nível ${ganho.subiuPara.nivel}: ${ganho.subiuPara.titulo}!`);
        if (ganho.amizade) partes.push(`❤ ${ganho.amizade} gostou de você! Veja a história nova em Meu brincante`);
        if (ganho.itensNovos?.length) partes.push(`novo item: ${ganho.itensNovos.join(", ")}`);
        setAviso(partes.join(" · "));
      }
    }
    window.addEventListener(EVENTO_PERFIL, aoChegar);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_PERFIL, aoChegar);
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const id = window.setTimeout(() => setAviso(""), 5000);
    return () => window.clearTimeout(id);
  }, [aviso]);

  if (!perfil) return null;
  const pct = perfil.xpDoNivel ? Math.min(100, Math.round((perfil.xpNoNivel / perfil.xpDoNivel) * 100)) : 100;
  const feitas = perfil.diarias.filter((d) => d.feita).length;

  return (
    <div className="absolute left-4 top-[6.75rem] z-20 w-56 font-body text-kambada-cream">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={`Nível ${perfil.nivel}, ${perfil.titulo}. ${perfil.xpDoNivel ? `${perfil.xpNoNivel} de ${perfil.xpDoNivel} XP.` : "Nível máximo."} Missões do dia: ${feitas} de ${perfil.diarias.length}. Abrir detalhes.`}
        className="w-full rounded-xl bg-kambada-noite/80 px-3 py-2 text-left backdrop-blur-sm"
      >
        <span className="flex items-center justify-between text-[12px] font-bold">
          <span>
            Nível {perfil.nivel} · {perfil.titulo}
          </span>
          <span aria-hidden>{aberto ? "▴" : "▾"}</span>
        </span>
        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-kambada-cream/20" aria-hidden>
          <span className="block h-full rounded-full bg-kambada-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </span>
        <span className="mt-1 block text-[10px] text-kambada-cream/70">
          {perfil.xpDoNivel ? `${perfil.xpNoNivel}/${perfil.xpDoNivel} XP para o nível ${perfil.nivel + 1}` : "Nível máximo"} · missões do dia {feitas}/{perfil.diarias.length}
        </span>
      </button>

      {aberto ? (
        <div className="mt-1 rounded-xl bg-kambada-noite/90 p-3 text-[12px] backdrop-blur-sm">
          <p className="font-bold text-kambada-gold">Missões do dia</p>
          <ul className="mt-1 space-y-1.5">
            {perfil.diarias.map((d) => (
              <li key={d.id} className="flex items-start gap-2">
                <span aria-hidden>{d.feita ? "✅" : "▫️"}</span>
                <span>
                  {d.texto}
                  <span className="text-kambada-cream/60">
                    {" "}
                    ({d.progresso}/{d.meta}){d.feita ? "" : " · +30 XP"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-kambada-cream/70">
            🔥 Sequência: {perfil.sequencia.atual} {perfil.sequencia.atual === 1 ? "dia" : "dias"} (melhor: {perfil.sequencia.melhor})
          </p>
          {perfil.tetoAtingido ? <p className="mt-1 text-kambada-cream/70">Você bateu o limite de XP de hoje; as missões do dia ainda rendem.</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setColecao(true)}
        className="mt-1 w-full rounded-xl bg-kambada-noite/80 px-3 py-1.5 text-left text-[12px] font-bold backdrop-blur-sm"
      >
        🎒 Meu brincante{perfil.bauPronto ? " · 🎁 baú do dia pronto!" : ""}
      </button>
      {colecao ? <Colecao perfil={perfil} aoFechar={() => setColecao(false)} /> : null}

      {aviso ? (
        <p role="status" className="mt-1 rounded-xl bg-kambada-gold px-3 py-1.5 text-[12px] font-bold text-kambada-ink shadow-xl">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
