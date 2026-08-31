import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { trocarCodePorToken } from "@/lib/bling/tokens";

export const dynamic = "force-dynamic";

/**
 * Volta do Bling depois da aprovação.
 *
 * O `code` que chega aqui **vale 1 minuto** — por isso a troca é feita
 * imediatamente, sem passar por tela nenhuma.
 */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erro = url.searchParams.get("error");

  if (erro) {
    return pagina(`O Bling recusou a autorização: ${erro}`, false);
  }
  if (!code) {
    return pagina("O Bling não devolveu o código de autorização.", false);
  }

  const jar = await cookies();
  const esperado = jar.get("bling_state")?.value;
  if (!esperado || esperado !== state) {
    // Sem isso, um link forjado poderia conectar a loja a outra conta.
    return pagina(
      "O código de verificação não confere. Comece de novo por /api/bling/autorizar.",
      false,
    );
  }

  try {
    await trocarCodePorToken(code);
    jar.delete("bling_state");
    return pagina(
      "Pronto! A loja está conectada ao Bling. Pode fechar esta página.",
      true,
    );
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    return pagina(`Não foi possível concluir a conexão: ${motivo}`, false);
  }
}

/** Página mínima de retorno — quem vê isto é o Alexandre, uma vez só. */
function pagina(mensagem: string, sucesso: boolean) {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conexão com o Bling</title>
<style>
  body{background:#1d1e20;color:#fff;font-family:system-ui,sans-serif;
       display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
  div{max-width:32rem;text-align:center}
  h1{color:${sucesso ? "#ffcc29" : "#ff8a80"};font-size:1.5rem;margin:0 0 12px}
  p{color:#ffffffcc;line-height:1.6;margin:0}
</style></head>
<body><div>
  <h1>${sucesso ? "Conectado" : "Não deu certo"}</h1>
  <p>${mensagem}</p>
</div></body></html>`;

  return new NextResponse(html, {
    status: sucesso ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
