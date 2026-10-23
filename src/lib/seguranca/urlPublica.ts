import { urlDoSite } from "@/lib/loja/urlDoSite";

/**
 * Endereço para redirecionar dentro do próprio site. Atrás do proxy da
 * Hostinger o `request.url` chega como https://0.0.0.0:3000/..., então
 * `new URL(caminho, requisicao.url)` mandava o visitante para um endereço que
 * não abre (e expunha a porta interna). A base vem de `urlDoSite`, que só
 * aceita hosts conhecidos (Host forjado cai no domínio oficial).
 */
export function urlPublica(caminho: string, requisicao: Request): URL {
  return new URL(caminho, urlDoSite(requisicao));
}
