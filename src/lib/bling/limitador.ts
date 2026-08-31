/**
 * Limitador de requisições.
 *
 * O Bling permite 3 requisições por segundo e 120 mil por dia — o limite vale
 * para a conta inteira, não por aplicativo. Estourar devolve HTTP 429.
 *
 * Este limitador enfileira as chamadas e garante o espaçamento mínimo entre
 * elas. É deliberadamente simples: uma fila em memória, dentro do processo.
 * Se um dia o site rodar em mais de uma instância, cada uma terá a sua fila e
 * o teto real passa a ser 3 × instâncias — por isso o cliente também trata
 * 429 com espera, que é a rede de segurança de verdade.
 */

export class Limitador {
  private ultima = 0;
  private fila: Promise<void> = Promise.resolve();

  constructor(private readonly intervaloMs: number) {}

  /** Executa `tarefa` respeitando o espaçamento mínimo entre chamadas. */
  async executar<T>(tarefa: () => Promise<T>): Promise<T> {
    const minhaVez = this.fila.then(() => this.esperarAVez());
    // A fila avança mesmo se a tarefa falhar — senão uma falha trava tudo.
    this.fila = minhaVez.then(
      () => undefined,
      () => undefined,
    );
    await minhaVez;
    return tarefa();
  }

  private async esperarAVez(): Promise<void> {
    const agora = Date.now();
    const desdeAUltima = agora - this.ultima;
    if (desdeAUltima < this.intervaloMs) {
      await dormir(this.intervaloMs - desdeAUltima);
    }
    this.ultima = Date.now();
  }
}

export function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 3 req/s = uma a cada ~334 ms. Usamos 350 ms de folga. */
export const limitadorBling = new Limitador(350);
