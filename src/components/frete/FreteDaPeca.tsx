"use client";

import { useId, useMemo, useState } from "react";
import { useOpcaoAtiva } from "@/components/produto/OpcaoAtiva";
import CalculoDeFrete from "./CalculoDeFrete";

/**
 * "Calcular frete" na página da peça (17/11/2026): fechado por padrão, para não
 * disputar com o botão de comprar; aberto, é o mesmo campo de CEP do carrinho.
 *
 * Cota 1 unidade. A opção cotada é a que a pessoa escolheu (tamanho, estampa,
 * suporte); sem escolha, a primeira disponível. O servidor recusa opção sem
 * estoque, então só entram as que podem ser compradas.
 */
export default function FreteDaPeca({
  opcoes,
  semLimite = false,
}: {
  opcoes: { idBling: number; quantidade: number }[];
  /** Peça feita por encomenda ou de estoque livre: vende com saldo zero. */
  semLimite?: boolean;
}) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const ativa = useOpcaoAtiva();
  const idEscolhido = ativa?.idOpcao ?? null;

  const itens = useMemo(() => {
    const disponiveis = opcoes.filter((o) => semLimite || o.quantidade > 0);
    const alvo = disponiveis.find((o) => o.idBling === idEscolhido) ?? disponiveis[0];
    return alvo ? [{ idBling: alvo.idBling, quantidade: 1 }] : [];
  }, [opcoes, semLimite, idEscolhido]);

  if (itens.length === 0) return null;

  return (
    <div className="mt-6" data-area="produto-frete">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={`${id}-frete`}
        data-alvo={aberto ? "frete-fechar" : "frete-abrir"}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-texto underline underline-offset-4 hover-marca"
      >
        <span aria-hidden="true">🚚</span> Calcular frete e prazo
      </button>
      <div id={`${id}-frete`} hidden={!aberto} className="mt-2 max-w-md">
        {aberto && <CalculoDeFrete itens={itens} local="produto" nota="Para 1 unidade desta peça." />}
      </div>
    </div>
  );
}
