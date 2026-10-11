/**
 * Timer interno de manutenção (só no runtime Node, nunca no Edge nem no build).
 *
 * Complementa o cron externo: enquanto o processo estiver de pé, a cada 6 h
 * renova o token do Bling, confere as integrações e alerta a loja. A primeira
 * passada espera 2 min para não concorrer com o arranque do servidor.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.MANUTENCAO_TIMER === "0") return;

  const { rotinaDeManutencao } = await import("./lib/manutencao/saude");
  const rodar = async () => {
    try {
      const r = await rotinaDeManutencao();
      console.log(`[manutencao] ok=${r.ok} bling=${r.bling.detalhe} me=${r.melhorEnvio.ok} mp=${r.mercadoPago.ok} email=${r.email.ok}`);
    } catch (e) {
      console.error("[manutencao] falhou:", e instanceof Error ? e.message : e);
    }
  };
  setTimeout(rodar, 2 * 60 * 1000).unref();
  setInterval(rodar, 6 * 60 * 60 * 1000).unref();
}
