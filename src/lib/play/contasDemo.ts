/**
 * Contas de demonstração do Kambada Play (somente servidor), entrando por
 * USUÁRIO + senha, sem e-mail.
 *
 * Pedido do Alexandre (30/10/2026): mostrar o app às diretoras da escola
 * Singulare. Senha definida por ele (não fica escrita aqui: só o hash scrypt,
 * igual ao de qualquer conta). Sem dado pessoal: o nome é só um apelido.
 *
 * Como funcionam: na primeira entrada com um destes usuários, a conta é criada
 * no arquivo de contas (id fixo, marcada `demo`). Contas demo não entram na
 * base de marketing, no painel de dados nem no lembrete de e-mail.
 * Para desligar todas de uma vez: PLAY_CONTAS_DEMO=0 na Hostinger.
 */

export type ContaDemo = { usuario: string; apelido: string; senhaHash: string };

export const CONTAS_DEMO: ContaDemo[] = [
  {
    usuario: "singular1",
    apelido: "Singular Um",
    senhaHash: "scrypt$29ee62a80e509eb2437963308db41ed1$94195c5eb200aadddedb283eb4cff067d59ce00182b9941b8dd3a3eecdff878a",
  },
  {
    usuario: "singular2",
    apelido: "Singular Dois",
    senhaHash: "scrypt$69128a889019db4bb44dd8311d0c9940$1c8edc84880acd48c5f5d5833fa5d7127e0131a4b19a7de9f24d3dbc797e53e3",
  },
  {
    usuario: "singular3",
    apelido: "Singular Três",
    senhaHash: "scrypt$40f81dac6e1376625f96314603a80585$56e0c5af344adc05d92133307c4a3ac11d251410c0e556e866d40a4e98c1a9b7",
  },
];

export function contasDemoLigadas(): boolean {
  return process.env.PLAY_CONTAS_DEMO !== "0";
}

/** Id fixo: a mesma conta (e o mesmo progresso nos jogos) a cada entrada. */
export const idDaContaDemo = (usuario: string) => `demo-${usuario}`;
