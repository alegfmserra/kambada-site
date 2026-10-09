"use client";

import { useActionState } from "react";
import { criarCupom, type EstadoCupom } from "@/app/admin/acoes";

const campo =
  "mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-3 py-2 outline-none focus:border-kambada-amarelo-escuro";

export default function FormularioCupom() {
  const [estado, enviar, enviando] = useActionState<EstadoCupom, FormData>(criarCupom, {});
  return (
    <form action={enviar} className="rounded-3xl border border-borda bg-superficie p-6">
      <h2 className="font-display text-xl font-bold">Criar cupom</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="cp-codigo" className="block text-sm font-semibold">Código</label>
          <input id="cp-codigo" name="codigo" required placeholder="JORGE5" className={`${campo} font-mono uppercase`} />
        </div>
        <div>
          <label htmlFor="cp-pct" className="block text-sm font-semibold">Desconto (%)</label>
          <input id="cp-pct" name="percentual" type="number" min={1} max={50} required placeholder="5" className={campo} />
        </div>
        <div>
          <label htmlFor="cp-usos" className="block text-sm font-semibold">Quantos usos</label>
          <input id="cp-usos" name="usos" type="number" min={1} required placeholder="30" className={campo} />
        </div>
        <div>
          <label htmlFor="cp-periodo" className="block text-sm font-semibold">Por período</label>
          <select id="cp-periodo" name="periodo" required defaultValue="semana" className={campo}>
            <option value="dia">por dia</option>
            <option value="semana">por semana (segunda a domingo)</option>
            <option value="mes">por mês</option>
            <option value="total">no total (não renova)</option>
          </select>
        </div>
        <div>
          <label htmlFor="cp-parceiro" className="block text-sm font-semibold">
            Parceiro <span className="font-normal text-texto-tenue">(opcional)</span>
          </label>
          <input id="cp-parceiro" name="parceiro" placeholder="Jorge" className={campo} />
        </div>
        <div>
          <label htmlFor="cp-comissao" className="block text-sm font-semibold">
            Comissão do parceiro (%) <span className="font-normal text-texto-tenue">(opcional)</span>
          </label>
          <input id="cp-comissao" name="comissao" type="number" min={0} max={50} step="0.5" placeholder="5" className={campo} />
        </div>
        <div>
          <label htmlFor="cp-de" className="block text-sm font-semibold">
            Vale a partir de <span className="font-normal text-texto-tenue">(opcional)</span>
          </label>
          <input id="cp-de" name="validoDe" type="date" className={campo} />
        </div>
        <div>
          <label htmlFor="cp-ate" className="block text-sm font-semibold">
            Vale até <span className="font-normal text-texto-tenue">(opcional)</span>
          </label>
          <input id="cp-ate" name="validoAte" type="date" className={campo} />
        </div>
      </div>
      <p className="mt-4 text-sm text-texto-suave">
        Exemplo do Jorge: código <strong>JORGE5</strong>, desconto <strong>5%</strong>,{" "}
        <strong>30 usos por semana</strong>, parceiro <strong>Jorge</strong>, comissão <strong>5%</strong>.
        Quando os 30 usos da semana acabam, o cupom para de valer até a segunda-feira seguinte.
        O desconto vale só nas peças, nunca no frete.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro disabled:opacity-50"
        >
          {enviando ? "Criando…" : "Criar cupom"}
        </button>
        <p aria-live="polite" className={`text-sm ${estado.erro ? "text-red-500" : "font-semibold"}`}>
          {estado.erro ?? estado.ok}
        </p>
      </div>
    </form>
  );
}
