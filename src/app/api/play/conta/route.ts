import { NextResponse } from "next/server";
import { urlDoSite } from "@/lib/loja/urlDoSite";
import {
  COOKIE_SESSAO,
  VALIDADE_SESSAO_S,
  criarSessaoDeConta,
  destinoSeguro,
  sessaoDaRequisicao,
} from "@/lib/play/acesso";
import {
  atualizarNovidades,
  autenticar,
  buscarPorEmail,
  contaDaRequisicao,
  contaDaSessao,
  type Conta,
  marcaDaSenha,
  cadastrar,
  confirmarEmail,
  descadastrar,
  publica,
  redefinirSenha,
} from "@/lib/play/contas";
import { enviarConfirmacao, enviarRedefinicao } from "@/lib/play/emails";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";

export const dynamic = "force-dynamic";

const DEZ_MIN = 10 * 60 * 1000;
const emProducao = process.env.NODE_ENV === "production";

function comCookie(resposta: NextResponse, conta: Conta): NextResponse {
  resposta.cookies.set({
    name: COOKIE_SESSAO,
    value: criarSessaoDeConta(conta.id, marcaDaSenha(conta)),
    httpOnly: true,
    sameSite: "lax",
    secure: emProducao,
    path: "/",
    maxAge: VALIDADE_SESSAO_S,
  });
  return resposta;
}

/** GET ?acao=eu → dados da conta da sessão · ?acao=descadastrar&token= → link do e-mail. */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const acao = url.searchParams.get("acao");
  if (acao === "descadastrar") {
    const ok = await descadastrar(url.searchParams.get("token"));
    const destino = new URL(`/kambadaplay/entrar?aviso=${ok ? "descadastrado" : "link-invalido"}`, requisicao.url);
    return NextResponse.redirect(destino);
  }
  const sessao = sessaoDaRequisicao(requisicao);
  if (!sessao) return NextResponse.json({ ok: true, conta: null, demonstracao: false });
  if (sessao.v === 1) return NextResponse.json({ ok: true, conta: null, demonstracao: true });
  const conta = await contaDaSessao(sessao);
  return NextResponse.json({ ok: true, conta: conta ? publica(conta) : null, demonstracao: false });
}

export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao);
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  const base = urlDoSite(requisicao);

  switch (corpo.acao) {
    case "cadastrar": {
      if (!dentroDoLimite(ip, "conta-cadastrar", 5, DEZ_MIN)) {
        return NextResponse.json({ ok: false, mensagem: "Muitos cadastros deste endereço. Tente mais tarde." }, { status: 429 });
      }
      if (corpo.aceiteTermos !== true) {
        return NextResponse.json({ ok: false, mensagem: "É preciso aceitar os Termos e a Política de Privacidade." }, { status: 400 });
      }
      const r = await cadastrar({ nome: corpo.nome, email: corpo.email, senha: corpo.senha, novidades: corpo.novidades });
      if (!r.ok) return NextResponse.json({ ok: false, mensagem: r.mensagem }, { status: 400 });
      let confirmacao: { enviado: boolean; link: string } | null = null;
      try {
        confirmacao = await enviarConfirmacao(base, r.conta);
      } catch {
        confirmacao = null; // sem e-mail agora, pode confirmar depois pelo "reenviar"
      }
      return comCookie(
        NextResponse.json({
          ok: true,
          conta: publica(r.conta),
          emailEnviado: confirmacao?.enviado ?? false,
          // Só fora de produção: deixa testar a confirmação sem caixa de e-mail.
          linkDeConfirmacao: !emProducao && confirmacao ? confirmacao.link : undefined,
          destino: destinoSeguro(corpo.de),
        }),
        r.conta,
      );
    }

    case "entrar": {
      if (!dentroDoLimite(ip, "conta-entrar", 10, DEZ_MIN)) {
        return NextResponse.json({ ok: false, mensagem: "Muitas tentativas. Espere alguns minutos." }, { status: 429 });
      }
      const conta = await autenticar(corpo.email, corpo.senha);
      if (!conta) return NextResponse.json({ ok: false, mensagem: "E-mail ou senha incorretos." }, { status: 401 });
      return comCookie(NextResponse.json({ ok: true, conta: publica(conta), destino: destinoSeguro(corpo.de) }), conta);
    }

    case "reenviar-confirmacao": {
      const conta = await contaDaRequisicao(requisicao);
      if (!conta) return NextResponse.json({ ok: false, mensagem: "Entre primeiro." }, { status: 401 });
      if (!dentroDoLimite(ip, "conta-reenviar", 3, DEZ_MIN)) {
        return NextResponse.json({ ok: false, mensagem: "Já reenviamos há pouco. Confira a caixa de spam." }, { status: 429 });
      }
      if (conta.confirmadoEm) return NextResponse.json({ ok: true, jaConfirmado: true });
      try {
        const r = await enviarConfirmacao(base, conta);
        return NextResponse.json({ ok: true, emailEnviado: r.enviado, linkDeConfirmacao: !emProducao ? r.link : undefined });
      } catch {
        return NextResponse.json({ ok: false, mensagem: "Não conseguimos enviar o e-mail agora." }, { status: 500 });
      }
    }

    case "confirmar": {
      const conta = await confirmarEmail(corpo.token);
      if (!conta) return NextResponse.json({ ok: false, mensagem: "Link inválido ou vencido. Peça um novo na sua conta." }, { status: 400 });
      return comCookie(NextResponse.json({ ok: true, conta: publica(conta) }), conta);
    }

    case "esqueci": {
      if (!dentroDoLimite(ip, "conta-esqueci", 5, DEZ_MIN)) {
        return NextResponse.json({ ok: false, mensagem: "Muitos pedidos. Espere alguns minutos." }, { status: 429 });
      }
      const conta = await buscarPorEmail(corpo.email);
      // Resposta igual com ou sem conta: não revela quem está cadastrado.
      let link: string | undefined;
      if (conta) {
        try {
          const r = await enviarRedefinicao(base, conta);
          if (!emProducao) link = r.link;
        } catch {
          // segue com a resposta neutra
        }
      }
      return NextResponse.json({ ok: true, mensagem: "Se este e-mail tiver conta, mandamos o link para criar uma nova senha.", linkDeRedefinicao: link });
    }

    case "redefinir": {
      const conta = await redefinirSenha(corpo.token, corpo.senha);
      if (!conta) return NextResponse.json({ ok: false, mensagem: "Link inválido ou vencido, ou senha curta (mínimo 8)." }, { status: 400 });
      return comCookie(NextResponse.json({ ok: true, conta: publica(conta) }), conta);
    }

    case "novidades": {
      const conta = await contaDaRequisicao(requisicao);
      if (!conta) return NextResponse.json({ ok: false, mensagem: "Entre primeiro." }, { status: 401 });
      const ok = await atualizarNovidades(conta.id, corpo.quer === true);
      return NextResponse.json({ ok });
    }

    default:
      return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
  }
}
