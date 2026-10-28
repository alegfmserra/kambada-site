"use client";

import { useSyncExternalStore } from "react";
import type { Ganho, PerfilPublico } from "@/lib/play/jogos/perfil";

/**
 * Último perfil que o servidor devolveu, compartilhado entre o painel (HUD) e o
 * boneco do jogador (dentro do Canvas 3D), que se redesenha quando o visual muda.
 */
let atual: PerfilPublico | null = null;
const ouvintes = new Set<() => void>();

export const EVENTO_PERFIL = "kambada:perfil";

function guardarPerfil(perfil: PerfilPublico) {
  atual = perfil;
  ouvintes.forEach((f) => f());
}

/** Guarda o perfil que o servidor devolveu e avisa o HUD do que se ganhou (para o aviso "+XP"). */
export function emitirPerfil(r: { perfil?: PerfilPublico; ganho?: Ganho }) {
  if (!r.perfil) return;
  guardarPerfil(r.perfil);
  window.dispatchEvent(new CustomEvent(EVENTO_PERFIL, { detail: { ganho: r.ganho } }));
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

export function usePerfilAtual(): PerfilPublico | null {
  return useSyncExternalStore(assinar, () => atual, () => null);
}
