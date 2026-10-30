/**
 * Contas de demonstração do Kambada Play (somente servidor), entrando por
 * USUÁRIO + senha, sem e-mail.
 *
 * Pedido do Alexandre (30/10/2026): mostrar o app às diretoras da escola
 * Singulare. Usuários singulari1/2/3 (corrigido no mesmo dia: os primeiros,
 * singular1/2/3, foram desligados). Senha definida por ele (não fica escrita
 * aqui: só o hash scrypt, igual ao de qualquer conta). Sem dado pessoal: o
 * nome é só um apelido.
 *
 * Como funcionam: na primeira entrada com um destes usuários, a conta é criada
 * no arquivo de contas (id fixo, marcada `demo`). Contas demo não entram na
 * base de marketing, no painel de dados nem no lembrete de e-mail. Conta demo
 * que saiu desta lista deixa de entrar (e a sessão dela cai).
 * Para desligar todas de uma vez: PLAY_CONTAS_DEMO=0 na Hostinger.
 */

export type ContaDemo = { usuario: string; apelido: string; senhaHash: string };

export const CONTAS_DEMO: ContaDemo[] = [
  {
    usuario: "singulari1",
    apelido: "Singulari Um",
    senhaHash: "scrypt$5fbeec7739b2ac23e067895ad7e4749c$6eb784b798629361c625121ceb9aad995a41d5dda9fba6710af7b647112fe720",
  },
  {
    usuario: "singulari2",
    apelido: "Singulari Dois",
    senhaHash: "scrypt$442307049ccc810610f3452fea616f3d$f2da21b1190a2a08f9b3806e69defbc6a7baf439d2dc8c6e95188e83c251133e",
  },
  {
    usuario: "singulari3",
    apelido: "Singulari Três",
    senhaHash: "scrypt$3adfee2e20a5997572c864844e40a01c$91a72fd04de16880857307a13b4fb44aa38450605ca715e236508d63e8e3934e",
  },
];

export function contasDemoLigadas(): boolean {
  return process.env.PLAY_CONTAS_DEMO !== "0";
}

/** Conta demo só vale se as demos estão ligadas e o usuário ainda está na lista acima. */
export function demoAtiva(usuario: string | undefined): boolean {
  return contasDemoLigadas() && CONTAS_DEMO.some((d) => d.usuario === usuario);
}

/** Id fixo: a mesma conta (e o mesmo progresso nos jogos) a cada entrada. */
export const idDaContaDemo = (usuario: string) => `demo-${usuario}`;
