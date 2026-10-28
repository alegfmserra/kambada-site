"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { linkWhatsApp } from "@/lib/site";

/**
 * Monte sua matraca: tamanho, estampa e suporte, com as fotos reais da loja.
 * Não fixa preço nem prazo (isso é da loja); o fim é o WhatsApp com a escolha
 * pronta, ou a vitrine das matracas.
 */

type Tamanho = "Grande" | "Mini";

const ESTAMPAS = [
  { id: "bandeira", nome: "Bandeira do Maranhão", foto: "/fotos/matraca-bandeira-maranhao.webp", ficha: "As listras e a estrela da bandeira do Maranhão." },
  { id: "serpente", nome: "Serpente e Rei da Ilha", foto: "/fotos/matraca-serpente-rei-da-ilha.webp", ficha: "A lenda da Serpente que dorme sob São Luís." },
  { id: "boi-preto", nome: "Topo Boi Preto", foto: "/fotos/matraca-topo-boi-preto.webp", ficha: "O boi preto, de couro bordado de estrelas." },
  { id: "mosaico", nome: "Mosaico Colorido", foto: "/fotos/matraca-mosaico-colorido.webp", ficha: "Cores do arraial em mosaico, pintado à mão." },
  { id: "leque", nome: "Leque Bordado", foto: "/fotos/matraca-leque-bordado.webp", ficha: "O bordado do boi aberto em leque." },
  { id: "play", nome: "Kambada Play", foto: "/fotos/matraca-play.webp", ficha: "A matraca do projeto Kambada Play." },
] as const;

type Suporte = { id: string; nome: string; foto?: string };

const SUPORTES: Record<Tamanho, Suporte[]> = {
  Grande: [
    { id: "reto", nome: "Suporte reto", foto: "/fotos/suportes/grande-reto.jpg" },
    { id: "folhas", nome: "Suporte Folhas", foto: "/fotos/suportes/grande-folhas-colorido.jpg" },
    { id: "topo", nome: "Suporte Topo Boi Preto", foto: "/fotos/suportes/grande-topo-boi-preto.jpg" },
    { id: "sem", nome: "Sem suporte" },
  ],
  Mini: [
    { id: "reto", nome: "Suporte reto", foto: "/fotos/suportes/mini-reto.jpg" },
    { id: "sem", nome: "Sem suporte" },
  ],
};

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm font-bold text-texto transition-colors ${
        ativo ? "border-kambada-amarelo bg-kambada-amarelo/20" : "border-borda hover:border-kambada-amarelo"
      }`}
    >
      {children}
    </button>
  );
}

export function Matraca() {
  const [tamanho, setTamanho] = useState<Tamanho>("Grande");
  const [estampaId, setEstampaId] = useState<(typeof ESTAMPAS)[number]["id"]>("bandeira");
  const [suporteId, setSuporteId] = useState("reto");

  const estampa = ESTAMPAS.find((e) => e.id === estampaId) ?? ESTAMPAS[0];
  const suportes = SUPORTES[tamanho];
  const suporte = suportes.find((s) => s.id === suporteId) ?? suportes[0];

  function trocarTamanho(t: Tamanho) {
    setTamanho(t);
    // O suporte escolhido pode não existir no outro tamanho: volta ao reto.
    if (!SUPORTES[t].some((s) => s.id === suporteId)) setSuporteId("reto");
  }

  const resumo = `Matraca Kambada ${tamanho} · estampa ${estampa.nome} · ${suporte.nome.toLowerCase()}`;
  const mensagem = `Olá! Montei a minha matraca no Kambada Play e quero encomendar: ${resumo}. (origem: Kambada Play)`;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play · criar</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
        Monte a sua <span className="destaque">matraca</span>
      </h1>
      <p className="mt-2 text-texto-suave">Escolha o tamanho, a estampa e o suporte. Cada matraca é pintada à mão em São Luís.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-kambada-amarelo bg-kambada-grafite">
            <Image src={estampa.foto} alt={`Matraca com a estampa ${estampa.nome}`} fill sizes="(min-width: 768px) 28rem, 90vw" className="object-cover" priority />
            <span className="absolute left-3 top-3 rounded-full bg-kambada-amarelo px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-kambada-grafite">
              {estampa.nome}
            </span>
          </div>
          {suporte.foto ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-borda bg-superficie p-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md">
                <Image src={suporte.foto} alt={suporte.nome} fill sizes="4rem" className="object-cover" />
              </div>
              <p className="text-xs text-texto-suave">
                <strong className="text-texto">{suporte.nome}.</strong> A foto mostra uma peça real com este suporte, só para você ver como ele é; a sua vai com a estampa que escolheu.
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <fieldset>
            <legend className="text-sm font-bold text-texto">Tamanho</legend>
            <div className="mt-2 flex gap-3">
              {(["Grande", "Mini"] as const).map((t) => (
                <Opcao key={t} ativo={tamanho === t} onClick={() => trocarTamanho(t)}>
                  {t}
                </Opcao>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-texto">Estampa</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ESTAMPAS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEstampaId(e.id)}
                  aria-pressed={estampaId === e.id}
                  aria-label={e.nome}
                  className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 ${
                    estampaId === e.id ? "border-kambada-amarelo ring-2 ring-kambada-amarelo" : "border-borda hover:border-kambada-amarelo"
                  }`}
                >
                  <Image src={e.foto} alt="" fill sizes="7rem" className="object-cover" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-texto-suave">
              <strong className="text-texto">{estampa.nome}.</strong> {estampa.ficha}
            </p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold text-texto">Suporte</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {suportes.map((s) => (
                <Opcao key={s.id} ativo={suporte.id === s.id} onClick={() => setSuporteId(s.id)}>
                  {s.nome}
                </Opcao>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <section className="mt-8 rounded-2xl bg-kambada-amarelo p-6 text-kambada-grafite" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">A sua matraca</p>
        <p className="mt-1 font-display text-xl font-extrabold sm:text-2xl">{resumo}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={linkWhatsApp(mensagem)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-kambada-grafite px-8 py-3 font-bold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
          >
            Quero essa! Pedir pelo WhatsApp
          </a>
          <Link
            href="/loja/matracas"
            className="rounded-full border-2 border-kambada-grafite px-8 py-3 font-bold transition-colors hover:bg-kambada-grafite hover:text-kambada-amarelo"
          >
            Ver todas as matracas na loja
          </Link>
        </div>
        <p className="mt-3 text-xs">As fotos mostram a estampa; o tamanho e o suporte mudam a peça. A loja tem mais estampas além dessas, e preço e prazo você confere na hora do pedido.</p>
      </section>
    </div>
  );
}
