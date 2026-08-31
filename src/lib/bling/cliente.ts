import { dormir, limitadorBling } from "./limitador";
import { ErroBling } from "./tipos";
import { tokenValido } from "./tokens";

/**
 * Cliente HTTP da API v3 do Bling.
 *
 * Cuida do que dá errado na prática:
 * - respeita 3 req/s pela fila do limitador;
 * - em 429 (limite estourado), espera e tenta de novo, com espera crescente;
 * - em 5xx, tenta de novo — erro de servidor costuma ser passageiro;
 * - em 4xx que não seja 429, falha na hora: tentar de novo não conserta.
 */

const BASE = "https://api.bling.com.br/Api/v3";
const TENTATIVAS = 3;

type Opcoes = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH";
  corpo?: unknown;
  /** Revalidação do cache do Next. Padrão: 10 minutos. */
  revalidar?: number;
};

export async function chamarBling<T>(
  caminho: string,
  opcoes: Opcoes = {},
): Promise<T> {
  const { metodo = "GET", corpo, revalidar = 600 } = opcoes;

  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      return await limitadorBling.executar(async () => {
        const token = await tokenValido();
        const resposta = await fetch(`${BASE}${caminho}`, {
          method: metodo,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            ...(corpo ? { "Content-Type": "application/json" } : {}),
          },
          body: corpo ? JSON.stringify(corpo) : undefined,
          // GET entra no cache do Next; escrita nunca.
          next: metodo === "GET" ? { revalidate: revalidar } : undefined,
          cache: metodo === "GET" ? undefined : "no-store",
        });

        if (resposta.ok) return (await resposta.json()) as T;

        const texto = await resposta.text();
        throw new ErroBling(
          `Bling respondeu ${resposta.status} em ${metodo} ${caminho}`,
          resposta.status,
          texto.slice(0, 500),
        );
      });
    } catch (erro) {
      ultimoErro = erro;
      const status = erro instanceof ErroBling ? erro.status : 0;
      const valeTentarDeNovo = status === 429 || status >= 500 || status === 0;

      if (!valeTentarDeNovo || tentativa === TENTATIVAS) throw erro;

      // 1s, 2s, 4s — dá tempo de a janela do limite virar.
      await dormir(1000 * 2 ** (tentativa - 1));
    }
  }

  throw ultimoErro;
}

/**
 * Percorre todas as páginas de um recurso.
 * O Bling pagina por `pagina`/`limite`, com teto de 100 por página.
 * `maximoDePaginas` existe para um erro de paginação não virar laço infinito.
 */
export async function listarTudo<T>(
  caminho: string,
  { limite = 100, maximoDePaginas = 50 } = {},
): Promise<T[]> {
  const itens: T[] = [];

  for (let pagina = 1; pagina <= maximoDePaginas; pagina++) {
    const separador = caminho.includes("?") ? "&" : "?";
    const url = `${caminho}${separador}pagina=${pagina}&limite=${limite}`;
    const resposta = await chamarBling<{ data?: T[] }>(url);
    const lote = resposta.data ?? [];

    itens.push(...lote);
    if (lote.length < limite) break;
  }

  return itens;
}
