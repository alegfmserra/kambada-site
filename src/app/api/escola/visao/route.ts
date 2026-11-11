import { NextResponse } from "next/server";
import { corpoJson } from "@/lib/play/jogos/limite";
import { falha, tratar } from "@/lib/escola/api";
import { rotaEscola } from "@/lib/escola/host";
import { marcaDoMembro, prepararVisao, quemEsta } from "@/lib/escola/servico";
import { COOKIE_ESCOLA, criarSessaoEscola, opcoesCookie, sessaoDoCabecalho } from "@/lib/escola/sessao";

/**
 * "Ver como": a coordenação troca entre as visões da própria escola
 * (coordenação · professor · aluno) sem sair. A sessão continua sendo a da
 * coordenação; muda só a visão gravada no cookie.
 */
export async function POST(req: Request) {
  const corpo = await corpoJson(req);
  if (!corpo) return falha("Pedido inválido.");
  const s = sessaoDoCabecalho(req.headers.get("cookie"));
  const quem = await quemEsta(s);
  const coord = quem && (quem.papel === "coordenacao" ? quem.membro : "coordenacao" in quem ? quem.coordenacao : undefined);
  if (!s || !coord || s.p !== "coordenacao") return falha("Só a coordenação troca de visão.", 403);
  try {
    const ver = await prepararVisao(coord, corpo.ver);
    const destino = rotaEscola(ver === "aluno" ? "/aluno" : ver === "professor" ? "/professor" : "/coordenacao");
    const r = NextResponse.json({ ok: true, destino });
    r.cookies.set(COOKIE_ESCOLA, criarSessaoEscola("coordenacao", coord.id, marcaDoMembro(coord), Date.now(), ver), opcoesCookie("coordenacao"));
    return r;
  } catch (erro) {
    return tratar(erro);
  }
}
