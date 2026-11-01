import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** Senhas da equipe (professor e coordenação): scrypt + sal, como as contas do Play. */
export function gerarHash(senha: string): string {
  const sal = randomBytes(16).toString("hex");
  return `scrypt$${sal}$${scryptSync(senha, sal, 32).toString("hex")}`;
}

export function senhaConfere(senha: string, guardado: string): boolean {
  const [alg, sal, hash] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const calculado = scryptSync(senha, sal, 32);
  const esperado = Buffer.from(hash, "hex");
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Impressão curta de um segredo: trocou a senha (ou as figuras), a sessão antiga cai. */
export function marca(segredo: string): string {
  return createHash("sha256").update(segredo).digest("hex").slice(0, 12);
}

/** Senha inicial de professor: 3 palavras daqui + 2 algarismos, fácil de ditar. */
const PALAVRAS = ["guara", "matraca", "tambor", "juçara", "buriti", "mangue", "boi", "pandeirao", "coreira", "fogueira", "azulejo", "sobrado"];
export function senhaInicial(): string {
  const p = () => PALAVRAS[randomInt(PALAVRAS.length)].normalize("NFD").replace(/\p{M}/gu, "");
  return `${p()}-${p()}-${randomInt(10, 100)}`;
}

/**
 * Senhas da equipe de demonstração (01/11/2026). O repositório é PÚBLICO:
 * aqui só vai o hash (scrypt), de senhas aleatórias longas. As senhas em si
 * estão com o Alexandre, em `site-novo/05-kambada-play/ESCOLA-MODELO_acessos.md`
 * (pasta do OneDrive, fora do GitHub). ESCOLA_DEMO_SENHA, se existir, troca
 * todas por uma só (os testes usam isso).
 */
const HASH_DEMO = {
  coordenacao: "scrypt$9bf535eb2dd6b8da026dc2c51ff93815$a4a9186c7d82c2ff87776d55e14f7c2ccff8ea511de429b1d6bcdf9e9cd087e0",
  professor: "scrypt$46572703f788416f08f9d3c2a2381a0e$e3d72d6be30cc61f952687581444381c16ae79eb72d087d1fafe145a92fe15a8",
  // Gestão Kambada: senha escolhida pelo Alexandre, curta de propósito para a demonstração (trocar em "Senha").
  gestor: "scrypt$2fbc12023174271c4569de98634f1856$697322da024f3642c7a6344a9e9b9095b1fb97ff267195a7529aa9a2756737a3",
};

export function hashDemo(papel: "coordenacao" | "professor" | "gestor"): string {
  if (process.env.ESCOLA_DEMO_SENHA) return gerarHash(process.env.ESCOLA_DEMO_SENHA);
  return HASH_DEMO[papel];
}
