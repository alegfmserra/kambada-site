import type { CenaConto } from "@/content/play/conto";
import { CamadaArte } from "./CamadaArte";
import { SertaoSerra, SertaoCasa, SertaoMato, SertaoLua } from "./arte/Sertao";
import { DesejoCasal, DesejoCozinha } from "./arte/Desejo";
import { BoiEstrela, BoiCurral } from "./arte/Boi";
import { MorteBoiCaido, MorteNuvens } from "./arte/Morte";
import { MilagrePaje, MilagreFumaca } from "./arte/Milagre";
import {
  FestaBrincantes,
  FestaFogueira,
  FestaSanfoneiro,
  FestaBandeirolas,
} from "./arte/Festa";

/** Cenas dramáticas que invertem o papel: noite ao fundo, traço claro. */
export const CENAS_INVERTIDAS = new Set(["morte", "milagre"]);

/**
 * Composição de camadas de cada cena, do fundo pro primeiro plano.
 * Tamanhos calibrados pro aspecto real dos PNGs do pacote (faixas 3:1 e 4:1
 * atravessam a página; peças 1:1 e 3:4 pontuam). Speeds abertos de propósito
 * (fundo ~0.7, primeiro plano ~1.3) e drift vertical próprio por camada.
 */
const camadasPorCena: Record<string, React.ReactNode> = {
  sertao: (
    <>
      <CamadaArte cena="sertao" arquivo="sertao-lua.png" speed={0.68} drift={-26} className="right-[4%] top-[4%] w-32 md:w-56">
        <SertaoLua />
      </CamadaArte>
      <CamadaArte cena="sertao" arquivo="sertao-serra.png" speed={0.82} drift={10} className="bottom-[10%] left-[-6%] w-[112%]">
        <SertaoSerra />
      </CamadaArte>
      <CamadaArte cena="sertao" arquivo="sertao-casa.png" speed={1.08} drift={8} className="bottom-[6%] left-[5%] w-36 md:w-64" imgClassName="anim-flutuar">
        <SertaoCasa className="anim-flutuar" />
      </CamadaArte>
      <CamadaArte cena="sertao" arquivo="sertao-mato.png" speed={1.32} drift={22} className="bottom-[-3%] left-[-4%] w-[108%]">
        <SertaoMato />
      </CamadaArte>
    </>
  ),
  desejo: (
    <>
      <CamadaArte cena="desejo" arquivo="desejo-cozinha.png" speed={0.74} drift={-14} className="left-[3%] top-[4%] w-40 md:w-80">
        <DesejoCozinha />
      </CamadaArte>
      <CamadaArte cena="desejo" arquivo="desejo-casal.png" speed={1.26} drift={16} className="bottom-[0%] right-[5%] w-44 md:w-72" imgClassName="anim-flutuar">
        <DesejoCasal className="anim-flutuar" />
      </CamadaArte>
    </>
  ),
  boi: (
    <>
      <CamadaArte cena="boi" arquivo="boi-curral.png" speed={0.76} drift={-12} className="bottom-[14%] left-[-6%] w-[112%]">
        <BoiCurral />
      </CamadaArte>
      <CamadaArte cena="boi" arquivo="boi-estrela.png" speed={1.24} drift={16} className="inset-x-0 bottom-[0%] mx-auto w-[72%] max-w-md md:max-w-lg" imgClassName="anim-flutuar">
        <BoiEstrela className="anim-flutuar" />
      </CamadaArte>
    </>
  ),
  morte: (
    <>
      <CamadaArte cena="morte" arquivo="morte-nuvens.png" speed={0.72} drift={-20} className="left-0 top-[2%] w-full" imgClassName="arte-noite">
        <MorteNuvens />
      </CamadaArte>
      <CamadaArte cena="morte" arquivo="morte-boi-caido.png" speed={1.22} drift={14} className="inset-x-0 bottom-[4%] mx-auto w-[76%] max-w-md" imgClassName="arte-noite">
        <MorteBoiCaido />
      </CamadaArte>
    </>
  ),
  milagre: (
    <>
      <CamadaArte cena="milagre" arquivo="milagre-fumaca.png" speed={0.74} drift={-24} className="right-[9%] top-0 w-28 md:w-48" imgClassName="arte-noite">
        <MilagreFumaca />
      </CamadaArte>
      <CamadaArte cena="milagre" arquivo="milagre-paje.png" speed={1.22} drift={14} className="bottom-[0%] left-[10%] w-40 md:w-60" imgClassName="arte-noite">
        <MilagrePaje />
      </CamadaArte>
    </>
  ),
  festa: (
    <>
      <CamadaArte cena="festa" arquivo="festa-bandeirolas.png" speed={0.68} drift={-16} className="left-[-4%] top-0 w-[108%]">
        <FestaBandeirolas />
      </CamadaArte>
      <CamadaArte cena="festa" arquivo="festa-sanfoneiro.png" speed={0.9} drift={8} className="bottom-[8%] right-[3%] w-36 md:w-60">
        <FestaSanfoneiro />
      </CamadaArte>
      <CamadaArte cena="festa" arquivo="festa-fogueira.png" speed={1.1} drift={12} className="bottom-[4%] left-[5%] w-28 md:w-48">
        <FestaFogueira />
      </CamadaArte>
      <CamadaArte cena="festa" arquivo="festa-brincantes.png" speed={1.34} drift={20} className="inset-x-0 bottom-[-3%] mx-auto w-[96%] max-w-2xl">
        <FestaBrincantes />
      </CamadaArte>
    </>
  ),
};

type CenaProps = {
  cena: CenaConto;
  /** Posição no folheto, capa é a página 1. */
  numero: number;
  /** Horizontal dentro da viagem pinada; vertical no modo reduced-motion. */
  modo: "horizontal" | "vertical";
};

/** Moldura de uma página do folheto: fundo, camadas de arte e a letra da toada. */
export function Cena({ cena, numero, modo }: CenaProps) {
  const invertida = CENAS_INVERTIDAS.has(cena.id);
  const horizontal = modo === "horizontal";
  return (
    <section
      data-painel
      id={`cena-${cena.id}`}
      aria-label={cena.titulo}
      className={`grain relative overflow-hidden ${
        invertida ? "noite dither" : "papel fibra-papel cena-papel-suave"
      } ${horizontal ? "h-full w-screen shrink-0" : "min-h-svh w-full"}`}
    >
      {/* Palco das camadas, o alto da página; a letra ocupa o pé */}
      <div
        data-palco
        className={`absolute inset-x-0 top-0 z-0 h-[40%] md:h-[48%] ${
          invertida ? "text-kambada-gold" : "text-kambada-ink"
        }`}
      >
        {camadasPorCena[cena.id]}
      </div>

      {/* Respaldo da leitura: scrim na cor da cena atrás da letra, pra arte
          em parallax (e a deriva vertical) nunca disputar com o texto */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[58%] md:h-[52%] ${
          invertida ? "scrim-noite" : "scrim-papel"
        }`}
      />

      {/* Luz da cena: véu que os beats assinatura escurecem (a morte segura
          um beat de silêncio). Fica invisível fora do beat. */}
      <div
        data-luz
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6] bg-black opacity-0"
      />

      {/* Letra da toada */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-16 pt-4">
        <div className={`w-full max-w-md md:max-w-3xl ${invertida ? "text-kambada-cream" : "text-kambada-ink"}`}>
          <p
            data-entrada
            className={`font-body text-[10px] font-semibold uppercase tracking-[0.3em] ${
              invertida ? "text-kambada-gold" : "text-kambada-ink/60"
            }`}
          >
            Página {numero}
          </p>
          <h2
            data-entrada
            className="display-cordel mt-2 text-3xl font-semibold leading-tight md:text-5xl"
          >
            {cena.titulo}
          </h2>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:gap-10">
            {cena.estrofes.map((estrofe, i) => (
              <p
                key={i}
                data-entrada
                className="whitespace-pre-line font-display text-base leading-relaxed opacity-90 md:text-lg"
              >
                {estrofe}
              </p>
            ))}
          </div>
          {cena.legenda ? (
            <p
              data-entrada
              className={`mt-4 font-body text-xs italic ${
                invertida ? "text-kambada-cream/60" : "text-kambada-ink/60"
              }`}
            >
              {cena.legenda}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
