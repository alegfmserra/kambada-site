import type { TabelaDeMedidas } from "@/lib/loja/medidas";

/** Âncora do link "Qual meu tamanho?" que fica junto da escolha de tamanho. */
export const ANCORA_GUIA_DE_TAMANHOS = "guia-de-tamanhos";

/** Tabela de medidas da peça, aberta por padrão: menos troca, menos reclamação. */
export default function GuiaDeTamanhos({ tabela }: { tabela: TabelaDeMedidas }) {
  return (
    <details open id={ANCORA_GUIA_DE_TAMANHOS} className="mt-6 scroll-mt-24 rounded-2xl border border-borda bg-superficie p-4">
      <summary data-alvo="guia-de-tamanhos" className="cursor-pointer font-display text-sm font-semibold uppercase text-texto-tenue">
        Guia de tamanhos · {tabela.titulo}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Medidas por tamanho · {tabela.titulo}</caption>
          <thead>
            <tr className="text-left text-xs uppercase text-texto-tenue">
              <th scope="col" className="py-1.5 pr-3 font-semibold">Tamanho</th>
              {tabela.colunas.map((c) => (
                <th key={c} scope="col" className="py-1.5 pr-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.linhas.map((l) => (
              <tr key={l.tamanho} className="border-t border-borda">
                <th scope="row" className="py-1.5 pr-3 text-left font-display font-bold">{l.tamanho}</th>
                {l.valores.map((v, i) => (
                  <td key={i} className="py-1.5 pr-3 whitespace-nowrap">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-texto-suave">{tabela.observacao}</p>
    </details>
  );
}
