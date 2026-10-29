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
  const { enviarResumoDiario, msAteProximoResumo } = await import("./lib/manutencao/resumoDiario");
  const { aquecerPaginas } = await import("./lib/manutencao/aquecer");
  const rodar = async () => {
    try {
      const r = await rotinaDeManutencao();
      console.log(`[manutencao] ok=${r.ok} bling=${r.bling.detalhe} me=${r.melhorEnvio.ok} mp=${r.mercadoPago.ok} email=${r.email.ok}`);
    } catch (e) {
      console.error("[manutencao] falhou:", e instanceof Error ? e.message : e);
    }
  };
  setTimeout(rodar, 2 * 60 * 1000).unref();
  // Páginas de produto aquecidas 3 min depois de subir (deploy/reinício).
  setTimeout(() => {
    aquecerPaginas(process.env.URL_DO_SITE ?? "https://somoskambada.com.br")
      .then((a) => console.log(`[aquecimento] ${a.ok}/${a.paginas} páginas em ${a.ms} ms`))
      .catch((e) => console.error("[aquecimento] falhou:", e instanceof Error ? e.message : e));
  }, 3 * 60 * 1000).unref();
  setInterval(rodar, 6 * 60 * 60 * 1000).unref();

  // Lembrete de confirmação de e-mail: a cada hora, um único e-mail para quem
  // se cadastrou há mais de 24 h e não confirmou. Só um processo por hora.
  const { enviarLembretesDeConfirmacao } = await import("./lib/play/lembreteConfirmacao");
  const reserva = await import("./lib/manutencao/reserva");
  setInterval(async () => {
    try {
      if (!reserva.pastaDeDadosPresente()) return;
      if (!(await reserva.reservar(`lembrete-confirmacao-${Math.floor(Date.now() / 3_600_000)}`))) return;
      const r = await enviarLembretesDeConfirmacao();
      if (r.enviados || r.erros.length) console.log(`[lembrete-confirmacao] ${r.enviados} enviado(s)${r.erros.length ? `, erros: ${r.erros.join("; ")}` : ""}`);
    } catch (e) {
      console.error("[lembrete-confirmacao] falhou:", e instanceof Error ? e.message : e);
    }
  }, 60 * 60 * 1000).unref();

  // Etiquetas do Melhor Envio: a cada hora, postado → rastreio ao cliente;
  // entregue → pedido concluído + pesquisa. Só um processo por hora (reserva).
  const { acompanharEtiquetas } = await import("./lib/frete/etiqueta");
  const { pastaDeDadosPresente, reservar } = await import("./lib/manutencao/reserva");
  setInterval(async () => {
    try {
      if (!pastaDeDadosPresente()) return;
      if (!(await reservar(`etiquetas-${Math.floor(Date.now() / 3_600_000)}`))) return;
      const r = await acompanharEtiquetas();
      if (r.conferidas) console.log(`[etiquetas] ${r.conferidas} conferida(s)${r.erros.length ? `, erros: ${r.erros.join("; ")}` : ""}`);
    } catch (e) {
      console.error("[etiquetas] falhou:", e instanceof Error ? e.message : e);
    }
  }, 60 * 60 * 1000).unref();

  // Resumo do dia às 00:01 de São Luís (recorte fechado do dia anterior).
  const agendarResumo = () => {
    setTimeout(async () => {
      try {
        const r = await enviarResumoDiario();
        console.log(`[resumo] ${r.dia}: enviado=${r.enviado} pedidos=${r.pedidos}`);
      } catch (e) {
        console.error("[resumo] falhou:", e instanceof Error ? e.message : e);
      } finally {
        agendarResumo();
      }
    }, msAteProximoResumo()).unref();
  };
  agendarResumo();
}
