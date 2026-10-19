/**
 * Menção de apoio exigida pelo Termo de Outorga FAPEMA (AUX-14854/25, cl. 5ª, 2, "l" e "m"):
 * citar o apoio da FAPEMA / Governo do Maranhão na divulgação do projeto e manter no site
 * um banner com link para o portal da FAPEMA.
 * TODO: trocar o selo em texto pelo banner/logos oficiais (FAPEMA + Governo do Maranhão + MARAinTech,
 * modelo na página da FAPEMA) quando os arquivos chegarem.
 */
export const URL_FAPEMA = "https://www.fapema.br";

export function ApoioFapema({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <a
        href={URL_FAPEMA}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-kambada-amarelo"
      >
        Kambada Play: projeto apoiado pela FAPEMA · Governo do Maranhão (MARAinTech)
      </a>
    );
  }
  return (
    <aside className="bg-kambada-preto px-4 py-6 text-center text-kambada-branco/80" aria-label="Apoio">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-kambada-amarelo">Projeto apoiado por</p>
      <a
        href={URL_FAPEMA}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block rounded-xl border border-kambada-branco/30 px-5 py-3 text-sm font-semibold hover:border-kambada-amarelo hover:text-kambada-amarelo"
      >
        FAPEMA · Fundação de Amparo à Pesquisa e ao Desenvolvimento Científico e Tecnológico do Maranhão
        <span className="block text-xs font-normal text-kambada-branco/60">
          Governo do Estado do Maranhão · Programa MARAinTech
        </span>
      </a>
      <p className="mx-auto mt-3 max-w-2xl text-xs text-kambada-branco/60">
        O Kambada Play foi contemplado no Edital FAPEMA nº 19/2025 (MARAinTech 2025), processo AUX-14854/25:
        &ldquo;Kambada Play: desenvolvimento de plataforma phygital e cadeia produtiva sustentável para o
        Souvenir 2.0 na economia criativa maranhense&rdquo;.
      </p>
    </aside>
  );
}
