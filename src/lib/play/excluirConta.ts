import { excluirConta, type Conta } from "./contas";
import { enviarContaExcluida } from "./emails";
import { desvincularPartidasDaConta } from "./jogos/partidas";
import { apagarPerfil } from "./jogos/perfilArmazem";
import { anonimizarJogador, jogadorDaConta } from "./jogos/placar";

/**
 * Exclusão da conta do Kambada Play pelo próprio titular (17/11/2026).
 *
 * Pede a senha e apaga, nesta ordem:
 *   1. a conta (nome, e-mail, senha, aceite, opt-in, aniversário) — a partir
 *      daqui a sessão já não vale em lugar nenhum;
 *   2. o vínculo com o ranking: as pontuações antigas ficam, para o placar
 *      passado não mudar, mas viram "Brincante" com um identificador novo que
 *      não leva de volta à conta;
 *   3. o perfil do Arraial (nível, coleção, recados, amizades);
 *   4. o vínculo das partidas registradas (a contagem anônima de partidas
 *      iniciadas e concluídas fica: é indicador do projeto e não identifica ninguém).
 * Depois confirma por e-mail (quando a conta tinha e-mail e há SMTP).
 *
 * O que NÃO é apagado aqui, de propósito: os pedidos feitos na loja com o mesmo
 * e-mail (registro fiscal da loja; só deixam de aparecer em "Minha conta") e os
 * cupons já emitidos (continuam na lista da loja até vencerem).
 *
 * A conta sai primeiro: se um passo seguinte falhar, o que sobra são dados já
 * sem dono (o id da conta é aleatório e não existe mais), e o erro vai no
 * resultado para a rota registrar.
 */
export type ExclusaoDeConta =
  | { ok: false; mensagem: string }
  | {
      ok: true;
      conta: Pick<Conta, "id" | "nome" | "email" | "usuario">;
      pontuacoesAnonimizadas: number;
      perfilApagado: boolean;
      partidasDesvinculadas: number;
      emailEnviado: boolean;
      /** Passos que falharam depois de a conta ter sido apagada (para o registro do servidor). */
      falhas: string[];
    };

export async function excluirContaDoPlay(contaId: string, senha: unknown, base: string): Promise<ExclusaoDeConta> {
  const r = await excluirConta(contaId, senha);
  if (!r.ok) return { ok: false, mensagem: r.mensagem };
  const { conta } = r;
  const falhas: string[] = [];
  const tentar = async <T>(nome: string, fazer: () => Promise<T>, padrao: T): Promise<T> => {
    try {
      return await fazer();
    } catch (erro) {
      falhas.push(`${nome}: ${String(erro)}`);
      return padrao;
    }
  };
  const pontuacoesAnonimizadas = await tentar("placar", () => anonimizarJogador(jogadorDaConta(conta.id)), 0);
  const perfilApagado = await tentar("perfil", () => apagarPerfil(conta.id), false);
  const partidasDesvinculadas = await tentar("partidas", () => desvincularPartidasDaConta(conta.id), 0);
  const emailEnviado = conta.usuario ? false : await tentar("e-mail", () => enviarContaExcluida(base, conta), false);
  return {
    ok: true,
    conta: { id: conta.id, nome: conta.nome, email: conta.email, usuario: conta.usuario },
    pontuacoesAnonimizadas,
    perfilApagado,
    partidasDesvinculadas,
    emailEnviado,
    falhas,
  };
}
