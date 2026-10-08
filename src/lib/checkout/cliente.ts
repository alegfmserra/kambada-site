/**
 * Dados de quem compra, e a validação deles.
 *
 * LGPD: CPF, telefone e endereço têm finalidade única — emitir a nota fiscal e
 * entregar o pedido. Por isso vão só para o Mercado Pago (que processa o
 * pagamento) e para o Bling (que emite a nota). Não vão para log, não vão
 * para analytics, não ficam guardados no site. Nenhuma função deste módulo
 * escreve dado pessoal em console.
 */

export type DadosCliente = {
  nome: string;
  email: string;
  telefone: string; // só dígitos, com DDD
  cpf: string; // só dígitos
  cep: string; // só dígitos
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type ErrosCliente = Partial<Record<keyof DadosCliente, string>>;

const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

const so = (v: unknown) => (typeof v === "string" ? v : "");
const digitos = (v: unknown) => so(v).replace(/\D/g, "");
const limpo = (v: unknown, max: number) => so(v).replace(/\s+/g, " ").trim().slice(0, max);

/** CPF com os dois dígitos verificadores conferidos. */
export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10]);
}

export function lerDadosCliente(bruto: unknown): { dados: DadosCliente; erros: ErrosCliente } {
  const b = (typeof bruto === "object" && bruto !== null ? bruto : {}) as Record<string, unknown>;

  const dados: DadosCliente = {
    nome: limpo(b.nome, 120),
    email: limpo(b.email, 120).toLowerCase(),
    telefone: digitos(b.telefone).slice(0, 11),
    cpf: digitos(b.cpf).slice(0, 11),
    cep: digitos(b.cep).slice(0, 8),
    logradouro: limpo(b.logradouro, 120),
    numero: limpo(b.numero, 20),
    complemento: limpo(b.complemento, 60),
    bairro: limpo(b.bairro, 60),
    cidade: limpo(b.cidade, 60),
    uf: limpo(b.uf, 2).toUpperCase(),
  };

  const erros: ErrosCliente = {};
  if (dados.nome.split(" ").filter(Boolean).length < 2) erros.nome = "Informe nome e sobrenome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email)) erros.email = "E-mail inválido.";
  if (dados.telefone.length < 10) erros.telefone = "Telefone com DDD.";
  if (!cpfValido(dados.cpf)) erros.cpf = "CPF inválido.";
  if (dados.cep.length !== 8) erros.cep = "CEP com 8 dígitos.";
  if (!dados.logradouro) erros.logradouro = "Informe a rua.";
  if (!dados.numero) erros.numero = "Informe o número (ou “s/n”).";
  if (!dados.bairro) erros.bairro = "Informe o bairro.";
  if (!dados.cidade) erros.cidade = "Informe a cidade.";
  if (!UFS.has(dados.uf)) erros.uf = "UF inválida.";

  return { dados, erros };
}

export function formatarCpf(cpf: string): string {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatarCep(cep: string): string {
  return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}
