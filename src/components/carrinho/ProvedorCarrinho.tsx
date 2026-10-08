"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  adicionar as adicionarItem,
  alterarQuantidade as alterarItem,
  lerCarrinhoSalvo,
  remover as removerItem,
  subtotalEmCentavos,
  totalDePecas,
  type ItemCarrinho,
} from "@/lib/carrinho/logica";

/**
 * O carrinho mora no localStorage do navegador — não há conta nem banco.
 *
 * Começa vazio no servidor e só é lido depois de montar no navegador: se o
 * HTML do servidor já viesse com itens, ele não bateria com o do navegador
 * (que é quem sabe o que está salvo) e o React acusaria erro de hidratação.
 * O `pronto` diz quando o carrinho real já foi lido.
 *
 * Todo acesso ao localStorage está em try/catch: aba anônima, cota cheia ou
 * armazenamento bloqueado não podem derrubar a loja — no pior caso, o carrinho
 * só não persiste entre recarregamentos.
 */

const CHAVE = "kambada:carrinho:v1";

type ContextoCarrinho = {
  itens: ItemCarrinho[];
  pronto: boolean;
  adicionar: (item: ItemCarrinho) => void;
  alterarQuantidade: (idBling: number, quantidade: number) => void;
  remover: (idBling: number) => void;
  esvaziar: () => void;
  subtotal: number;
  pecas: number;
};

const Contexto = createContext<ContextoCarrinho | null>(null);

export function ProvedorCarrinho({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE);
      // Ler o armazenamento só existe no navegador; por isso o estado inicial
      // é preenchido aqui, depois de montar, e não no useState.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (bruto) setItens(lerCarrinhoSalvo(JSON.parse(bruto)));
    } catch {
      // Sem armazenamento: segue com o carrinho vazio.
    }
    setPronto(true);

    // Outra aba mudou o carrinho: acompanha, para as duas não divergirem.
    function aoMudarEmOutraAba(e: StorageEvent) {
      if (e.key !== CHAVE) return;
      try {
        setItens(lerCarrinhoSalvo(e.newValue ? JSON.parse(e.newValue) : []));
      } catch {
        setItens([]);
      }
    }
    window.addEventListener("storage", aoMudarEmOutraAba);
    return () => window.removeEventListener("storage", aoMudarEmOutraAba);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      // Armazenamento indisponível: o carrinho vale só nesta visita.
    }
  }, [itens, pronto]);

  const adicionar = useCallback((item: ItemCarrinho) => setItens((a) => adicionarItem(a, item)), []);
  const alterarQuantidade = useCallback(
    (idBling: number, quantidade: number) => setItens((a) => alterarItem(a, idBling, quantidade)),
    [],
  );
  const remover = useCallback((idBling: number) => setItens((a) => removerItem(a, idBling)), []);
  const esvaziar = useCallback(() => setItens([]), []);

  const valor = useMemo<ContextoCarrinho>(
    () => ({
      itens,
      pronto,
      adicionar,
      alterarQuantidade,
      remover,
      esvaziar,
      subtotal: subtotalEmCentavos(itens) / 100,
      pecas: totalDePecas(itens),
    }),
    [itens, pronto, adicionar, alterarQuantidade, remover, esvaziar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrinho(): ContextoCarrinho {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useCarrinho precisa estar dentro de <ProvedorCarrinho>");
  return contexto;
}
