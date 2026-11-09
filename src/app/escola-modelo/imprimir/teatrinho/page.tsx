import { FolhaA4, Impresso, RodapeImpresso } from "@/components/escola/imprimir/Impresso";
import { CENAS_AUTO } from "@/lib/escola/cultura";

export const metadata = { title: "Teatrinho do Auto do Boi" };

/** Personagens do auto, para as plaquinhas de pendurar no pescoço. */
const PAPEIS = [
  { emoji: "🤠", nome: "Amo", faz: "o dono da fazenda" },
  { emoji: "🤰🏾", nome: "Catirina", faz: "tem o desejo" },
  { emoji: "👨🏾‍🌾", nome: "Pai Francisco", faz: "leva o boi" },
  { emoji: "🐂", nome: "Boi", faz: "morre e renasce" },
  { emoji: "🏹", nome: "Vaqueiros e caboclos", faz: "procuram o boi" },
  { emoji: "🌿", nome: "Pajé", faz: "cura o boi" },
];

/**
 * Teatrinho do Auto do Boi: as 6 cenas do jogo "A história do Boi" em
 * cartões grandes para a turma pôr em ordem e encenar, e as plaquinhas dos
 * personagens. É o mesmo enredo do jogo do portal, agora com o corpo.
 */
export default function Teatrinho() {
  return (
    <Impresso
      titulo="Teatrinho do Auto do Boi"
      dica="Folha 1: as 6 cenas para recortar, embaralhar e pôr em ordem. Folha 2: as plaquinhas dos personagens (furar e passar um barbante). Depois, a turma encena com matraca e muita dança."
    >
      <FolhaA4 className="gap-[4mm]">
        <header className="border-b-2 border-black pb-2">
          <p className="text-[9pt] font-bold uppercase tracking-[0.18em]">Bumba-meu-boi · teatrinho</p>
          <p className="font-display text-[20pt] font-extrabold leading-tight">A história do Boi em 6 cenas</p>
          <p className="text-[10pt]">Recorte, embaralhe e ponha em ordem. Depois, cada grupo encena uma cena.</p>
        </header>
        <div className="grid flex-1 grid-cols-2 grid-rows-3 gap-[4mm]">
          {CENAS_AUTO.map((c) => (
            <div key={c.id} className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-600 p-3 text-center">
              <span className="text-[44pt] leading-none" aria-hidden>{c.emoji}</span>
              <p className="mt-2 font-display text-[15pt] font-extrabold">{c.titulo}</p>
              <p className="mt-1 text-[10.5pt]">{c.texto}</p>
            </div>
          ))}
        </div>
        <RodapeImpresso />
      </FolhaA4>

      <FolhaA4 className="gap-[4mm]">
        <header className="border-b-2 border-black pb-2">
          <p className="font-display text-[20pt] font-extrabold leading-tight">Quem entra em cena</p>
          <p className="text-[10pt]">Recorte as plaquinhas, fure os dois cantos de cima e passe um barbante.</p>
        </header>
        <div className="grid flex-1 grid-cols-2 grid-rows-3 gap-[4mm]">
          {PAPEIS.map((p) => (
            <div key={p.nome} className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-600 p-3 text-center">
              <span className="absolute left-4 top-3 h-3 w-3 rounded-full border border-neutral-500" aria-hidden />
              <span className="absolute right-4 top-3 h-3 w-3 rounded-full border border-neutral-500" aria-hidden />
              <span className="text-[54pt] leading-none" aria-hidden>{p.emoji}</span>
              <p className="mt-2 font-display text-[22pt] font-extrabold leading-tight">{p.nome}</p>
              <p className="text-[10pt] text-neutral-600">{p.faz}</p>
            </div>
          ))}
        </div>
        <RodapeImpresso />
      </FolhaA4>
    </Impresso>
  );
}
