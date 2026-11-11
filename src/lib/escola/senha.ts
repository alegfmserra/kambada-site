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
  // Contas de teste escolhidas pelo Alexandre em 02/11/2026: gestão Kambada, professor e aluno.
  gestor: "scrypt$f990d40459ec3fa2d597420f807072f0$9af609252d27c6147fae26d1acdbe3edbe0916c16448a65539ddbd66072c3dfa",
  professorTeste: "scrypt$9ade3665275b08d95dacc03c28632a67$9b9e071aef30a102461c4d01569c65c52e8a0fc323527c5e2ae78c6706a96947",
  // Acessos temporários do SESI (09/11/2026, até 14/11): senhas na ficha do OneDrive.
  alunoSesi: "scrypt$18adbfed0d60b596bff436c91ebf1c4b$5e297cafcb639f940c841e3045c0bac507ce42191465582286410c00ed1efaa2",
  professorSesi: "scrypt$662ed2325c3a9a321145c58e4b8bfd54$b51f1fc4c5b57bcc5dc89ec310e0223d6d0bc1f23484f4a4c11f33ca5fcffd52",
  coordenacaoSesi: "scrypt$85dcaecbc54e495852c5f48d45483d61$26a1eaae34a1a389e4d14518030f81cdd043fb4dc77de843429f03341b55d0e2",
  // Coordenação do Colégio Ipê (11/11/2026, até 16/11): senha na ficha do OneDrive.
  coordenacaoIpe: "scrypt$e957541964b3cc0aeb9d39e2ff33bca3$6a7f9910f392b83468441f67fe93892644c91aa1389242a2d757db7f6f64ddfd",
  alunoTeste: "scrypt$834062260330dd3cd879e6641304d3fd$0fe78381d10f80541d6e595176ce49b9cf41390b813be39590f9060e273c91cb",
};

export function hashDemo(papel: keyof typeof HASH_DEMO): string {
  if (process.env.ESCOLA_DEMO_SENHA) return gerarHash(process.env.ESCOLA_DEMO_SENHA);
  return HASH_DEMO[papel];
}
