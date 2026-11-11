import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Roda ao vivo" };

/**
 * Roda da Kambada: a sala ao vivo do Play (o "Kahoot" da Kambada), pedida
 * pelo Alexandre em 11/11/2026. Por enquanto é a vitrine do que vem: o nome,
 * como a roda vai funcionar e os jogos (todos "Em breve"). Nada aqui funciona
 * ainda; a tela diz isso com todas as letras.
 */
const PASSOS: [string, string, string][] = [
  ["📺", "A professora abre a roda", "Escolhe a temporada e o jogo e projeta a tela na TV da sala."],
  ["🎟️", "A turma entra", "Cada aluno entra com o código da roda e as figuras do cartão, sem e-mail e sem nome."],
  ["❓", "A pergunta aparece na TV", "Cada um responde no tablet ou no celular da escola, com tempo para pensar."],
  ["🥁", "Placar por batalhão", "A turma joga em equipes (os batalhões), e não criança contra criança: ninguém fica exposto."],
  ["📊", "Depois da roda", "As respostas entram no mapa de reforço da turma, como os desafios de sempre."],
];

const JOGOS: [string, string, string][] = [
  ["🎯", "Quiz da Roda", "Perguntas das temporadas liberadas para a escola, uma por vez, com a explicação depois de cada resposta."],
  ["🐂", "Batalhão contra batalhão", "A turma dividida em equipes; cada acerto faz o batalhão avançar no arraial."],
  ["🌙", "Verdade ou lenda?", "Frases sobre as festas e as lendas do Maranhão para a turma decidir junta."],
  ["🎭", "Quem sou eu?", "Pistas, uma de cada vez, para adivinhar o personagem: Fofão, Cazumbá, Catirina, Pai Francisco."],
  ["🪘", "No ritmo do tambor", "Perguntas rápidas no compasso do tambor de crioula, para fechar a aula com energia."],
];

export default async function RodaAoVivo() {
  await exigir("professor", "coordenacao", "gestor");
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <Etiqueta>Sala ao vivo · em breve</Etiqueta>
        <TituloDuo antes="Roda da" destaque="Kambada" />
        <p className="max-w-2xl text-lg text-texto-suave">
          A sala ao vivo do Kambada Play: a turma inteira joga junta, na sala de aula, com as perguntas das temporadas na TV e o placar por equipes.
        </p>
        <FalaKambadinha>Bora fazer roda? Na roda todo mundo joga junto, e a festa é da turma inteira!</FalaKambadinha>
        <p className="inline-block rounded-full bg-kambada-amarelo px-4 py-1.5 text-sm font-bold text-kambada-grafite">Em construção: ainda não dá para abrir uma roda</p>
      </section>

      <section className="space-y-4">
        <TituloDuo antes="Como a roda" destaque="vai funcionar" nivel={2} />
        <ol className="grid gap-3 md:grid-cols-5">
          {PASSOS.map(([e, t, s], i) => (
            <li key={t} className="rounded-2xl border-2 border-borda p-4">
              <p className="text-2xl" aria-hidden>
                {e}
              </p>
              <p className="mt-2 font-display font-bold">
                {i + 1}. {t}
              </p>
              <p className="mt-1 text-sm text-texto-suave">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <TituloDuo antes="Jogos" destaque="da roda" nivel={2} />
        <ul className="grid gap-3 md:grid-cols-2">
          {JOGOS.map(([e, t, s]) => (
            <li key={t} className="flex gap-3 rounded-2xl border-2 border-dashed border-borda p-4 opacity-90">
              <span className="text-3xl" aria-hidden>
                {e}
              </span>
              <span>
                <span className="flex flex-wrap items-center gap-2 font-display font-bold">
                  {t}
                  <span className="rounded-full bg-kambada-grafite px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-kambada-amarelo">Em breve</span>
                </span>
                <span className="mt-1 block text-sm text-texto-suave">{s}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
