/** Seletor dos elementos que participam do focus trap dos modais do arraial. */
const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Cicla o foco (Tab e Shift+Tab) dentro do container, sem deixar escapar pro
 * resto da página. Sem lib nova: calcula a lista de focáveis no próprio
 * keydown e faz o wrap manualmente do último pro primeiro e vice-versa.
 */
export function prenderFoco(e: KeyboardEvent, container: HTMLElement) {
  if (e.key !== "Tab") return;
  const focaveis = container.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS);
  if (focaveis.length === 0) {
    // Nada focável dentro do modal (ex.: Dialogo ainda nas falas, sem quiz
    // nem botão): ancora o foco no próprio container em vez de deixar o Tab
    // escapar pro resto da página.
    e.preventDefault();
    container.focus();
    return;
  }
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primeiro.focus();
  }
}
