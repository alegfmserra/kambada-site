"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { conto } from "@/content/play/conto";
import { Cena, CENAS_INVERTIDAS } from "./Cena";
import { CamadaArte } from "./CamadaArte";
import { BordaRasgada } from "./arte/BordaRasgada";
import { Estrela4 } from "./arte/Capa";
import { FechoMatracas } from "./arte/Fecho";

gsap.registerPlugin(ScrollTrigger);

/** Total de páginas do folheto: capa + cenas + fecho. */
const TOTAL_PAGINAS = conto.cenas.length + 2;

/** Fundo de cada página, na ordem do folheto, pra tingir o rasgo entre cenas. */
const fundos = [
  "papel",
  ...conto.cenas.map((c) => (CENAS_INVERTIDAS.has(c.id) ? "noite" : "papel-suave")),
  "noite",
];

/** Cor do rasgo por fundo da página anterior (a emenda herda o papel de trás). */
const tintaRasgo: Record<string, string> = {
  papel: "text-kambada-papel",
  "papel-suave": "tinta-papel-suave",
  noite: "text-kambada-noite",
};

/**
 * Capa do folheto, composta como capa de cordel de banca: a folha em pé com
 * moldura xilogravada, um kicker só, o boi bordado dominando o centro e o
 * colofão na base da moldura.
 */
function Capa({ modo }: { modo: "horizontal" | "vertical" }) {
  return (
    <section
      data-painel
      id="conto-capa"
      aria-label={conto.capa.titulo}
      className={`papel fibra-papel grain relative flex items-center justify-center overflow-hidden px-4 py-5 text-center text-kambada-ink ${
        modo === "horizontal" ? "h-full w-screen shrink-0" : "min-h-svh w-full"
      }`}
    >
      {/* A folha: 3:4 como o PNG da moldura; a altura cede quando a largura
          do viewport não comporta o aspecto (mobile estreito) */}
      <div className="relative h-[min(94%,calc((100vw-2rem)*4/3))] max-h-full shrink-0 [aspect-ratio:3/4]">
        <span
          data-entrada-splash
          style={{ "--ordem": 0 } as CSSProperties}
          className="absolute inset-0 block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kambadaplay/images/conto/capa-moldura.png"
            alt=""
            className="h-full w-full"
            draggable={false}
            aria-hidden
          />
        </span>
        {/* O recuo acompanha a espessura real da borda xilogravada da moldura
            (faixa + flores de canto), pra nenhum texto invadir o ornamento */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-[16%] pt-[15%] pb-[19%]">
          <p
            data-entrada-splash
            style={{ "--ordem": 1 } as CSSProperties}
            className="max-w-[58%] md:max-w-[70%] font-body text-[10px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-kambada-red md:text-[11px]"
          >
            {conto.capa.kicker}
          </p>
          <h1
            data-entrada-splash
            style={{ "--ordem": 2 } as CSSProperties}
            className="display-cordel mt-1 text-3xl font-black leading-[0.95] sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {conto.capa.titulo}
          </h1>
          <span
            data-entrada-splash
            style={{ "--ordem": 1 } as CSSProperties}
            className="block w-[62%] max-w-[300px]"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kambadaplay/images/conto/boi-estrela.png"
              alt=""
              className="w-full"
              draggable={false}
            />
          </span>
          <p className="max-w-[26ch] font-body text-xs text-kambada-ink/75 md:text-sm">
            {conto.capa.subtitulo}
          </p>
          <div className="flex items-center gap-3 text-kambada-ink/60" aria-hidden>
            <span className="h-px w-8 bg-kambada-ink/40" />
            <span className="font-body text-[10px] uppercase tracking-[0.25em]">role pra ler</span>
            <span className="h-px w-8 bg-kambada-ink/40" />
          </div>
          <p className="max-w-[58%] md:max-w-[70%] font-body text-[9px] font-semibold uppercase leading-relaxed tracking-[0.28em] text-kambada-ink/55 md:text-[10px]">
            {conto.capa.colofao}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Última página: o arremate da história e os caminhos de saída. */
function Fecho({ modo }: { modo: "horizontal" | "vertical" }) {
  return (
    <section
      data-painel
      id="conto-fecho"
      aria-label={conto.fecho.titulo}
      className={`noite dither grain relative flex flex-col items-center justify-center overflow-hidden px-8 text-center text-kambada-cream ${
        modo === "horizontal" ? "h-full w-screen shrink-0" : "min-h-svh w-full"
      }`}
    >
      <CamadaArte
        cena="fecho"
        arquivo="fecho-matracas.png"
        speed={1.12}
        drift={-10}
        className="inset-x-0 top-[8%] mx-auto w-44 text-kambada-gold md:w-60"
        imgClassName="arte-noite anim-flutuar"
      >
        <FechoMatracas className="anim-flutuar h-full w-full" />
      </CamadaArte>
      <h2
        data-entrada
        className="mt-40 font-display text-4xl font-black leading-tight md:mt-48 md:text-6xl"
      >
        {conto.fecho.titulo}
      </h2>
      <p
        data-entrada
        className="mx-auto mt-5 max-w-[38ch] whitespace-pre-line font-body text-sm leading-relaxed text-kambada-cream/80 md:text-base"
      >
        {conto.fecho.texto}
      </p>
      <div data-entrada className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/kambadaplay/matraca"
          className="toque-matraca inline-block rounded-full bg-kambada-gold px-9 py-3.5 font-body text-base font-bold text-kambada-ink shadow-lg shadow-black/30"
        >
          {conto.fecho.ctaMatraca}
        </Link>
        <Link
          href="/kambadaplay/arraial"
          className="toque-matraca inline-block rounded-full border-2 border-kambada-cream/50 px-9 py-3 font-body text-base font-bold text-kambada-cream"
        >
          {conto.fecho.ctaArraial}
        </Link>
      </div>
    </section>
  );
}

/**
 * A viagem do folheto: scroll vertical vira deslocamento horizontal pinado,
 * com parallax por camada (data-speed), beats assinatura por cena e estrela
 * de progresso no cordão com marcos por página.
 * Setas esquerda/direita viram páginas; foco em link fora de vista puxa o
 * scroll pro enquadramento certo.
 * Com prefers-reduced-motion as páginas empilham na vertical, sem pin.
 */
export function ContoScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cordaoRef = useRef<HTMLDivElement>(null);
  const estrelaRef = useRef<HTMLDivElement>(null);
  const penumbraRef = useRef<HTMLDivElement>(null);
  const [reduzido, setReduzido] = useState(false);
  const [pagina, setPagina] = useState(1);
  const paginaRef = useRef(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única de matchMedia no mount, decide se o resto do efeito monta o pin do GSAP
      setReduzido(true);
      return;
    }
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    const cordao = cordaoRef.current;
    const estrela = estrelaRef.current;
    if (!wrapper || !track || !cordao || !estrela) return;

    const distancia = () => track.scrollWidth - window.innerWidth;

    // Ritmo da leitura: cada página do folheto vale ~170vh de rolagem
    // (feedback do Rafael: a viagem estava rápida demais pra ler as cenas).
    // O x do trilho continua indo até -distancia(); só a régua de scroll estica.
    const ROLAGEM_POR_PAINEL = 1.7;
    const paineis = Array.from(track.querySelectorAll<HTMLElement>("[data-painel]"));
    const rolagemTotal = () => paineis.length * window.innerHeight * ROLAGEM_POR_PAINEL;

    // Parallax: cada camada ganha um deslocamento proporcional à distância do
    // seu painel até a borda esquerda da tela; speed < 1 fica pra trás,
    // speed > 1 vem pra frente, criando a profundidade de teatro de papel.
    // data-drift soma uma deriva vertical sutil (px por viewport de percurso):
    // a camada entra deslocada, assenta no enquadramento e sai pro outro lado.
    const camadas = Array.from(track.querySelectorAll<HTMLElement>("[data-speed]")).map((el) => ({
      painel: el.closest<HTMLElement>("[data-painel]"),
      left: 0,
      fator: 1 - Number(el.dataset.speed ?? 1),
      drift: Number(el.dataset.drift ?? 0),
      set: gsap.quickSetter(el, "x", "px") as (v: number) => void,
      setY: gsap.quickSetter(el, "y", "px") as (v: number) => void,
    }));
    const setEstrela = gsap.quickSetter(estrela, "x", "px") as (v: number) => void;

    // Distância de cada painel até o início do trilho, imune ao translate atual
    let percurso = distancia();
    let passos = paineis.length - 1;
    let larguraTela = window.innerWidth;
    const medir = () => {
      percurso = distancia();
      passos = paineis.length - 1;
      larguraTela = window.innerWidth;
      const inicio = track.getBoundingClientRect().left;
      for (const camada of camadas) {
        camada.left = (camada.painel?.getBoundingClientRect().left ?? inicio) - inicio;
      }
    };
    medir();

    // Roda a cada frame do tween (o scrub segue animando depois do scroll parar),
    // então parallax, estrela e contador acompanham o x real do trilho.
    const atualizar = () => {
      const x = gsap.getProperty(track, "x") as number;
      for (const camada of camadas) {
        const desloc = camada.left + x;
        camada.set(desloc * camada.fator);
        // Deriva vertical: zero quando a página enquadra, +-drift nas bordas
        if (camada.drift !== 0) {
          camada.setY((desloc / larguraTela) * camada.drift);
        }
      }
      // Ímã sutil da estrela: perto do enquadramento exato de uma página o
      // marcador assenta no marco (zona de 15% da página, atração progressiva).
      // Só a estrela é atraída; o scroll segue livre, sem brigar com o scrub.
      let progresso = percurso > 0 ? -x / percurso : 0;
      if (passos > 0) {
        const alvo = Math.round(progresso * passos) / passos;
        const desvio = alvo - progresso;
        const zona = 0.15 / passos;
        if (Math.abs(desvio) < zona) {
          progresso += desvio * (1 - Math.abs(desvio) / zona);
        }
      }
      setEstrela(progresso * (cordao.clientWidth - 20));

      // Contador acessível "Página N de 8", atualizado só na virada
      const pag = passos > 0 ? Math.min(passos, Math.max(0, Math.round(progresso * passos))) + 1 : 1;
      if (pag !== paginaRef.current) {
        paginaRef.current = pag;
        setPagina(pag);
      }
    };

    const tween = gsap.to(track, {
      x: () => -distancia(),
      ease: "none",
      onUpdate: atualizar,
      scrollTrigger: {
        trigger: wrapper,
        pin: true,
        // Scrub mais macio: o trilho assenta com calma depois que o dedo para
        scrub: 1.1,
        end: () => `+=${rolagemTotal()}`,
        invalidateOnRefresh: true,
        onRefresh: () => {
          medir();
          atualizar();
        },
      },
    });

    // Entradas de texto por cena: título e estrofes chegam em cascata do lado
    // pra onde a viagem vai (a direita), quando a página se aproxima do centro.
    // Toca uma vez ao entrar e reverte ao voltar; interrompível nos dois sentidos.
    // Fonte única de timing: os tokens --conto-entrada-* de globals.css
    // (550ms, stagger 120ms; cascata de 4 alvos fecha em ~1s), easing power2.out.
    const raiz = getComputedStyle(document.documentElement);
    const entradaDur = (parseFloat(raiz.getPropertyValue("--conto-entrada-dur")) || 550) / 1000;
    const entradaStagger = (parseFloat(raiz.getPropertyValue("--conto-entrada-stagger")) || 100) / 1000;
    const entradas: { gatilho: ScrollTrigger; tl: gsap.core.Timeline }[] = [];
    for (const painel of paineis) {
      const alvos = painel.querySelectorAll<HTMLElement>("[data-entrada]");
      if (!alvos.length) continue;
      const tl = gsap.timeline({ paused: true });
      // from() anima até o valor atual de cada alvo (preserva opacity-90 das estrofes)
      tl.from(alvos, {
        opacity: 0,
        x: 48,
        duration: entradaDur,
        ease: "power2.out",
        stagger: entradaStagger,
      });
      const gatilho = ScrollTrigger.create({
        trigger: painel,
        containerAnimation: tween,
        start: "left 82%",
        onEnter: () => tl.play(),
        onLeaveBack: () => tl.reverse(),
      });
      entradas.push({ gatilho, tl });
    }

    // Beat dramático das cenas invertidas (morte, milagre): a penumbra escurece
    // a emenda com leve antecipação e o traço claro do palco acende junto com
    // a chegada da página. Atrelado ao scrub (containerAnimation), só transform
    // free: opacity nos dois nós, nada de reflow.
    // Token: motion/conto/beat-virada — scrub, ease none (honesto com o dedo).
    const beats: gsap.core.Timeline[] = [];
    const penumbra = penumbraRef.current;
    if (penumbra) {
      for (const id of CENAS_INVERTIDAS) {
        const painel = track.querySelector<HTMLElement>(`#cena-${id}`);
        const palco = painel?.querySelector<HTMLElement>("[data-palco]");
        if (!painel || !palco) continue;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: painel,
            containerAnimation: tween,
            start: "left 95%",
            end: "left 10%",
            scrub: true,
          },
        });
        tl.fromTo(penumbra, { opacity: 0 }, { opacity: 0.45, duration: 0.4, ease: "none" }, 0)
          .to(penumbra, { opacity: 0, duration: 0.6, ease: "none" }, 0.4)
          .fromTo(
            palco,
            { opacity: 0.2 },
            // immediateRender: inicializa com a cena ainda fora da tela, sem pop
            { opacity: 1, duration: 0.55, ease: "none", immediateRender: true },
            0.35
          );
        beats.push(tl);
      }
    }

    // Beats assinatura: um micro-momento próprio por cena, no scrub via
    // containerAnimation. Os alvos são os wrappers internos [data-arte];
    // o transform do nó externo pertence ao quickSetter de parallax.
    // Token: motion/conto/beat-assinatura — scrub, ease none, só transform/opacity.
    const criarBeat = (
      id: string,
      montar: (tl: gsap.core.Timeline, artes: HTMLElement[], painel: HTMLElement) => void,
      start: string,
      end: string
    ) => {
      const painel = track.querySelector<HTMLElement>(`#cena-${id}`);
      if (!painel) return;
      const artes = Array.from(painel.querySelectorAll<HTMLElement>("[data-arte]"));
      const tl = gsap.timeline({
        scrollTrigger: { trigger: painel, containerAnimation: tween, start, end, scrub: true },
      });
      montar(tl, artes, painel);
      beats.push(tl);
    };

    // MORTE: a página segura um beat de silêncio. O boi assenta no chão,
    // as nuvens se afastam devagar e a luz cai antes de voltar.
    criarBeat(
      "morte",
      (tl, [nuvens, boi], painel) => {
        const luz = painel.querySelector<HTMLElement>("[data-luz]");
        if (luz) {
          tl.fromTo(luz, { opacity: 0 }, { opacity: 0.34, duration: 0.3, ease: "none" }, 0.25)
            .to(luz, { opacity: 0, duration: 0.3, ease: "none" }, 0.7);
        }
        if (boi) tl.fromTo(boi, { y: 10, scale: 1.02 }, { y: 0, scale: 1, duration: 0.4, ease: "none" }, 0);
        if (nuvens) tl.fromTo(nuvens, { y: 0 }, { y: -14, duration: 1, ease: "none" }, 0);
      },
      "left 75%",
      "left 5%"
    );

    // MILAGRE: o clímax em dois movimentos. O pajé estremece no toque da
    // matraca e sobe com a reza; a fumaça (fundo) desce em counter-motion.
    criarBeat(
      "milagre",
      (tl, [fumaca, paje]) => {
        if (paje) {
          tl.to(paje, { keyframes: { x: [0, -5, 5, -3, 3, 0] }, duration: 0.32, ease: "none" }, 0.08)
            .fromTo(paje, { y: 0, scale: 1 }, { y: -16, scale: 1.05, duration: 0.34, ease: "none" }, 0.46)
            .to(paje, { y: -10, scale: 1.03, duration: 0.18, ease: "none" }, 0.82);
        }
        if (fumaca) tl.to(fumaca, { y: 12, duration: 0.34, ease: "none" }, 0.46);
      },
      "left 70%",
      "left 0%"
    );

    // FESTA: a roda ganha um surto de giro (o cortejo avança e pulsa),
    // as bandeirolas balançam mais forte e o sanfoneiro marca o compasso.
    criarBeat(
      "festa",
      (tl, [bandeirolas, sanfoneiro, , brincantes]) => {
        if (brincantes) {
          tl.fromTo(brincantes, { x: 24 }, { x: -24, duration: 1, ease: "none" }, 0)
            .to(brincantes, { keyframes: { scale: [1, 1.05, 1] }, duration: 0.3, ease: "none" }, 0.35);
        }
        if (bandeirolas) {
          tl.to(
            bandeirolas,
            { keyframes: { rotation: [0, 2.2, -1.6, 1.2, 0] }, transformOrigin: "50% 0%", duration: 0.8, ease: "none" },
            0.1
          );
        }
        if (sanfoneiro) {
          tl.to(sanfoneiro, { keyframes: { y: [0, -8, 0, -5, 0] }, duration: 0.6, ease: "none" }, 0.3);
        }
      },
      "left 70%",
      "left 0%"
    );

    // Vira-página: setas esquerda/direita pulam pro enquadramento da página
    // vizinha; o scrub segue dono do movimento (só mudamos o scroll alvo).
    const irParaPagina = (indice: number) => {
      const st = tween.scrollTrigger;
      if (!st || passos <= 0) return;
      const alvo = Math.min(passos, Math.max(0, indice));
      window.scrollTo({ top: st.start + (st.end - st.start) * (alvo / passos), behavior: "smooth" });
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const st = tween.scrollTrigger;
      if (!st) return;
      // Só age com a viagem em cena
      if (window.scrollY < st.start - window.innerHeight || window.scrollY > st.end + window.innerHeight) return;
      e.preventDefault();
      const atual = Math.round(st.progress * passos);
      irParaPagina(atual + (e.key === "ArrowRight" ? 1 : -1));
    };
    // Foco fora de vista (Tab até os links do fecho): o navegador não consegue
    // trazer um painel deslocado por transform; sincronizamos o scroll na hora.
    const aoFocar = (e: FocusEvent) => {
      const alvoEl = e.target as HTMLElement | null;
      const painel = alvoEl?.closest<HTMLElement>("[data-painel]");
      if (!painel) return;
      const indice = paineis.indexOf(painel);
      const st = tween.scrollTrigger;
      if (indice < 0 || !st || passos <= 0) return;
      const destino = st.start + (st.end - st.start) * (indice / passos);
      if (Math.abs(window.scrollY - destino) > window.innerHeight * 0.4) {
        window.scrollTo({ top: destino });
      }
    };
    window.addEventListener("keydown", aoTeclar);
    track.addEventListener("focusin", aoFocar);

    return () => {
      window.removeEventListener("keydown", aoTeclar);
      track.removeEventListener("focusin", aoFocar);
      for (const { gatilho, tl } of entradas) {
        gatilho.kill();
        tl.kill();
      }
      for (const tl of beats) {
        tl.scrollTrigger?.kill();
        tl.kill();
      }
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  const modo = reduzido ? "vertical" : "horizontal";

  return (
    <div ref={wrapperRef} data-conto-viagem className={reduzido ? "" : "relative h-svh overflow-hidden"}>
      <div
        ref={trackRef}
        data-conto-track
        className={reduzido ? "flex flex-col" : "flex h-full w-max flex-row"}
      >
        <Capa modo={modo} />
        {conto.cenas.map((cena, i) => (
          <div key={cena.id} className={reduzido ? "relative" : "relative h-full shrink-0"}>
            <Cena cena={cena} numero={i + 2} modo={modo} />
            {/* Rasgo de papel na emenda, tingido com o fundo da página anterior */}
            {!reduzido ? (
              <BordaRasgada
                variante={(i % 3) as 0 | 1 | 2}
                className={`absolute left-0 top-0 z-20 h-full w-6 -scale-x-100 ${tintaRasgo[fundos[i]]}`}
              />
            ) : null}
          </div>
        ))}
        <div className={reduzido ? "relative" : "relative h-full shrink-0"}>
          <Fecho modo={modo} />
          {!reduzido ? (
            <BordaRasgada
              variante={(conto.cenas.length % 3) as 0 | 1 | 2}
              className={`absolute left-0 top-0 z-20 h-full w-6 -scale-x-100 ${
                tintaRasgo[fundos[fundos.length - 2]]
              }`}
            />
          ) : null}
        </div>
      </div>

      {/* Penumbra do beat dramático: escurece a emenda antes das cenas invertidas */}
      {!reduzido ? (
        <div
          ref={penumbraRef}
          data-conto-penumbra
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[25] bg-black opacity-0"
        />
      ) : null}

      {/* Cordão de progresso: marcos por página e a estrela viajante.
          O contador com aria-live é o equivalente acessível do cordão. */}
      {!reduzido ? (
        <>
          <div
            ref={cordaoRef}
            data-conto-cordao
            aria-hidden
            className="absolute inset-x-8 bottom-5 z-30 h-px bg-kambada-red/60"
          >
            {Array.from({ length: TOTAL_PAGINAS }).map((_, i) => (
              <span
                key={i}
                className="absolute -top-[2.5px] h-1.5 w-1.5 rounded-full bg-kambada-red/80"
                style={{ left: `calc((100% - 20px) * ${i / (TOTAL_PAGINAS - 1)} + 7px)` }}
              />
            ))}
            <div ref={estrelaRef} className="absolute -top-2.5 left-0 h-5 w-5 text-kambada-red">
              <Estrela4 className="h-full w-full drop-shadow" />
            </div>
          </div>
          <p
            aria-live="polite"
            className="contador-pagina absolute bottom-9 right-8 z-30 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-kambada-cream"
          >
            Página {pagina} de {TOTAL_PAGINAS}
          </p>
        </>
      ) : null}
    </div>
  );
}
