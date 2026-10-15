/**
 * Mapa de PNGs já gerados em public/images/conto/.
 * Todas as 19 xilogravuras do pacote chegaram (traço no canal alpha, fundo
 * transparente): as chaves ligadas fazem a CamadaArte trocar o SVG autoral
 * pelo PNG. Se um asset regredir, vire a chave dele pra false que o fallback
 * vetorial volta sozinho.
 */
export const disponiveis: Record<string, boolean> = {
  "capa-moldura.png": true,
  "capa-estrela.png": true,
  "sertao-serra.png": true,
  "sertao-casa.png": true,
  "sertao-mato.png": true,
  "sertao-lua.png": true,
  "desejo-casal.png": true,
  "desejo-cozinha.png": true,
  "boi-estrela.png": true,
  "boi-curral.png": true,
  "morte-boi-caido.png": true,
  "morte-nuvens.png": true,
  "milagre-paje.png": true,
  "milagre-fumaca.png": true,
  "festa-brincantes.png": true,
  "festa-fogueira.png": true,
  "festa-sanfoneiro.png": true,
  "festa-bandeirolas.png": true,
  "fecho-matracas.png": true,
};
