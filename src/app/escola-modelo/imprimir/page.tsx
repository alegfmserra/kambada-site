import Link from "next/link";
import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { ATIVIDADES, QUEBRAS } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { ASSUNTOS } from "@/lib/escola/quizzes";

export const metadata = { title: "Kit fora da tela" };

const BOTAO = "rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro";
const BOTAO2 = "rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo";

/**
 * Kit fora da tela: tudo do Play que vira papel, roda e brincadeira. Aberto
 * (sem login), porque é o mesmo conteúdo público do Play e serve também para
 * mostrar à escola. A tela vira porta, não destino.
 */
export default function KitForaDaTela() {
  const revistinhas = ATIVIDADES.filter((a) => a.tipo === "hq" && a.slug);
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Etiqueta>Para a professora · imprimir e brincar</Etiqueta>
        <TituloDuo antes="Kit" destaque="fora da tela" />
        <FalaKambadinha>A tela é só a porta. O resto acontece na roda, no papel e em casa, com a família!</FalaKambadinha>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["📖", "Ler junto", "A professora lê a revistinha na roda (ou projeta na TV) e a criança leva a sua para casa."],
            ["✂️", "Fazer com a mão", "Quebra-cabeça de papel, teatrinho com plaquinhas, desenho da história."],
            ["🗣️", "Conversar", "Perguntas de roda depois de cada história e cartas de perguntas para jogar sem tela."],
          ].map(([e, t, s]) => (
            <div key={t} className="rounded-3xl border-2 border-borda p-4">
              <span className="text-3xl" aria-hidden>{e}</span>
              <b className="mt-1 block font-display text-lg">{t}</b>
              <span className="text-sm text-texto-suave">{s}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-extrabold">📚 Estante de revistinhas</h2>
        <p className="text-sm text-texto-suave">Desenhadas por Ricardo Pontes, artista maranhense. Cada revistinha vem com uma folha de roda de conversa e um quadro para desenhar.</p>
        <ul className="grid gap-6 sm:grid-cols-2">
          {revistinhas.map((h) => (
            <li key={h.id} className="flex gap-4 rounded-3xl border-2 border-borda p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- capa da HQ, arquivo direto */}
              <img src={`/kambadaplay/hq/${h.slug}/01.webp`} alt={`Capa de ${h.titulo}`} className="w-32 shrink-0 rounded-lg border-4 border-kambada-grafite shadow-[5px_5px_0_0_#ffcc29] sm:w-40" />
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">Kambadinha em</p>
                <h3 className="font-display text-xl font-extrabold leading-tight">{h.titulo}</h3>
                <p className="flex-1 text-sm text-texto-suave">{h.resumo}</p>
                <p className="text-xs text-texto-suave">{h.paginas} páginas + roda de conversa</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={rotaEscola(`/imprimir/revistinha/${h.slug}`)} className={BOTAO}>🖨 Imprimir</Link>
                  <Link href={rotaEscola(`/revistinha/${h.slug}`)} className={BOTAO2}>📺 Ler na TV</Link>
                </div>
              </div>
            </li>
          ))}
          <li className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-borda p-4 opacity-80">
            <span className="grid h-40 w-32 shrink-0 place-items-center rounded-lg bg-superficie text-5xl" aria-hidden>🎭</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">Em produção</p>
              <h3 className="font-display text-xl font-extrabold">O Fofão e o carnaval de rua</h3>
              <p className="text-sm text-texto-suave">A revistinha da temporada de Carnaval, com o Ricardo.</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-extrabold">🧩 Quebra-cabeças de papel</h2>
        <p className="text-sm text-texto-suave">Com 6 peças para os pequenos, 12 ou 20 para os maiores. Cole num papelão antes de cortar.</p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {QUEBRAS.map((q) => (
            <li key={q.id}>
              <Link href={rotaEscola(`/imprimir/quebra-cabeca/${q.id}`)} className="block overflow-hidden rounded-3xl border-2 border-borda hover:border-kambada-amarelo">
                {/* eslint-disable-next-line @next/next/no-img-element -- arte do Play */}
                <img src={q.imagem} alt="" className="h-40 w-full object-cover object-top" />
                <span className="block p-3 font-bold">{q.titulo} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href={rotaEscola("/imprimir/teatrinho")} className="rounded-3xl border-2 border-borda p-5 hover:border-kambada-amarelo">
          <span className="text-4xl" aria-hidden>🐂</span>
          <b className="mt-2 block font-display text-xl">Teatrinho do Auto do Boi</b>
          <span className="text-sm text-texto-suave">6 cenas para pôr em ordem e encenar, e as plaquinhas dos personagens (Amo, Catirina, Pai Francisco, Boi, vaqueiros e Pajé).</span>
        </Link>
        <Link href={rotaEscola("/folha-de-redacao")} className="rounded-3xl border-2 border-borda p-5 hover:border-kambada-amarelo">
          <span className="text-4xl" aria-hidden>✍️</span>
          <b className="mt-2 block font-display text-xl">Folha de redação da temporada</b>
          <span className="text-sm text-texto-suave">Para o Fundamental: a turma escreve à mão e a professora corrige no portal.</span>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-extrabold">🃏 Cartas de perguntas</h2>
        <p className="text-sm text-texto-suave">O quiz do portal em cartas, para jogar em roda: a professora lê, a turma responde. Respostas na última folha.</p>
        <div className="flex flex-wrap gap-2">
          {ASSUNTOS.map((a) => (
            <Link key={a.id} href={rotaEscola(`/imprimir/cartas/${a.id}`)} className={BOTAO2}>
              {a.emoji} {a.titulo} <span className="font-normal text-texto-suave">({a.banco.length})</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-kambada-grafite p-5 text-white">
        <h2 className="font-display text-xl font-extrabold text-kambada-amarelo">Na Educação Infantil (3 a 5 anos)</h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li>📺 <b>Tela coletiva e curta:</b> a professora projeta a animação (1 minuto) ou lê a revistinha na TV, e a conversa acontece na roda.</li>
          <li>🧸 <b>O resto é com o corpo e com a mão:</b> quebra-cabeça de 6 peças, teatrinho, dança com a matraca, desenho da história.</li>
          <li>🏠 <b>A revistinha vai para casa</b> com o recado para a família ler junto.</li>
        </ul>
        <p className="mt-3 text-xs text-white/70">A Sociedade Brasileira de Pediatria recomenda, de 2 a 5 anos, no máximo 1 hora de tela por dia, sempre com um adulto.</p>
      </section>

      <p className="text-center text-sm text-texto-suave">Em produção: páginas para colorir no traço do Ricardo.</p>
    </div>
  );
}
