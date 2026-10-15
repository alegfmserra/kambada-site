import Image from "next/image";

type LogoKambadaProps = {
  className?: string;
};

/**
 * Logo oficial da Kambada (caranguejo + lettering), a mesma do cabeçalho da
 * loja. A versão amarela é a que vale sobre fundo escuro.
 */
export function LogoKambada({ className = "" }: LogoKambadaProps) {
  return (
    <Image
      src="/marca/kambada-logo-horizontal-amarelo.png"
      alt="Kambada"
      width={360}
      height={120}
      priority
      className={`h-auto w-44 md:w-56 ${className}`}
    />
  );
}
