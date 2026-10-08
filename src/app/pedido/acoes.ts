"use server";

import { headers } from "next/headers";
import { acompanharPedido, type Acompanhamento } from "@/lib/checkout/acompanhar";
import { enderecoAtelieEmUmaLinha } from "@/lib/loja/enderecoAtelie";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export type RespostaConsulta =
  | { estado: "inicial" }
  | { estado: "nao_encontrado" }
  | { estado: "limite" }
  | { estado: "erro" }
  | { estado: "ok"; dados: Acompanhamento; enderecoRetirada?: string };

/**
 * Limite de consultas por visitante: 10 a cada 10 minutos. Quem tem o número
 * e o e-mail certos acerta na primeira; quem tenta adivinhar esbarra aqui.
 * Fica na memória do servidor — um reinício zera, e tudo bem.
 */
const JANELA_MS = 10 * 60 * 1000;
const MAXIMO = 10;
const tentativas = new Map<string, { inicio: number; vezes: number }>();

function dentroDoLimite(chave: string): boolean {
  const agora = Date.now();
  const t = tentativas.get(chave);
  if (!t || agora - t.inicio > JANELA_MS) {
    tentativas.set(chave, { inicio: agora, vezes: 1 });
    if (tentativas.size > 5000) tentativas.delete(tentativas.keys().next().value as string);
    return true;
  }
  t.vezes += 1;
  return t.vezes <= MAXIMO;
}

export async function consultarPedido(
  _anterior: RespostaConsulta,
  formulario: FormData,
): Promise<RespostaConsulta> {
  const ref = String(formulario.get("ref") ?? "");
  const email = String(formulario.get("email") ?? "");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sem-ip";
  if (!dentroDoLimite(ip)) return { estado: "limite" };

  if (!mercadoPagoConfigurado()) return { estado: "nao_encontrado" };

  try {
    const dados = await acompanharPedido(ref, email);
    if (!dados) return { estado: "nao_encontrado" };
    return {
      estado: "ok",
      dados,
      // O endereço do ateliê só sai para quem já pagou e escolheu retirar.
      enderecoRetirada:
        dados.entrega.retirada && dados.pagamento.aprovado ? enderecoAtelieEmUmaLinha() : undefined,
    };
  } catch (e) {
    console.error("[pedido] consulta falhou:", e instanceof Error ? e.message : e);
    return { estado: "erro" };
  }
}
