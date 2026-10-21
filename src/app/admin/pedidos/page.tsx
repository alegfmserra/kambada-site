import type { Metadata } from "next";
import { cookies } from "next/headers";
import FormularioLogin from "@/components/admin/FormularioLogin";
import { adminConfigurado, COOKIE_ADMIN, sessaoValida } from "@/lib/admin/sessao";
import { situacaoNoBling } from "@/lib/checkout/acompanhar";
import { emailConfigurado } from "@/lib/email/enviar";
import { formatarReais } from "@/lib/loja/dinheiro";
import { listarRegistros, type Etapa, type RegistroPedido } from "@/lib/pedidos/registro";
import MenuAdmin from "@/components/admin/MenuAdmin";
import BotaoComEspera from "@/components/admin/BotaoComEspera";
import { TRANSPORTADORAS, linkDeRastreio, rotuloEstorno } from "@/lib/email/posVenda";
import {
  avisarPostagem,
  marcarProblemaEntrega,
  problemaResolvido,
  trocarPecaDoPedido,
  comprarEtiqueta,
  conferirRastreio,
  criarDevolucao,
  enviarDevolucao,
  registrarDevolucaoRecebida,
  cancelarEEstornar,
  desfazerConclusaoPedido,
  marcarConclusao,
  marcarProducao,
  marcarProntoRetirada,
  notaResolvida,
  refazerPendencias,
} from "../acoes";
import { avaliarCancelamento, etapaDoPedido } from "@/lib/pedidos/cancelamento";
import { rotuloProblema } from "@/lib/pedidos/posVendaLoja";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { indexarOpcoes } from "@/lib/carrinho/validar";

export const metadata: Metadata = {
  title: "Pedidos do site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Controle dos pedidos do site — só para a loja (senha em ADMIN_SENHA).
 *
 * Mostra cada venda paga pelo site com o que o site fez depois dela (registro,
 * estoque, nota, e-mail) e a situação ATUAL no Bling. Para mudar a situação,
 * separar, emitir nota ou etiqueta, o lugar continua sendo o Bling — o botão
 * "abrir no Bling" leva direto ao pedido. Assim não há dois cadastros
 * divergindo.
 */

const dataLocal = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Selo({ nome, etapa, desligada }: { nome: string; etapa?: Etapa; desligada?: boolean }) {
  const [cor, texto] = desligada
    ? ["border border-borda text-texto-tenue", "desligado"]
    : etapa?.feitoEm
      ? ["bg-kambada-amarelo text-kambada-grafite", "ok"]
      : etapa?.erro
        ? ["border border-red-500 text-red-500", "falhou"]
        : ["border border-borda text-texto-tenue", "pendente"];
  return (
    <span title={etapa?.erro ? `${etapa.erro}${etapa.detalhe ? ` — ${etapa.detalhe}` : ""}` : undefined}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cor}`}>
      {nome}: {texto}
    </span>
  );
}

async function comSituacao(registros: RegistroPedido[]) {
  // Situação ao vivo no Bling para os 30 mais recentes (limite de 3 req/s do Bling).
  return Promise.all(
    registros.map(async (r, i) => {
      if (i >= 30) return { r, situacao: "—" };
      try {
        return { r, situacao: (await situacaoNoBling(r.bling.idPedido)).situacao };
      } catch {
        return { r, situacao: "Bling indisponível" };
      }
    }),
  );
}

/** Produção, entrega/retirada e cancelamento — o pós-venda de um pedido ativo. */
function AcoesDoPedido({ r }: { r: RegistroPedido }) {
  const avaliacao = avaliarCancelamento(r);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-borda pt-3 text-sm">
      {!r.conclusao && !r.envio && (
        <form action={marcarProducao} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="ref" value={r.ref} />
          <BotaoComEspera
            esperando="Avisando o cliente…"
            className={BOTAO}
            title="Avisa o cliente por e-mail (daqui em diante o pedido não pode ser cancelado) e põe o pedido em andamento no Bling"
          >
            {r.producao ? `Produção desde ${dataLocal(r.producao.iniciadaEm)} · reenviar aviso` : "Produção iniciada"}
          </BotaoComEspera>
        </form>
      )}
      {r.entrega.retirada && !r.conclusao && (
        <form action={marcarProntoRetirada}>
          <input type="hidden" name="ref" value={r.ref} />
          <BotaoComEspera esperando="Avisando o cliente…" className={BOTAO} title="E-mail ao cliente com o endereço do ateliê e o WhatsApp para combinar o horário">
            {r.prontoParaRetirada ? `Pronto desde ${dataLocal(r.prontoParaRetirada.em)} · reenviar aviso` : "Pronto para retirada"}
          </BotaoComEspera>
        </form>
      )}
      {r.conclusao ? (
        <form action={desfazerConclusaoPedido} className="flex items-center gap-2">
          <input type="hidden" name="ref" value={r.ref} />
          <span className="font-semibold">
            {r.conclusao.tipo === "retirado" ? "Retirado" : "Entregue"} em {dataLocal(r.conclusao.em)}
            {r.conclusao.bling?.erro ? " · Bling não atualizou" : ""}
          </span>
          <button type="submit" className="text-xs underline">desfazer</button>
        </form>
      ) : (
        <form action={marcarConclusao}>
          <input type="hidden" name="ref" value={r.ref} />
          <input type="hidden" name="tipo" value={r.entrega.retirada ? "retirado" : "entregue"} />
          <BotaoComEspera
            esperando="Concluindo…"
            className={BOTAO_FORTE}
            title="Encerra o pedido, marca Atendido no Bling e manda ao cliente o e-mail com a pesquisa"
          >
            {r.entrega.retirada ? "Cliente retirou" : "Entregue"}
          </BotaoComEspera>
        </form>
      )}
      <span className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold">WhatsApp:</span>
        {[
          ["geral", "conversa", true],
          ["producao", "produção", Boolean(r.producao)],
          ["pronto", "pronto p/ retirar", r.entrega.retirada],
          ["rastreio", "rastreio", Boolean(r.envio)],
          ["problema", "problema na entrega", Boolean(r.envio) && !r.conclusao],
        ]
          .filter(([, , mostra]) => mostra)
          .map(([tipo, rotulo]) => (
            <a
              key={String(tipo)}
              href={`/admin/whatsapp?ref=${r.ref}&tipo=${tipo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-green-600 px-2.5 py-0.5 font-semibold text-green-700 hover:bg-green-600 hover:text-white"
            >
              {rotulo}
            </a>
          ))}
      </span>
      {(r.envio || r.conclusao) && (
        <details className="ml-auto">
          <summary className="cursor-pointer text-sm font-semibold text-orange-600">Devolução recebida (arrependimento)</summary>
          <form action={registrarDevolucaoRecebida} className="mt-2 max-w-sm space-y-2 rounded-xl border border-orange-500 p-3">
            <input type="hidden" name="ref" value={r.ref} />
            <p className="text-xs text-texto-suave">
              Use quando a peça VOLTOU ao ateliê (até 7 dias do recebimento). Devolve {formatarReais(r.total)} (com o frete),
              devolve o estoque, cancela no Bling e avisa o cliente. Depois, a nota de devolução em dois passos.
            </p>
            <label className="flex items-center gap-1.5 text-xs font-semibold">
              <input type="checkbox" name="confirmo" /> Confirmo que a peça voltou
            </label>
            <BotaoComEspera esperando="Registrando e estornando… não feche a página" className="rounded-full bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white">
              Registrar devolução e estornar
            </BotaoComEspera>
          </form>
        </details>
      )}
      <details className={r.envio || r.conclusao ? "" : "ml-auto"}>
        <summary className="cursor-pointer text-sm font-semibold text-red-500">Cancelar e estornar</summary>
        <form action={cancelarEEstornar} className="mt-2 max-w-sm space-y-2 rounded-xl border border-red-500 p-3">
          <input type="hidden" name="ref" value={r.ref} />
          {!avaliacao.pode && <p className="text-xs font-semibold text-red-500">Atenção: {avaliacao.motivo}</p>}
          <p className="text-xs text-texto-suave">
            Devolve {formatarReais(r.total)} pelo Mercado Pago (menos o valor retido, se houver), devolve o estoque,
            cancela o pedido no Bling e avisa o cliente. A nota fiscal fica para você (o site mostra o que fazer).
          </p>
          <label className="flex flex-wrap items-center gap-1.5 text-xs">
            Reter (arte de personalizada) R$
            <input name="reter" inputMode="decimal" placeholder="0,00" className="w-20 rounded border border-borda bg-fundo px-2 py-1" />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <input type="checkbox" name="confirmo" /> Confirmo o cancelamento e o estorno
          </label>
          <BotaoComEspera
            esperando="Cancelando e estornando… não feche a página"
            className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white"
          >
            Cancelar e estornar
          </BotaoComEspera>
        </form>
      </details>
    </div>
  );
}

/** Andamento de um cancelamento feito pelo site, com o lembrete da nota. */
function BlocoCancelamento({ r }: { r: RegistroPedido }) {
  const c = r.cancelamento!;
  const nota = c.nota;
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-red-500 px-4 py-3 text-sm">
      <p className="font-semibold text-red-500">
        {c.concluidoEm
          ? `Cancelado pelo site em ${dataLocal(c.concluidoEm)}${c.retido ? ` · retido ${formatarReais(c.retido)} (arte)` : ""}`
          : "Cancelamento não concluído — o estorno falhou"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Selo nome="Estorno MP" etapa={c.estornoMp} />
        <Selo nome="Estoque devolvido" etapa={c.estoqueBling} desligada={!r.estoque?.feitoEm && !c.estoqueBling} />
        <Selo nome="Pedido cancelado no Bling" etapa={c.pedidoBling} />
        <Selo nome="E-mail ao cliente" etapa={c.emailCliente} />
        {r.etiqueta?.compradaEm && !r.envio && <Selo nome="Etiqueta cancelada (saldo de volta)" etapa={c.etiquetaMe} />}
      </div>
      {r.devolucao?.pecaRecebidaEm && (
        <p className="text-texto-suave">Peça devolvida pelo cliente recebida em {dataLocal(r.devolucao.pecaRecebidaEm)}.</p>
      )}
      {nota?.acao === "cancelar-no-bling" && !nota.resolvidaEm && (
        <form action={notaResolvida} className="flex flex-wrap items-center gap-2 rounded-lg bg-superficie p-2">
          <input type="hidden" name="ref" value={r.ref} />
          <span className="font-semibold">Nota fiscal: cancelar no Bling (até 24 h da emissão), com justificativa de 15+ caracteres.</span>
          {r.nfe?.idNota && (
            <a href={`https://www.bling.com.br/notas.fiscais.php#edit/${r.nfe.idNota}`} target="_blank" rel="noopener noreferrer" className="underline">
              abrir a nota no Bling
            </a>
          )}
          <BotaoComEspera esperando="Salvando…" className={BOTAO}>Nota cancelada</BotaoComEspera>
        </form>
      )}
      {nota?.acao === "devolucao-com-glauco" && <BlocoDevolucao r={r} />}
      {nota?.resolvidaEm && <p className="text-texto-suave">Nota resolvida em {dataLocal(nota.resolvidaEm)}.</p>}
      {(!c.concluidoEm || [c.estoqueBling, c.pedidoBling, c.emailCliente].some((e) => e?.erro)) && (
        <form action={cancelarEEstornar}>
          <input type="hidden" name="ref" value={r.ref} />
          <input type="hidden" name="confirmo" value="on" />
          <BotaoComEspera esperando="Refazendo…" className={BOTAO}>Refazer o que falhou</BotaoComEspera>
        </form>
      )}
    </div>
  );
}

type Variacoes = Map<number, { id: number; rotulo: string; quantidade: number }[]>;

/** Para cada peça vendida, as outras variações do mesmo produto (troca de tamanho/cor). */
async function variacoesParaTroca(registros: RegistroPedido[]): Promise<Variacoes> {
  const mapa: Variacoes = new Map();
  try {
    const indice = indexarOpcoes(await buscarCatalogo());
    for (const r of registros) {
      for (const i of r.itens) {
        const achado = indice.get(i.id);
        if (!achado || mapa.has(i.id)) continue;
        const outras = (achado.produto.opcoes ?? [])
          .filter((o) => o.idBling !== i.id)
          .map((o) => ({ id: o.idBling, rotulo: o.rotulo, quantidade: o.quantidade }));
        if (outras.length) mapa.set(i.id, outras);
      }
    }
  } catch {
    // Catálogo indisponível: a troca some da tela, o resto continua.
  }
  return mapa;
}

const ORIENTACAO_PROBLEMA = {
  "nao-entregue": "Falar com o cliente (WhatsApp → problema na entrega): confirmar endereço e horário. A transportadora costuma tentar de novo; se voltar ao ateliê, reenviar com nova etiqueta ou estornar.",
  devolvido: "A peça está voltando ao ateliê. Combinar com o cliente: reenvio (nova etiqueta, endereço confirmado) ou estorno.",
  extravio: "Abrir reclamação no Melhor Envio (Pedidos → o envio → Ajuda). O seguro cobre o valor declarado (valor das peças). Combinar com o cliente: reenvio ou estorno.",
} as const;

/** Problema na entrega (aviso + orientação) e troca de peça. */
function BlocoProblemaETroca({ r, variacoes }: { r: RegistroPedido; variacoes: Variacoes }) {
  const p = r.problemaEntrega;
  const trocaveis = r.itens.filter((i) => variacoes.has(i.id));
  return (
    <>
      {p && !p.resolvidoEm && (
        <form action={problemaResolvido} className="mt-3 space-y-1 rounded-xl border border-red-500 px-4 py-3 text-sm">
          <input type="hidden" name="ref" value={r.ref} />
          <p className="font-semibold text-red-500">
            Entrega: {rotuloProblema(p.tipo)} — {p.origem === "melhor-envio" ? "informado pelo Melhor Envio" : "marcado pela loja"} em {dataLocal(p.detectadoEm)}
            {p.observacao ? ` · ${p.observacao}` : ""}
          </p>
          <p className="text-texto-suave">{ORIENTACAO_PROBLEMA[p.tipo]}</p>
          <BotaoComEspera esperando="Salvando…" className={BOTAO}>Problema resolvido</BotaoComEspera>
        </form>
      )}
      {(r.trocas ?? []).map((t) => (
        <p key={t.em} className="mt-2 text-sm">
          Troca em {dataLocal(t.em)}: {t.quantidade}× {t.de.nome} → {t.para.nome}{" "}
          {t.estoque?.feitoEm ? "· estoque ajustado no Bling" : t.estoque?.erro ? `· estoque NÃO ajustado: ${t.estoque.erro}` : ""}
        </p>
      ))}
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        {r.envio && !r.conclusao && (!p || p.resolvidoEm) && (
          <details>
            <summary className="cursor-pointer font-semibold text-red-500">Problema na entrega</summary>
            <form action={marcarProblemaEntrega} className="mt-2 flex max-w-md flex-wrap items-center gap-2 rounded-xl border border-borda p-3">
              <input type="hidden" name="ref" value={r.ref} />
              <select name="tipo" className="rounded-lg border border-borda bg-fundo px-2 py-1">
                <option value="nao-entregue">Não entregue</option>
                <option value="devolvido">Devolvido ao remetente</option>
                <option value="extravio">Extraviado</option>
              </select>
              <input name="observacao" placeholder="observação (opcional)" className="min-w-0 flex-1 rounded-lg border border-borda bg-fundo px-2 py-1" />
              <BotaoComEspera esperando="Registrando…" className={BOTAO}>Registrar</BotaoComEspera>
            </form>
          </details>
        )}
        {trocaveis.length > 0 && (
          <details>
            <summary className="cursor-pointer font-semibold">Trocar peça (tamanho/cor)</summary>
            {trocaveis.map((i) => (
              <form key={i.id} action={trocarPecaDoPedido} className="mt-2 flex max-w-xl flex-wrap items-center gap-2 rounded-xl border border-borda p-3">
                <input type="hidden" name="ref" value={r.ref} />
                <input type="hidden" name="de" value={i.id} />
                <span className="font-semibold">{i.nome} →</span>
                <select name="para" className="rounded-lg border border-borda bg-fundo px-2 py-1">
                  {variacoes.get(i.id)!.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.rotulo} ({v.quantidade} em estoque)
                    </option>
                  ))}
                </select>
                <input type="number" name="quantidade" min={1} max={i.quantidade} defaultValue={i.quantidade} className="w-16 rounded-lg border border-borda bg-fundo px-2 py-1" />
                <BotaoComEspera esperando="Ajustando estoque…" className={BOTAO}>Trocar</BotaoComEspera>
                <span className="w-full text-xs text-texto-suave">Devolve a antiga ao estoque e baixa a nova no Bling. Nota da troca: com o Glauco. Etiqueta de ida: Melhor Envio.</span>
              </form>
            ))}
          </details>
        )}
      </div>
    </>
  );
}

/** Nota de devolução em dois passos: criar (rascunho no Bling) → conferir → enviar à SEFAZ. */
function BlocoDevolucao({ r }: { r: RegistroPedido }) {
  const d = r.devolucao;
  return (
    <div className="space-y-2 rounded-lg bg-superficie p-2">
      <p className="font-semibold">
        Nota fiscal de devolução (entrada, CFOP inverso ao da venda, referenciando a nota de venda)
        {d?.enviadaEm ? ` — enviada à SEFAZ em ${dataLocal(d.enviadaEm)}${d.numero ? `, nº ${d.numero}` : ""}` : ""}
      </p>
      {!d?.idNota && (
        <form action={criarDevolucao}>
          <input type="hidden" name="ref" value={r.ref} />
          <BotaoComEspera esperando="Criando a nota no Bling…" className={BOTAO_FORTE} title="Cria no Bling, sem enviar à SEFAZ">
            1. Criar nota de devolução (rascunho)
          </BotaoComEspera>
        </form>
      )}
      {d?.idNota && !d.enviadaEm && (
        <form action={enviarDevolucao} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="ref" value={r.ref} />
          <a href={`https://www.bling.com.br/notas.fiscais.php#edit/${d.idNota}`} target="_blank" rel="noopener noreferrer" className="underline">
            conferir a nota no Bling{d.referencia ? ` (referencia ${d.referencia})` : ""}
          </a>
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <input type="checkbox" name="confirmo" /> Conferi
          </label>
          <BotaoComEspera esperando="Enviando à SEFAZ…" className={BOTAO_FORTE}>
            2. Enviar à SEFAZ
          </BotaoComEspera>
        </form>
      )}
      {d?.erro && <p className="text-xs font-semibold text-red-500">Devolução: {d.erro}</p>}
    </div>
  );
}

const SITUACAO_ME: Record<string, string> = {
  pending: "no carrinho (não paga)",
  released: "paga",
  generated: "gerada — falta postar",
  posted: "postada",
  delivered: "entregue",
  canceled: "cancelada no Melhor Envio",
  undelivered: "não entregue",
};

/** Etiqueta do Melhor Envio comprada pelo site: comprar, imprimir, conferir rastreio. */
function BlocoEtiqueta({ r }: { r: RegistroPedido }) {
  const e = r.etiqueta;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-borda pt-3 text-sm">
      <span className="font-semibold">Etiqueta:</span>
      {e?.compradaEm ? (
        <>
          <span>
            {e.transportadora} {e.servico}
            {e.valor ? ` · ${formatarReais(e.valor)}` : ""} · {SITUACAO_ME[e.situacaoMe ?? ""] ?? (e.geradaEm ? "gerada — falta postar" : "paga")}
            {e.rastreio ? ` · ${e.rastreio}` : ""}
          </span>
          {e.urlImpressao && (
            <a href={e.urlImpressao} target="_blank" rel="noopener noreferrer" className={BOTAO_FORTE}>
              Imprimir etiqueta
            </a>
          )}
          <form action={conferirRastreio}>
            <input type="hidden" name="ref" value={r.ref} />
            <BotaoComEspera esperando="Consultando o Melhor Envio…" className={BOTAO}>
              Atualizar rastreio
            </BotaoComEspera>
          </form>
        </>
      ) : (
        <span className="text-texto-suave">
          {e?.idMe ? `no carrinho do Melhor Envio (${e.transportadora} ${e.servico}${e.valor ? ` · ${formatarReais(e.valor)}` : ""})` : `${r.entrega.descricao} — ainda não comprada`}
        </span>
      )}
      {(!e?.compradaEm || !e.geradaEm || !e.urlImpressao) && (
        <form action={comprarEtiqueta}>
          <input type="hidden" name="ref" value={r.ref} />
          <BotaoComEspera
            esperando="Comprando a etiqueta…"
            className={BOTAO_FORTE}
            title="Usa o saldo da carteira do Melhor Envio, com o mesmo serviço que o cliente escolheu e a nota fiscal vinculada"
          >
            {e?.idMe ? "Continuar compra da etiqueta" : "Comprar etiqueta (Melhor Envio)"}
          </BotaoComEspera>
        </form>
      )}
      {e?.erro && <p className="w-full text-xs font-semibold text-red-500">Melhor Envio: {e.erro}</p>}
      {e?.compradaEm && (
        <p className="w-full text-xs text-texto-suave">
          O site confere o Melhor Envio a cada hora: quando a etiqueta for postada, o cliente recebe o rastreio; quando for
          entregue, o pedido é concluído e o cliente recebe o e-mail com a pesquisa.
        </p>
      )}
    </div>
  );
}

/** O que acabou de acontecer, em uma frase — para não ficar na dúvida se o clique pegou. */
function AvisoDaAcao({ aviso, r }: { aviso?: string; r?: RegistroPedido }) {
  if (!aviso || !r) return null;
  let ok = true;
  let texto: string | null = null;
  if (aviso === "cancelado") {
    const c = r.cancelamento;
    if (c?.concluidoEm) {
      const devolvido = r.total - (c.retido ?? 0);
      const falhas = [c.estoqueBling, c.pedidoBling, c.emailCliente].filter((e) => e?.erro).length;
      texto = `Pedido ${r.ref} cancelado. Estorno de ${formatarReais(devolvido)} enviado ao Mercado Pago${
        c.emailCliente?.feitoEm ? " e cliente avisado por e-mail" : ""
      }.${falhas ? ` ${falhas} etapa(s) falharam — veja abaixo e use "Refazer o que falhou".` : ""}`;
      ok = falhas === 0;
    } else {
      ok = false;
      texto = `Pedido ${r.ref} NÃO foi cancelado: o estorno no Mercado Pago falhou${c?.estornoMp?.erro ? ` (${c.estornoMp.erro})` : ""}. Nada foi devolvido.`;
    }
  } else if (aviso === "producao") {
    ok = Boolean(r.producao?.email?.feitoEm);
    texto = ok ? `Produção do pedido ${r.ref} registrada e cliente avisado.` : `Produção registrada, mas o e-mail ao cliente falhou.`;
  } else if (aviso === "etiqueta" && r.etiqueta) {
    const e = r.etiqueta;
    ok = !e.erro && Boolean(e.urlImpressao);
    texto = ok
      ? `Etiqueta do pedido ${r.ref} comprada (${e.transportadora} ${e.servico}${e.valor ? `, ${formatarReais(e.valor)}` : ""}). Clique em "Imprimir etiqueta".`
      : `Etiqueta do pedido ${r.ref} não concluída: ${e.erro ?? "falta imprimir"}.${
          e.idMe && !e.compradaEm ? " O frete ficou no carrinho do Melhor Envio — com saldo, clique em continuar." : ""
        }`;
  } else if (aviso === "rastreio" && r.etiqueta) {
    ok = !r.etiqueta.erro;
    texto = ok
      ? `Melhor Envio consultado: ${SITUACAO_ME[r.etiqueta.situacaoMe ?? ""] ?? r.etiqueta.situacaoMe ?? "sem novidade"}${r.envio ? " · cliente já avisado da postagem" : ""}.`
      : `Não consegui consultar o Melhor Envio: ${r.etiqueta.erro}`;
  } else if (aviso === "problema" && r.problemaEntrega) {
    texto = `Problema registrado no pedido ${r.ref}: ${rotuloProblema(r.problemaEntrega.tipo)}.`;
  } else if (aviso === "troca" && r.trocas?.length) {
    const t = r.trocas[r.trocas.length - 1];
    ok = Boolean(t.estoque?.feitoEm);
    texto = ok ? `Troca registrada: ${t.de.nome} → ${t.para.nome}, estoque ajustado no Bling.` : `Troca registrada, mas o estoque não foi ajustado: ${t.estoque?.erro}`;
  } else if (aviso === "troca-invalida") {
    ok = false;
    texto = "Troca não feita: escolha outra variação do mesmo produto.";
  } else if (aviso === "pronto" && r.prontoParaRetirada) {
    ok = Boolean(r.prontoParaRetirada.email?.feitoEm);
    texto = ok ? `Cliente avisado: pedido ${r.ref} pronto para retirada.` : "Aviso registrado, mas o e-mail ao cliente falhou.";
  } else if (aviso === "devolucao-criada" && r.devolucao) {
    ok = Boolean(r.devolucao.idNota) && !r.devolucao.erro;
    texto = ok
      ? `Nota de devolução criada no Bling (referencia ${r.devolucao.referencia}). Confira e clique em "2. Enviar à SEFAZ".`
      : `Nota de devolução não criada: ${r.devolucao.erro}`;
  } else if (aviso === "devolucao-enviada" && r.devolucao) {
    ok = Boolean(r.devolucao.enviadaEm) && !r.devolucao.erro;
    texto = ok ? `Nota de devolução enviada à SEFAZ${r.devolucao.numero ? ` (nº ${r.devolucao.numero})` : ""}.` : `Envio da nota de devolução falhou: ${r.devolucao.erro}`;
  } else if (aviso === "confirmar-devolucao") {
    ok = false;
    texto = 'Para enviar a nota de devolução à SEFAZ, marque "Conferi" — nota autorizada não se desfaz.';
  } else if (aviso === "postado" && r.envio) {
    ok = Boolean(r.envio.email?.feitoEm);
    texto = ok ? `Rastreio ${r.envio.codigo} enviado ao cliente.` : `Rastreio salvo, mas o e-mail ao cliente falhou.`;
  } else if (aviso === "concluido" && r.conclusao) {
    ok = Boolean(r.conclusao.email?.feitoEm);
    texto = `Pedido ${r.ref} ${r.conclusao.tipo === "retirado" ? "retirado" : "entregue"}${
      ok ? " — cliente recebeu o e-mail com a pesquisa." : " — o e-mail ao cliente falhou."
    }`;
  }
  if (!texto) return null;
  return (
    <p
      role="status"
      className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${ok ? "bg-kambada-amarelo text-kambada-grafite" : "border border-red-500 text-red-500"}`}
    >
      {ok ? "✓ " : "⚠ "}
      {texto}
    </p>
  );
}

const cancelado = (r: RegistroPedido) => Boolean(r.cancelamento?.concluidoEm || r.estorno);

/** Abas da lista: o que pede ação primeiro. */
const FILTROS: { id: string; rotulo: string; casa: (r: RegistroPedido) => boolean }[] = [
  { id: "abertos", rotulo: "Em aberto", casa: (r) => !cancelado(r) && !r.conclusao && !r.envio },
  { id: "postados", rotulo: "Postados", casa: (r) => !cancelado(r) && !r.conclusao && Boolean(r.envio) },
  { id: "concluidos", rotulo: "Entregues/retirados", casa: (r) => !cancelado(r) && Boolean(r.conclusao) },
  { id: "cancelamento", rotulo: "Cancelamentos", casa: (r) => cancelado(r) || Boolean(r.cancelamento?.solicitadoEm) },
  { id: "todos", rotulo: "Todos", casa: () => true },
];

const BOTAO = "rounded-full border border-borda px-4 py-1.5 text-sm font-semibold hover:border-kambada-amarelo-escuro";
const BOTAO_FORTE = "rounded-full bg-kambada-amarelo px-4 py-1.5 text-sm font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro";

export default async function PaginaAdminPedidos({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; filtro?: string; ref?: string }>;
}) {
  const { aviso, filtro = "abertos", ref: refDoAviso } = await searchParams;
  if (!adminConfigurado()) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Pedidos do site</h1>
        <p className="mt-4 text-texto-suave">
          A área de controle ainda não tem senha. No painel da Hostinger, crie a variável{" "}
          <code className="font-mono">ADMIN_SENHA</code> (mínimo 8 caracteres) e reimplante.
        </p>
      </section>
    );
  }

  if (!sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value)) {
    return (
      <section className="px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center font-display text-3xl font-extrabold">Pedidos do site</h1>
        <FormularioLogin />
      </section>
    );
  }

  const todos = await listarRegistros(200);
  const variacoes = await variacoesParaTroca(todos);
  const contagem = Object.fromEntries(FILTROS.map((f) => [f.id, todos.filter(f.casa).length]));
  const doFiltro = todos.filter((FILTROS.find((f) => f.id === filtro) ?? FILTROS[0]).casa);
  const linhas = await comSituacao(doFiltro);
  const total = todos.filter((r) => !cancelado(r)).reduce((s, r) => s + r.total, 0);
  const emailLigado = emailConfigurado();
  const notaLigada = process.env.BLING_EMITIR_NFE === "1";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuAdmin ativa="pedidos" />
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Pedidos do site</h1>
          <p className="mt-1 text-texto-suave">
            {todos.length} {todos.length === 1 ? "pedido" : "pedidos"} · {formatarReais(total)} pagos pelo site (sem os cancelados)
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-superficie px-4 py-3 text-sm text-texto-suave">
        Produção, postagem, entrega/retirada e cancelamento: aqui — o site atualiza o Bling e avisa o cliente.
        Etiqueta: no Melhor Envio. E-mails: <strong>{emailLigado ? "ligados" : "desligados"}</strong> · Nota fiscal
        automática: <strong>{notaLigada ? "ligada" : "desligada"}</strong>.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrar pedidos">
        {FILTROS.map((f) => (
          <a
            key={f.id}
            href={`/admin/pedidos?filtro=${f.id}`}
            aria-current={filtro === f.id ? "page" : undefined}
            className={filtro === f.id ? BOTAO_FORTE : BOTAO}
          >
            {f.rotulo} ({contagem[f.id]})
          </a>
        ))}
      </nav>

      <AvisoDaAcao aviso={aviso} r={todos.find((x) => x.ref === refDoAviso)} />

      {aviso === "confirmar-cancelamento" && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-500">
          Para cancelar, marque &quot;Confirmo&quot; — o estorno do dinheiro não se desfaz.
        </p>
      )}

      {aviso === "rastreio-invalido" && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-500">
          Código de rastreio inválido (só letras e números, de 8 a 30) ou transportadora não escolhida.
        </p>
      )}

      {linhas.length === 0 ? (
        <p className="mt-10 text-texto-suave">Nenhum pedido nesta aba.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {linhas.map(({ r, situacao }) => {
            const pendente =
              !r.estoque?.feitoEm ||
              (emailLigado && (!r.email?.feitoEm || !r.emailLoja?.feitoEm)) ||
              (notaLigada && (!r.nfe?.feitoEm || (emailLigado && !r.emailNota?.feitoEm)));
            return (
              <li key={r.ref} id={r.ref} className="scroll-mt-24 rounded-2xl border border-borda bg-superficie p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold">{r.ref}</p>
                    <p className="text-sm font-semibold text-[var(--destaque-texto)]">{etapaDoPedido(r)}</p>
                    <p className="text-sm text-texto-suave">
                      {dataLocal(r.criadoEm)} · {r.cliente.nome} · {r.cliente.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold">{formatarReais(r.total)}</p>
                    <p className="text-sm font-semibold">Bling: {situacao}</p>
                  </div>
                </div>

                <ul className="mt-3 text-sm">
                  {r.itens.map((i) => (
                    <li key={`${r.ref}-${i.id}`}>
                      {i.quantidade}× {i.nome} — {formatarReais(i.preco * i.quantidade)}
                    </li>
                  ))}
                  <li className={r.entrega.retirada ? "font-semibold" : "text-texto-suave"}>
                    {r.entrega.retirada
                      ? "RETIRADA NO ATELIÊ"
                      : `${r.entrega.descricao} — ${r.entrega.valor > 0 ? formatarReais(r.entrega.valor) : "frete grátis"}`}
                  </li>
                  {r.cupom && (
                    <li className="font-semibold">
                      Cupom {r.cupom.codigo} ({r.cupom.percentual}%) — −{formatarReais(r.cupom.desconto)}
                      {r.cupom.parceiro ? ` · parceiro ${r.cupom.parceiro}` : ""}
                    </li>
                  )}
                </ul>

                {r.cancelamento?.solicitadoEm && !cancelado(r) && (
                  <p className="mt-3 rounded-xl border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-600">
                    O cliente pediu cancelamento em {dataLocal(r.cancelamento.solicitadoEm)}
                    {r.cancelamento.motivo ? ` — "${r.cancelamento.motivo}"` : ""}. Aprovar: &quot;Cancelar e estornar&quot; abaixo.
                  </p>
                )}

                {r.cancelamento?.estornoMp && <BlocoCancelamento r={r} />}

                {r.estorno && !r.cancelamento?.estornoMp?.feitoEm && (
                  <p className="mt-3 rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-500">
                    Pagamento {rotuloEstorno(r.estorno.status)} em {dataLocal(r.estorno.detectadoEm)}. Cancelar no Bling,
                    devolver o estoque e ver a nota com o Glauco.{" "}
                    {r.estorno.avisoLoja?.feitoEm ? "(aviso enviado à loja)" : ""}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Selo nome="Estoque" etapa={r.estoque} />
                  <Selo nome="E-mail cliente" etapa={r.email} desligada={!emailLigado && !r.email} />
                  <Selo nome="Aviso loja" etapa={r.emailLoja} desligada={!emailLigado && !r.emailLoja} />
                  <Selo nome="Nota" etapa={r.nfe} desligada={!notaLigada && !r.nfe} />
                  <Selo nome="Nota por e-mail" etapa={r.emailNota} desligada={(!notaLigada || !emailLigado) && !r.emailNota} />
                  <a
                    href={`https://www.bling.com.br/vendas.php#edit/${r.bling.idPedido}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto rounded-full bg-kambada-amarelo px-4 py-1.5 text-sm font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
                  >
                    Abrir no Bling
                  </a>
                  {r.envio && (
                    <a
                      href={linkDeRastreio(r.envio.codigo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-kambada-grafite px-3 py-0.5 text-xs font-semibold text-kambada-amarelo"
                      title={r.envio.email?.erro ? `E-mail falhou: ${r.envio.email.erro}` : undefined}
                    >
                      Postado {dataLocal(r.envio.postadoEm)} · {r.envio.transportadora} {r.envio.codigo}
                      {r.envio.email?.feitoEm ? " · cliente avisado" : r.envio.email?.erro ? " · e-mail falhou" : ""}
                    </a>
                  )}
                  {pendente && (
                    <form action={refazerPendencias}>
                      <input type="hidden" name="pagamento" value={r.pagamentoId} />
                      <button type="submit" className="rounded-full border border-borda px-4 py-1.5 text-sm font-semibold hover:border-kambada-amarelo-escuro">
                        Refazer pendências
                      </button>
                    </form>
                  )}
                </div>

                {!cancelado(r) && <AcoesDoPedido r={r} />}
                {!cancelado(r) && <BlocoProblemaETroca r={r} variacoes={variacoes} />}

                {!r.entrega.retirada && !cancelado(r) && !r.conclusao && <BlocoEtiqueta r={r} />}

                {!r.entrega.retirada && !cancelado(r) && !r.conclusao && (
                  <form action={avisarPostagem} className="mt-3 flex flex-wrap items-center gap-2 border-t border-borda pt-3 text-sm">
                    <input type="hidden" name="ref" value={r.ref} />
                    <label className="font-semibold" htmlFor={`rastreio-${r.ref}`}>
                      {r.envio ? "Trocar rastreio:" : "Postou? Rastreio:"}
                    </label>
                    <input
                      id={`rastreio-${r.ref}`}
                      name="codigo"
                      required
                      placeholder="AA123456789BR"
                      className="w-44 rounded-lg border border-borda bg-fundo px-3 py-1.5 font-mono uppercase"
                    />
                    <select name="transportadora" required defaultValue={r.envio?.transportadora ?? "Correios"} className="rounded-lg border border-borda bg-fundo px-3 py-1.5">
                      {TRANSPORTADORAS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-full bg-kambada-amarelo px-4 py-1.5 font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
                      Avisar o cliente
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
