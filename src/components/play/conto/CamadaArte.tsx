import { disponiveis } from "./arte/disponiveis";

type CamadaArteProps = {
  /** Id da cena, só pra rastrear a origem do asset. */
  cena: string;
  /** Nome do PNG em public/images/conto/, chave do mapa de disponíveis. */
  arquivo: string;
  /** Velocidade de parallax: 1 acompanha a cena, menor fica pra trás, maior vem pra frente. */
  speed?: number;
  /**
   * Deriva vertical sutil em px por viewport de percurso: a camada entra
   * deslocada, assenta em zero quando a página enquadra e sai pro lado oposto.
   * Positivo = entra por baixo; negativo = entra por cima.
   */
  drift?: number;
  className?: string;
  /**
   * Classes só do PNG: loops ambientes (anim-flutuar etc.) e o filtro
   * arte-noite das cenas invertidas. O fallback SVG carrega as próprias.
   */
  imgClassName?: string;
  /** Fallback SVG autoral usado quando o PNG está desligado no mapa. */
  children: React.ReactNode;
};

/**
 * Camada do teatro de papel. O ContoScroll lê o data-speed e desloca cada
 * camada em taxas diferentes durante a viagem horizontal. O wrapper interno
 * [data-arte] é o alvo dos beats assinatura: o transform do nó externo
 * pertence ao quickSetter de parallax e não pode ser disputado.
 */
export function CamadaArte({
  cena,
  arquivo,
  speed = 1,
  drift = 0,
  className = "",
  imgClassName = "",
  children,
}: CamadaArteProps) {
  const temPng = disponiveis[arquivo] === true;
  return (
    <div
      data-speed={speed}
      data-drift={drift !== 0 ? drift : undefined}
      data-cena={cena}
      className={`pointer-events-none absolute will-change-transform ${className}`}
      aria-hidden
    >
      <div data-arte className="w-full">
        {temPng ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/kambadaplay/images/conto/${arquivo}`}
            alt=""
            className={`w-full ${imgClassName}`}
            draggable={false}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
