"use client";

/**
 * Alterna entre claro e escuro e guarda a escolha no navegador.
 * Sem escolha salva, o site segue a preferência do sistema.
 *
 * Não guarda estado em React de propósito: o tema vive no atributo
 * data-tema do <html>, e o CSS decide qual ícone e qual rótulo aparecem.
 * Assim não há renderização em cascata nem divergência de hidratação —
 * o servidor e o cliente produzem exatamente o mesmo HTML.
 */
export default function AlternadorTema() {
  function trocar() {
    const html = document.documentElement;
    const atual =
      html.dataset.tema ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "claro"
        : "escuro");
    const novo = atual === "claro" ? "escuro" : "claro";
    html.dataset.tema = novo;
    try {
      localStorage.setItem("kambada-tema", novo);
    } catch {
      // Armazenamento bloqueado: o tema vale só nesta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={trocar}
      className="rounded-full border border-borda p-2.5 text-texto-suave transition-colors hover:text-kambada-amarelo-escuro"
    >
      <span className="sr-only so-escuro">Mudar para o tema claro</span>
      <span className="sr-only so-claro">Mudar para o tema escuro</span>

      {/* Sol: aparece no tema escuro — clicar leva ao claro. */}
      <svg
        className="so-escuro"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>

      {/* Lua: aparece no tema claro — clicar leva ao escuro. */}
      <svg
        className="so-claro"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
