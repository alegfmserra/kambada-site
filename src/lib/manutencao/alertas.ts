/**
 * Alertas operacionais por e-mail para a loja.
 *
 * Antes (auditoria de 10/10/2026), toda falha ia para `console.error` — que
 * ninguém lê na Hostinger. Agora o que importa chega em somoskambada@gmail.com
 * pelo mesmo SMTP dos pedidos. Para não virar spam, o mesmo assunto só é
 * reenviado depois de SILENCIO_MS (guardado em arquivo, sobrevive a reinício).
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import { escaparHtml } from "../email/confirmacao";
import { liberar, pastaDeDadosPresente, reservar } from "./reserva";

const SILENCIO_MS = 6 * 60 * 60 * 1000;

function arquivoDeAlertas(): string {
  return join(dirname(arquivoTokens()), "alertas.json");
}

async function lerUltimos(): Promise<Record<string, number>> {
  try {
    return JSON.parse(await readFile(arquivoDeAlertas(), "utf8")) as Record<string, number>;
  } catch {
    return {};
  }
}

async function gravarUltimos(d: Record<string, number>): Promise<void> {
  const caminho = arquivoDeAlertas();
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(`${caminho}.tmp`, JSON.stringify(d), "utf8");
  await rename(`${caminho}.tmp`, caminho);
}

export type ResultadoAlerta = "enviado" | "silenciado" | "sem_email" | "falhou";

/**
 * Manda um alerta à loja. `chave` identifica o problema (ex.: "bling-token");
 * o mesmo problema não repete e-mail dentro de 6 h.
 */
export async function alertar(chave: string, assunto: string, corpo: string): Promise<ResultadoAlerta> {
  if (!emailConfigurado()) {
    console.error(`[alerta sem e-mail] ${assunto}\n${corpo}`);
    return "sem_email";
  }
  if (!pastaDeDadosPresente()) {
    console.error(`[alerta] processo sem a pasta de dados (sobra de deploy antigo?) — não envio: ${assunto}`);
    return "silenciado";
  }
  const ultimos = await lerUltimos();
  const agora = Date.now();
  if (ultimos[chave] && agora - ultimos[chave] < SILENCIO_MS) return "silenciado";
  // Dois processos podem passar juntos pela conferência acima: só um envia.
  const reserva = `alerta-${chave}-${Math.floor(agora / SILENCIO_MS)}`;
  if (!(await reservar(reserva))) return "silenciado";
  try {
    await enviarEmail({
      para: emailDaLoja(),
      assunto: `⚠️ Kambada site · ${assunto}`,
      texto: `${corpo}\n\n— alerta automático do site (${new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })})`,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#201E1F">${escaparHtml(corpo)}</pre>
<p style="font-size:12px;color:#5e6266">Alerta automático do site · ${new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })}</p>`,
    });
    ultimos[chave] = agora;
    await gravarUltimos(ultimos);
    return "enviado";
  } catch (e) {
    console.error("[alerta] falhou ao enviar:", e instanceof Error ? e.message : e);
    await liberar(reserva).catch(() => undefined);
    return "falhou";
  }
}
