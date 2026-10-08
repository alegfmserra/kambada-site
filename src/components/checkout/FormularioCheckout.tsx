"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useCarrinho } from "@/components/carrinho/ProvedorCarrinho";
import { mensagemWhatsApp, mensagemWhatsAppPedido } from "@/lib/carrinho/logica";
import { formatarReais } from "@/lib/loja/dinheiro";
import { linkWhatsApp } from "@/lib/site";

type OpcaoFrete = {
  id: number;
  servico: string;
  transportadora: string;
  preco: number;
  precoOriginal: number;
  prazoDias: number;
  gratis: boolean;
};

type Campos = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const VAZIO: Campos = {
  nome: "", email: "", telefone: "", cpf: "", cep: "", logradouro: "",
  numero: "", complemento: "", bairro: "", cidade: "", uf: "",
};

/** Rascunho do formulário só nesta aba — some ao fechar. CPF nunca é salvo. */
const CHAVE_RASCUNHO = "kambada:checkout:rascunho";

function mascaraCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function FormularioCheckout({ pagamentoOnline }: { pagamentoOnline: boolean }) {
  const { itens, pronto, subtotal } = useCarrinho();
  const [campos, setCampos] = useState<Campos>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<keyof Campos, string>>>({});
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);
  const [freteId, setFreteId] = useState<number | null>(null);
  const [cotando, setCotando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [problemas, setProblemas] = useState<string[]>([]);
  const ultimoCepCotado = useRef<string>("");
  const ultimoCepBuscado = useRef<string>("");
  const refAviso = useRef<HTMLDivElement>(null);

  const pedido = useMemo(
    () => itens.map((i) => ({ idBling: i.idBling, quantidade: i.quantidade })),
    [itens],
  );
  const chaveCarrinho = JSON.stringify(pedido);

  // Restaura o rascunho (sem CPF) se o cliente recarregar a página.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_RASCUNHO);
      // Rascunho só existe no navegador; por isso é lido depois de montar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (salvo) setCampos((c) => ({ ...c, ...(JSON.parse(salvo) as Partial<Campos>), cpf: "" }));
    } catch {
      /* sem armazenamento: começa em branco */
    }
  }, []);

  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cpf, ...semCpf } = campos;
      sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(semCpf));
    } catch {
      /* sem armazenamento */
    }
  }, [campos]);

  function alterar(campo: keyof Campos, valor: string) {
    const mascarado =
      campo === "cep" ? mascaraCep(valor)
      : campo === "cpf" ? mascaraCpf(valor)
      : campo === "telefone" ? mascaraTelefone(valor)
      : campo === "uf" ? valor.toUpperCase().slice(0, 2)
      : valor;
    setCampos((c) => ({ ...c, [campo]: mascarado }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  // CEP completo: preenche o endereço e cota o frete.
  const cepDigitos = campos.cep.replace(/\D/g, "");
  useEffect(() => {
    if (cepDigitos.length !== 8 || pedido.length === 0) return;

    if (ultimoCepBuscado.current !== cepDigitos) {
      ultimoCepBuscado.current = cepDigitos;
      fetch(`https://viacep.com.br/ws/${cepDigitos}/json/`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean } | null) => {
          if (!d || d.erro) return;
          setCampos((c) => ({
            ...c,
            logradouro: c.logradouro || d.logradouro || "",
            bairro: c.bairro || d.bairro || "",
            cidade: d.localidade || c.cidade,
            uf: d.uf || c.uf,
          }));
        })
        .catch(() => {
          /* ViaCEP fora do ar: o cliente digita o endereço */
        });
    }

    const chave = `${cepDigitos}|${chaveCarrinho}`;
    if (ultimoCepCotado.current === chave) return;
    ultimoCepCotado.current = chave;

    setCotando(true);
    setOpcoes(null);
    setFreteId(null);
    setAviso(null);
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: cepDigitos, itens: pedido }),
    })
      .then(async (r) => {
        const d = (await r.json()) as { opcoes?: OpcaoFrete[]; erro?: string; problemas?: string[] };
        if (!r.ok) {
          setAviso(d.erro ?? "Não conseguimos calcular o frete.");
          setProblemas(d.problemas ?? []);
          return;
        }
        setOpcoes(d.opcoes ?? []);
        setFreteId(d.opcoes?.[0]?.id ?? null);
      })
      .catch(() => setAviso("Sem conexão para calcular o frete. Tente de novo."))
      .finally(() => setCotando(false));
  }, [cepDigitos, chaveCarrinho, pedido]);

  const freteEscolhido = opcoes?.find((o) => o.id === freteId) ?? null;
  const total = subtotal + (freteEscolhido?.preco ?? 0);
  const whatsapp = linkWhatsApp(mensagemWhatsApp(itens));

  async function aoPagar(e: FormEvent) {
    e.preventDefault();
    if (!freteEscolhido) {
      setAviso("Informe o CEP e escolha a entrega.");
      refAviso.current?.focus();
      return;
    }

    // Pagamento pelo site ainda não ligado: o pedido vai pronto para o
    // WhatsApp. Pede só o que a mensagem usa — o resto a conversa resolve.
    if (!pagamentoOnline) {
      if (campos.nome.trim().split(/\s+/).length < 2) {
        setErros((er) => ({ ...er, nome: "Informe nome e sobrenome." }));
        setAviso("Informe seu nome para enviarmos o pedido.");
        refAviso.current?.focus();
        return;
      }
      window.open(
        linkWhatsApp(
          mensagemWhatsAppPedido(
            itens,
            {
              descricao: `${freteEscolhido.transportadora} ${freteEscolhido.servico}`.trim(),
              preco: freteEscolhido.preco,
              prazoDias: freteEscolhido.prazoDias,
              gratis: freteEscolhido.gratis,
            },
            { nome: campos.nome.trim(), cep: campos.cep, cidade: campos.cidade, uf: campos.uf },
          ),
        ),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    setEnviando(true);
    setAviso(null);
    setProblemas([]);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: pedido, freteId, cliente: campos }),
      });
      const d = (await r.json()) as {
        url?: string;
        erro?: string;
        campos?: Partial<Record<keyof Campos, string>>;
        problemas?: string[];
        motivo?: string;
      };
      if (r.ok && d.url) {
        window.location.assign(d.url);
        return;
      }
      if (d.campos) setErros(d.campos);
      if (d.problemas) setProblemas(d.problemas);
      if (d.motivo === "frete_mudou") ultimoCepCotado.current = "";
      setAviso(d.erro ?? "Não foi possível continuar.");
    } catch {
      setAviso("Sem conexão. Tente de novo em instantes.");
    } finally {
      setEnviando(false);
      refAviso.current?.focus();
    }
  }

  if (!pronto) return <p className="text-texto-suave">Carregando…</p>;

  if (itens.length === 0) {
    return (
      <p>
        Seu carrinho está vazio.{" "}
        <Link href="/loja" className="font-semibold text-kambada-amarelo-escuro underline">
          Ver a loja
        </Link>
      </p>
    );
  }

  const campo = (
    nome: keyof Campos,
    rotulo: string,
    opcoesCampo: { tipo?: string; auto?: string; modo?: "numeric" | "email" | "tel" | "text"; largura?: string; obrigatorio?: boolean } = {},
  ) => (
    <div className={opcoesCampo.largura ?? "sm:col-span-2"}>
      <label htmlFor={`co-${nome}`} className="block text-sm font-semibold">
        {rotulo}
        {opcoesCampo.obrigatorio === false && <span className="font-normal text-texto-tenue"> (opcional)</span>}
      </label>
      <input
        id={`co-${nome}`}
        name={nome}
        type={opcoesCampo.tipo ?? "text"}
        inputMode={opcoesCampo.modo}
        autoComplete={opcoesCampo.auto}
        required={opcoesCampo.obrigatorio !== false}
        value={campos[nome]}
        onChange={(e) => alterar(nome, e.target.value)}
        aria-invalid={Boolean(erros[nome])}
        aria-describedby={erros[nome] ? `co-${nome}-erro` : undefined}
        className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 text-texto outline-none focus:border-kambada-amarelo-escuro aria-[invalid=true]:border-red-500"
      />
      {erros[nome] && (
        <p id={`co-${nome}-erro`} className="mt-1 text-sm text-red-500">
          {erros[nome]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={aoPagar} noValidate className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        {!pagamentoOnline && (
          <p className="rounded-xl bg-superficie px-4 py-3 text-sm text-texto-suave">
            O pagamento pelo site entra em breve. Por enquanto: informe seu nome e CEP, veja o frete,
            e o pedido vai pronto para o nosso WhatsApp — com a entrega e o total calculados.
          </p>
        )}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-xl font-bold">1. Seus dados</legend>
          {campo("nome", "Nome completo", { auto: "name" })}
          {pagamentoOnline && (
            <>
              {campo("email", "E-mail", { tipo: "email", auto: "email", modo: "email", largura: "" })}
              {campo("telefone", "Celular com DDD", { tipo: "tel", auto: "tel", modo: "tel", largura: "" })}
              {campo("cpf", "CPF (para a nota fiscal)", { modo: "numeric", largura: "" })}
            </>
          )}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 font-display text-xl font-bold">2. Entrega</legend>
          {campo("cep", "CEP", { auto: "postal-code", modo: "numeric", largura: "" })}
          <div className="hidden sm:block" />
          {pagamentoOnline && (
            <>
              {campo("logradouro", "Rua", { auto: "address-line1" })}
              {campo("numero", "Número", { largura: "" })}
              {campo("complemento", "Complemento", { auto: "address-line2", largura: "", obrigatorio: false })}
              {campo("bairro", "Bairro", { largura: "" })}
              {campo("cidade", "Cidade", { auto: "address-level2", largura: "" })}
              {campo("uf", "UF", { auto: "address-level1", largura: "" })}
            </>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-4 font-display text-xl font-bold">3. Forma de envio</legend>
          {cepDigitos.length !== 8 && <p className="text-sm text-texto-suave">Informe o CEP para ver as opções.</p>}
          {cotando && <p className="text-sm text-texto-suave" aria-live="polite">Calculando o frete…</p>}
          {opcoes && (
            <div className="space-y-2" role="radiogroup" aria-label="Opções de entrega">
              {opcoes.map((o) => (
                <label
                  key={o.id}
                  className={`flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                    freteId === o.id ? "border-kambada-amarelo-escuro bg-superficie" : "border-borda"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="frete"
                      value={o.id}
                      checked={freteId === o.id}
                      onChange={() => setFreteId(o.id)}
                      className="h-5 w-5 accent-kambada-amarelo-escuro"
                    />
                    <span>
                      <span className="font-semibold">
                        {o.transportadora} {o.servico}
                      </span>
                      <span className="block text-sm text-texto-suave">
                        até {o.prazoDias} {o.prazoDias === 1 ? "dia útil" : "dias úteis"} após a postagem
                      </span>
                    </span>
                  </span>
                  <span className="text-right font-display font-bold">
                    {o.gratis ? (
                      <>
                        <span className="text-kambada-amarelo-escuro">Grátis</span>
                        <span className="block text-xs font-normal text-texto-tenue line-through">
                          {formatarReais(o.precoOriginal)}
                        </span>
                      </>
                    ) : (
                      formatarReais(o.preco)
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <aside className="h-fit rounded-3xl border border-borda bg-superficie p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-bold">Seu pedido</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {itens.map((i) => (
            <li key={i.idBling} className="flex justify-between gap-3">
              <span>
                {i.quantidade}× {i.nome}
                {i.rotulo && i.rotulo !== "Único" ? ` (${i.rotulo})` : ""}
              </span>
              <span className="shrink-0">{formatarReais(i.preco * i.quantidade)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-borda pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Produtos</dt>
            <dd>{formatarReais(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frete</dt>
            <dd>{freteEscolhido ? (freteEscolhido.gratis ? "Grátis" : formatarReais(freteEscolhido.preco)) : "—"}</dd>
          </div>
          <div className="flex justify-between pt-2 font-display text-lg font-bold">
            <dt>Total</dt>
            <dd aria-live="polite">{formatarReais(total)}</dd>
          </div>
        </dl>

        <div ref={refAviso} tabIndex={-1} aria-live="assertive" className="outline-none">
          {aviso && <p className="mt-4 rounded-xl bg-fundo px-4 py-3 text-sm">{aviso}</p>}
          {problemas.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm text-texto-suave">
              {problemas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={enviando || cotando || !freteEscolhido}
          className="mt-6 w-full rounded-full bg-kambada-amarelo px-6 py-4 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!pagamentoOnline
            ? "Enviar pedido pelo WhatsApp"
            : enviando
              ? "Abrindo o pagamento…"
              : "Pagar com Mercado Pago"}
        </button>
        {pagamentoOnline ? (
          <>
            <p className="mt-3 text-center text-xs text-texto-tenue">
              Cartão em até 3x, Pix ou boleto. Você paga na página segura do Mercado Pago.
            </p>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-sm text-texto-suave underline hover:text-texto"
            >
              Prefere fechar pelo WhatsApp?
            </a>
          </>
        ) : (
          <p className="mt-3 text-center text-xs text-texto-tenue">
            A mensagem abre no WhatsApp com as peças, a entrega e o total. É só enviar.
          </p>
        )}
      </aside>
    </form>
  );
}
