import type { Metadata } from "next";
import { cookies } from "next/headers";
import FormularioCupom from "@/components/admin/FormularioCupom";
import FormularioLogin from "@/components/admin/FormularioLogin";
import MenuAdmin from "@/components/admin/MenuAdmin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { listarCupons, relatorioDoCupom, ROTULO_PERIODO } from "@/lib/cupons/cupons";
import { emReais, formatarReais } from "@/lib/loja/dinheiro";
import { listarRegistros } from "@/lib/pedidos/registro";
import { alternarCupom, excluirCupom } from "../acoes";

export const metadata: Metadata = {
  title: "Cupons",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const data = (iso?: string) => (iso ? iso.split("-").reverse().join("/") : "—");

/**
 * Cupons — só para a loja (mesma senha dos pedidos).
 *
 * Cria, pausa e exclui cupons, e mostra o relatório de cada um: usos no
 * período atual × limite, vendas, desconto concedido e a comissão do parceiro
 * (paga por fora, por Pix).
 */
export default async function PaginaCupons() {
  if (!adminConfigurado()) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Cupons</h1>
        <p className="mt-4 text-texto-suave">Configure a variável ADMIN_SENHA no painel da Hostinger.</p>
      </section>
    );
  }
  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Cupons</h1>
        <FormularioLogin />
      </section>
    );
  }

  const [cupons, registros] = await Promise.all([listarCupons(), listarRegistros(5000)]);

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <MenuAdmin ativa="cupons" />
      <div>
        <h1 className="font-display text-3xl font-extrabold">Cupons</h1>
        <p className="mt-1 text-texto-suave">
          Cada cupom tem um limite de <strong>usos por período</strong> — não de valor. Um uso conta
          quando o pagamento é aprovado.
        </p>
      </div>

      <FormularioCupom />

      {cupons.length === 0 ? (
        <p className="text-texto-suave">Nenhum cupom criado ainda.</p>
      ) : (
        <ul className="space-y-4">
          {cupons.map((c) => {
            const rel = relatorioDoCupom(c, registros);
            const esgotado = rel.usosNoPeriodo >= c.limite.usos;
            return (
              <li key={c.codigo} className="rounded-2xl border border-borda bg-superficie p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xl font-bold">{c.codigo}</p>
                    <p className="text-sm text-texto-suave">
                      {c.percentual}% nas peças · {c.limite.usos} usos {ROTULO_PERIODO[c.limite.periodo]}
                      {c.parceiro ? ` · parceiro ${c.parceiro}` : ""}
                      {c.comissaoPercentual ? ` · comissão ${c.comissaoPercentual}%` : ""}
                    </p>
                    <p className="text-xs text-texto-tenue">
                      Validade: {data(c.validoDe)} a {data(c.validoAte)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      !c.ativo
                        ? "border border-borda text-texto-tenue"
                        : esgotado
                          ? "border border-red-500 text-red-500"
                          : "bg-kambada-amarelo text-kambada-grafite"
                    }`}
                  >
                    {!c.ativo ? "pausado" : esgotado ? "esgotado no período" : "ativo"}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-5">
                  <div>
                    <dt className="text-texto-tenue">Usos no período</dt>
                    <dd className="font-display text-lg font-bold">
                      {rel.usosNoPeriodo} / {c.limite.usos}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-texto-tenue">Usos no total</dt>
                    <dd className="font-display text-lg font-bold">{rel.usosTotal}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-tenue">Vendas (peças, com desconto)</dt>
                    <dd className="font-display text-lg font-bold">{formatarReais(emReais(rel.vendasCentavos))}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-tenue">Desconto concedido</dt>
                    <dd className="font-display text-lg font-bold">{formatarReais(emReais(rel.descontoCentavos))}</dd>
                  </div>
                  <div>
                    <dt className="text-texto-tenue">Comissão a pagar</dt>
                    <dd className="font-display text-lg font-bold">{formatarReais(emReais(rel.comissaoCentavos))}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={alternarCupom}>
                    <input type="hidden" name="codigo" value={c.codigo} />
                    <button type="submit" className="rounded-full border border-borda px-4 py-1.5 text-sm font-semibold hover:border-kambada-amarelo-escuro">
                      {c.ativo ? "Pausar" : "Reativar"}
                    </button>
                  </form>
                  <form action={excluirCupom}>
                    <input type="hidden" name="codigo" value={c.codigo} />
                    <button type="submit" className="rounded-full border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-500">
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
