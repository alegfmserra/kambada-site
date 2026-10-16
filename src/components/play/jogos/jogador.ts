"use client";

import { useEffect, useState } from "react";
import type { AvatarId } from "@/lib/play/jogos/tipos";

/**
 * Identidade do jogador, só no navegador: uma chave aleatória (que prova que o
 * prêmio é seu), o apelido e o avatar. Nada disso identifica uma pessoa real.
 */

const CHAVE = "kambada-play-chave";
const APELIDO = "kambada-play-apelido";
const AVATAR = "kambada-play-avatar";

function ler(k: string): string {
  try {
    return window.localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
}
function gravar(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // modo privado: o jogo funciona, só não lembra de você
  }
}

function novaChave(): string {
  const b = new Uint8Array(16);
  window.crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function chaveDoJogador(): string {
  let c = ler(CHAVE);
  if (!/^[a-f0-9]{32}$/.test(c)) {
    c = novaChave();
    gravar(CHAVE, c);
  }
  return c;
}

export function useJogador() {
  const [apelido, setApelido] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("kambadinha");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do localStorage no mount (não existe no servidor)
    setApelido(ler(APELIDO));
    const a = ler(AVATAR);
    if (a) setAvatar(a as AvatarId);
  }, []);

  return {
    apelido,
    avatar,
    salvar(novoApelido: string, novoAvatar: AvatarId) {
      setApelido(novoApelido);
      setAvatar(novoAvatar);
      gravar(APELIDO, novoApelido);
      gravar(AVATAR, novoAvatar);
    },
  };
}

export async function chamar<T = Record<string, unknown>>(
  caminho: string,
  corpo?: unknown,
): Promise<T & { ok: boolean; mensagem?: string }> {
  try {
    const r = await fetch(caminho, corpo === undefined ? undefined : {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
    });
    return (await r.json()) as T & { ok: boolean; mensagem?: string };
  } catch {
    return { ok: false, mensagem: "Sem conexão. Tente de novo." } as T & { ok: boolean; mensagem?: string };
  }
}
