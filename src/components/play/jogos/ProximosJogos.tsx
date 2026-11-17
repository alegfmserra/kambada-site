import Image from "next/image";
import Link from "next/link";

export type JogoDaLista = "quiz" | "memoria" | "quebra" | "palavra" | "arraial" | "cordel";

const LISTA: { id: JogoDaLista; href: string; titulo: string; acao: string; imagem: string }[] = [
  { id: "quiz", href: "/kambadaplay/jogos/quiz", titulo: "Éguas! Quem é quem?", acao: "Jogar o quiz", imagem: "/kambadaplay/images/atelie/placa-coreiro.webp" },
  { id: "memoria", href: "/kambadaplay/jogos/memoria", titulo: "Memória das estampas", acao: "Jogar a memória", imagem: "/kambadaplay/jogos/memoria/camisa-boi-maranhense.webp" },
  { id: "quebra", href: "/kambadaplay/jogos/quebra", titulo: "Quebra-cabeça das estampas", acao: "Montar uma arte", imagem: "/kambadaplay/jogos/memoria/camisa-alusiva-sao-luis.webp" },
  { id: "palavra", href: "/kambadaplay/jogos/palavra", titulo: "Palavra do dia maranhense", acao: "Jogar a palavra do dia", imagem: "/kambadaplay/images/atelie/placa-coreira.webp" },
  { id: "arraial", href: "/kambadaplay/arraial", titulo: "Arraial da Kambada", acao: "Entrar no arraial", imagem: "/kambadaplay/images/arraial/poster.webp" },
  { id: "cordel", href: "/kambadaplay/conto", titulo: "O Auto do Boi", acao: "Ler o cordel", imagem: "/kambadaplay/images/boi-de-matraca.webp" },
];

/** Os próximos da fila depois de `atual` (a lista dá a volta), pulando os de `fora`. */
export function proximosDe(atual: JogoDaLista, quantos = 2, fora: JogoDaLista[] = []): typeof LISTA {
  const i = LISTA.findIndex((j) => j.id === atual);
  const fila = [...LISTA.slice(i + 1), ...LISTA.slice(0, Math.max(i, 0))];
  return fila.filter((j) => j.id !== atual && !fora.includes(j.id)).slice(0, quantos);
}

/**
 * Fim de partida: dois cartões grandes com o que jogar em seguida, para a
 * criança não ficar parada na tela de pontos. `escuro` = sobre fundo noite (Arraial).
 */
export function ProximosJogos({
  atual,
  quantos = 2,
  fora = [],
  titulo = "Bora para o próximo?",
  escuro = false,
}: {
  atual: JogoDaLista;
  quantos?: number;
  fora?: JogoDaLista[];
  titulo?: string;
  escuro?: boolean;
}) {
  const jogos = proximosDe(atual, quantos, fora);
  return (
    <nav aria-label="Outros jogos" className="text-left">
      <p className={`text-center font-display text-xl font-extrabold ${escuro ? "text-kambada-cream" : "text-texto"}`}>{titulo}</p>
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {jogos.map((j) => (
          <li key={j.id}>
            <Link
              href={j.href}
              className={`group flex h-full min-h-11 flex-col overflow-hidden rounded-2xl border-2 transition-colors hover:border-kambada-amarelo ${
                escuro ? "border-kambada-cream/40 bg-kambada-noite/80 text-kambada-cream" : "border-borda bg-superficie text-texto"
              }`}
            >
              <span className="relative block aspect-[4/3] bg-kambada-preto">
                <Image src={j.imagem} alt="" fill sizes="(min-width: 640px) 18rem, 50vw" className="object-cover" />
              </span>
              <span className="flex flex-1 flex-col p-3">
                <span className="font-display text-base font-extrabold leading-snug">{j.titulo}</span>
                <span className={`mt-1 text-sm font-bold ${escuro ? "text-kambada-gold" : "text-[var(--destaque-texto)]"}`}>
                  {j.acao} <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
