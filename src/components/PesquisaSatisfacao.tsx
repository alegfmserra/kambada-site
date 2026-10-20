"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pesquisa de satisfação (20/10/2026).
 *
 * Quando aparece:
 *  - convite discreto depois de 3 páginas e 45 s de visita;
 *  - logo após uma ação concluída (compra, fim de jogo): qualquer parte do site
 *    dispara `pedirPesquisa("gatilho")`;
 *  - pelo link "Avalie o site" do rodapé (abre direto o formulário).
 * Nunca no carrinho/checkout em andamento, na área de controle nem no arraial 3D.
 * Respondeu → não aparece mais. "Agora não" → volta só em 21 dias.
 */

const CHAVE = "kambada-pesquisa";
const EVENTO = "kambada:pesquisa";
const ADIAR_DIAS = 21;

export function pedirPesquisa(gatilho: string, abrirDireto = false) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { gatilho, abrirDireto } }));
}

type Estado = { situacao: "respondida" | "adiada"; em: number } | null;

function lerEstado(): Estado {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Estado;
  } catch {
    return null;
  }
}
function gravarEstado(situacao: "respondida" | "adiada") {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ situacao, em: Date.now() }));
  } catch {
    /* navegador sem armazenamento: só não lembra */
  }
}
function podeConvidar(): boolean {
  const e = lerEstado();
  if (!e) return true;
  if (e.situacao === "respondida") return false;
  return Date.now() - e.em > ADIAR_DIAS * 86_400_000;
}

const FORA = [/^\/admin/, /^\/carrinho/, /^\/checkout(?!\/sucesso)/, /^\/kambadaplay\/arraial/];

const CURTIU = [
  ["loja", "Loja"],
  ["cultura", "Cultura"],
  ["play", "Kambada Play"],
  ["sobre", "Nossa história"],
  ["encomendas", "Encomendas"],
] as const;

export default function PesquisaSatisfacao() {
  const caminho = usePathname() ?? "/";
  const [fase, setFase] = useState<"oculta" | "convite" | "aberta" | "enviada">("oculta");
  const [gatilho, setGatilho] = useState("navegacao");
  const visitas = useRef(0);
  const inicio = useRef(0);

  const convidar = useCallback((g: string, abrirDireto: boolean) => {
    if (!abrirDireto && !podeConvidar()) return;
    setGatilho(g);
    setFase((f) => (f === "oculta" || abrirDireto ? (abrirDireto ? "aberta" : "convite") : f));
  }, []);

  // Pedido explícito (fim de jogo, rodapé…)
  useEffect(() => {
    function aoPedir(e: Event) {
      const d = (e as CustomEvent<{ gatilho: string; abrirDireto?: boolean }>).detail;
      convidar(d?.gatilho ?? "acao", Boolean(d?.abrirDireto));
    }
    window.addEventListener(EVENTO, aoPedir);
    return () => window.removeEventListener(EVENTO, aoPedir);
  }, [convidar]);

  // Navegação: 3 páginas + 45 s; compra concluída: na hora.
  useEffect(() => {
    if (FORA.some((r) => r.test(caminho))) return;
    if (caminho.startsWith("/checkout/sucesso")) {
      const t = setTimeout(() => convidar("compra", false), 4000);
      return () => clearTimeout(t);
    }
    if (!inicio.current) inicio.current = Date.now();
    visitas.current += 1;
    if (visitas.current < 3) return;
    const falta = Math.max(0, 45_000 - (Date.now() - inicio.current));
    const t = setTimeout(() => convidar("navegacao", false), falta);
    return () => clearTimeout(t);
  }, [caminho, convidar]);

  const fechar = useCallback(
    (adiar: boolean) => {
      if (adiar && fase !== "enviada") gravarEstado("adiada");
      setFase("oculta");
    },
    [fase],
  );

  useEffect(() => {
    if (fase !== "aberta" && fase !== "enviada") return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && fechar(true);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [fase, fechar]);

  if (fase === "oculta") return null;

  if (fase === "convite") {
    return (
      <div
        role="dialog"
        aria-label="Pesquisa de satisfação"
        className="fixed bottom-4 left-4 right-20 z-50 max-w-sm rounded-2xl border border-borda bg-fundo p-4 shadow-xl shadow-black/25 sm:bottom-5 sm:left-5"
      >
        <p className="font-display font-semibold">Topa 1 minuto pra avaliar o site?</p>
        <p className="mt-1 text-sm text-texto-suave">Sua opinião decide o que vem no site e no Kambada Play.</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setFase("aberta")}
            className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
          >
            Bora
          </button>
          <button type="button" onClick={() => fechar(true)} className="rounded-full px-4 py-2 text-sm text-texto-suave hover:bg-superficie">
            Agora não
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center" onClick={() => fechar(true)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pesquisa-titulo"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-borda bg-fundo p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        {fase === "enviada" ? (
          <div className="py-6 text-center">
            <p id="pesquisa-titulo" className="font-display text-2xl font-bold">Éguas, valeu!</p>
            <p className="mt-2 text-texto-suave">Resposta recebida. Ela vai direto pra nossa lista de melhorias.</p>
            <button
              type="button"
              autoFocus
              onClick={() => fechar(false)}
              className="mt-5 rounded-full bg-kambada-amarelo px-6 py-2.5 font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
            >
              Fechar
            </button>
          </div>
        ) : (
          <Formulario
            caminho={caminho}
            gatilho={gatilho}
            aoFechar={() => fechar(true)}
            aoEnviar={() => {
              gravarEstado("respondida");
              setFase("enviada");
            }}
          />
        )}
      </div>
    </div>
  );
}

function Opcoes({
  nome,
  valor,
  opcoes,
  aoMudar,
}: {
  nome: string;
  valor: string;
  opcoes: readonly (readonly [string, string])[];
  aoMudar: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {opcoes.map(([v, rotulo]) => (
        <label
          key={v}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-kambada-amarelo ${
            valor === v ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite" : "border-borda hover:border-kambada-amarelo-escuro"
          }`}
        >
          <input type="radio" name={nome} value={v} checked={valor === v} onChange={() => aoMudar(v)} className="sr-only" />
          {rotulo}
        </label>
      ))}
    </div>
  );
}

const campoTexto =
  "mt-2 w-full rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-tenue focus:border-kambada-amarelo focus:outline-none";

function Formulario({
  caminho,
  gatilho,
  aoFechar,
  aoEnviar,
}: {
  caminho: string;
  gatilho: string;
  aoFechar: () => void;
  aoEnviar: () => void;
}) {
  const [nota, setNota] = useState(0);
  const [funcionou, setFuncionou] = useState("");
  const [problema, setProblema] = useState("");
  const [curtiu, setCurtiu] = useState<string[]>([]);
  const [sugestao, setSugestao] = useState("");
  const [valorPlay, setValorPlay] = useState("");
  const [assinaria, setAssinaria] = useState("");
  const [origem, setOrigem] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch("/api/pesquisa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nota: nota || undefined,
          funcionou: funcionou || undefined,
          problema,
          curtiu,
          sugestao,
          valorPlay: valorPlay || undefined,
          assinaria: assinaria || undefined,
          origem: origem || undefined,
          comentario,
          pagina: caminho,
          gatilho,
          largura: window.innerWidth,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; mensagem?: string };
      if (r.ok || r.status === 429) aoEnviar();
      else setErro(d.mensagem ?? "Não deu para enviar. Tente de novo.");
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const rotulo = "block font-semibold text-sm";

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="pesquisa-titulo" className="font-display text-xl font-bold">Como foi sua visita?</h2>
          <p className="text-sm text-texto-suave">Anônima, 1 minuto. Responda só o que quiser.</p>
        </div>
        <button type="button" onClick={aoFechar} aria-label="Fechar pesquisa" className="rounded-full p-2 text-texto-suave hover:bg-superficie">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      <fieldset>
        <legend className={rotulo}>Nota para o site</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={nota === n}
              aria-label={`${n} de 5`}
              onClick={() => setNota(n)}
              className={`h-11 w-11 rounded-full border text-lg font-bold ${
                nota >= n ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite" : "border-borda text-texto-suave"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={rotulo}>Funcionou bem no seu aparelho?</legend>
        <Opcoes nome="funcionou" valor={funcionou} aoMudar={setFuncionou} opcoes={[["sim", "Sim"], ["com-problemas", "Teve problema"]]} />
        {funcionou === "com-problemas" && (
          <textarea
            value={problema}
            onChange={(e) => setProblema(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="O que travou ou ficou estranho?"
            aria-label="O que deu errado"
            className={campoTexto}
          />
        )}
      </fieldset>

      <fieldset>
        <legend className={rotulo}>O que você mais curtiu?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CURTIU.map(([v, r]) => {
            const marcado = curtiu.includes(v);
            return (
              <label
                key={v}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-kambada-amarelo ${
                  marcado ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite" : "border-borda hover:border-kambada-amarelo-escuro"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => setCurtiu((l) => (marcado ? l.filter((x) => x !== v) : [...l, v]))}
                  className="sr-only"
                />
                {r}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className={rotulo}>Que conteúdo você quer ver aqui?</span>
        <textarea
          value={sugestao}
          onChange={(e) => setSugestao(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Ex.: história de um sotaque, receita, peça nova…"
          className={campoTexto}
        />
      </label>

      <fieldset>
        <legend className={rotulo}>O Kambada Play tem valor pra você?</legend>
        <p className="text-xs text-texto-tenue">Jogos, histórias e animações da cultura maranhense.</p>
        <Opcoes
          nome="valorPlay"
          valor={valorPlay}
          aoMudar={setValorPlay}
          opcoes={[["muito", "Muito"], ["um-pouco", "Um pouco"], ["nao-conheco", "Ainda não conheço"], ["nao", "Não"]]}
        />
      </fieldset>

      <fieldset>
        <legend className={rotulo}>Assinaria para ter conteúdos exclusivos?</legend>
        <p className="text-xs text-texto-tenue">Chegam aos poucos. Grátis até 31/12/2026.</p>
        <Opcoes
          nome="assinaria"
          valor={assinaria}
          aoMudar={setAssinaria}
          opcoes={[["familia", "Sim, Família · R$ 9,90/mês"], ["brincante", "Sim, Brincante · R$ 19,90/mês"], ["talvez", "Talvez"], ["nao", "Não"]]}
        />
      </fieldset>

      <fieldset>
        <legend className={rotulo}>Como conheceu a Kambada?</legend>
        <Opcoes
          nome="origem"
          valor={origem}
          aoMudar={setOrigem}
          opcoes={[["instagram", "Instagram"], ["tiktok", "TikTok"], ["indicacao", "Indicação"], ["evento", "Evento/feira"], ["google", "Google"], ["outro", "Outro"]]}
        />
      </fieldset>

      <label className="block">
        <span className={rotulo}>Algo mais?</span>
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={500} rows={2} className={campoTexto} />
      </label>
      <p className="text-xs text-texto-tenue">Não coloque dados pessoais. Para falar com a gente, use o WhatsApp.</p>

      {erro && <p role="alert" className="text-sm text-red-500">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

/** Link do rodapé: abre a pesquisa direto, mesmo para quem já respondeu. */
export function BotaoAvaliarSite({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => pedirPesquisa("rodape", true)} className={className}>
      Avalie o site
    </button>
  );
}
