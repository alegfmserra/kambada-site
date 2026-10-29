import { emailConfigurado } from "../email/enviar";
import { listarContas, marcarLembreteDeConfirmacao, precisaLembreteDeConfirmacao } from "./contas";
import { enviarConfirmacao } from "./emails";

/**
 * Lembrete único de confirmação de e-mail, 24 h depois do cadastro.
 *
 * Roda de hora em hora pelo timer de `instrumentation.ts`. Sem SMTP
 * configurado não envia nem marca nada (a conta continua elegível).
 */
export async function enviarLembretesDeConfirmacao(
  base = process.env.URL_DO_SITE ?? "https://somoskambada.com.br",
  agora = new Date(),
): Promise<{ enviados: number; erros: string[] }> {
  if (!emailConfigurado()) return { enviados: 0, erros: [] };
  const pendentes = (await listarContas()).filter((c) => precisaLembreteDeConfirmacao(c, agora));
  let enviados = 0;
  const erros: string[] = [];
  for (const c of pendentes) {
    try {
      const r = await enviarConfirmacao(base, c, true);
      if (r.enviado) {
        await marcarLembreteDeConfirmacao(c.id, agora);
        enviados++;
      }
    } catch (e) {
      erros.push(`${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { enviados, erros };
}
