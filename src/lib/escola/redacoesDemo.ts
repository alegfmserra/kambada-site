import { CONCURSO } from "./concurso";
import type { Aluno, Redacao } from "./dados";

/**
 * Redações fictícias da demonstração (escritas como alunos do 4º, 5º e 8º
 * ano escreveriam). Umas avaliadas e finalistas, outras esperando o
 * professor e um rascunho; no 8º ano a coordenação já escolheu a
 * representante, para a etapa da rede (gestão Kambada) ter o que mostrar.
 */
type Semente = { aluno: string; texto: string; enviada?: boolean; notas?: [number, number, number, number]; comentario?: string; finalista?: boolean; representante?: boolean };

const SEMENTE: Semente[] = [
  {
    aluno: "t4a-a1",
    texto:
      "No sábado de carnaval eu fui com a minha avó na rua da Madre Deus. De repente apareceu um Fofão bem grande com uma máscara de nariz comprido. Eu fiquei com medo e me escondi atrás da minha avó. Ai ele tirou uma boneca do bolso e me deu. Eu ri muito e perdi o medo. A minha avó disse que quando ela era criança tambem tinha Fofão na rua. Foi o melhor carnaval da minha vida.",
    enviada: true,
    notas: [5, 4, 4, 3],
    comentario: "Que história boa! Tu descreveu o Fofão direitinho e contou como o medo passou. Atenção aos acentos: “também”, “aí”.",
    finalista: true,
  },
  {
    aluno: "t4a-a2",
    texto:
      "Eu estava na praça com meu pai e vi um Fofão. Ele tinha um macacão colorido de chita e uma varinha na mão. Ele corria atrás das crianças e todo mundo gritava e ria ao mesmo tempo. Depois ele deu uma boneca para minha irmã pequena. Eu gostei do Fofão porque ele assusta mas é legal.",
    enviada: true,
    notas: [4, 3, 3, 4],
    comentario: "Boa descrição da roupa! Na próxima, conta mais o final: o que aconteceu depois da boneca?",
    finalista: true,
  },
  {
    aluno: "t4a-a3",
    texto:
      "O carnaval de São Luís é muito animado. Tem bloco, tem música e tem o Fofão. Eu encontrei um Fofão perto da minha casa e ele tava com uma boneca velha na mão. Ele dançou com a gente na calçada e depois foi embora pro outro bloco. Eu quero ser Fofão no próximo carnaval e fazer a minha máscara.",
    enviada: true,
  },
  {
    aluno: "t5b-a1",
    texto:
      "Quando eu fui no carnaval na Praia Grande vi um Fofão parado na esquina. A máscara dele era feia de verdade, com um nariz enorme e uns olhos arregalados. Ele balançava uma boneca e dizia que ia me dar. Eu fui corajoso e peguei a boneca. O Fofão fez uma dança engraçada e todo mundo bateu palma. Agora eu sei que o Fofão não é pra dar medo, é pra brincar.",
    enviada: true,
    notas: [5, 5, 4, 4],
    comentario: "Excelente! Tu usou o que aprendeu (a máscara feia de propósito, a boneca) para contar a tua história.",
    finalista: true,
  },
  {
    aluno: "t5b-a2",
    texto:
      "O Fofão é um personagem do carnaval da nossa cidade. Ele usa macacão largo, máscara e carrega uma boneca. Eu vi ele na rua com minha mãe e tirei uma foto. Foi muito divertido e eu quero ver de novo no ano que vem quando tiver carnaval de novo.",
    enviada: true,
  },
  {
    aluno: "t8a-a1",
    texto:
      "Eu acredito que manter vivos os personagens do carnaval maranhense é uma forma de proteger a nossa história. O Fofão, por exemplo, aparece nas ruas de São Luís desde o fim do século XIX, e cada máscara feita à mão de papel machê guarda o trabalho de artesãos da cidade. Se ele desaparecer, perdemos também esse saber.\n\nAlém disso, os personagens tradicionais fazem as gerações conversarem. Meu avô brincava de Fofão e hoje eu ouço as histórias dele quando vejo um passando no bloco. É uma memória que não está nos livros, mas está na rua.\n\nPor isso, proponho que a escola faça uma oficina de máscaras com artesãos do bairro e que a cidade apoie os blocos tradicionais. Assim, o carnaval continua sendo nosso, e não só uma festa copiada de outros lugares.",
    enviada: true,
    notas: [5, 5, 5, 4],
    comentario: "Texto de opinião muito bem construído: tese clara, dois argumentos com exemplo e proposta no fim. Parabéns!",
    finalista: true,
    representante: true,
  },
  {
    aluno: "t8a-a2",
    texto:
      "Na minha opinião, os personagens do carnaval maranhense precisam continuar existindo porque eles mostram quem nós somos. Hoje muita gente só conhece as atrações de fora que tocam no rádio e na internet, e o Fofão acaba ficando esquecido.\n\nO primeiro motivo é a identidade: o Fofão com o macacão de chita e a boneca só existe aqui, e isso faz o nosso carnaval ser diferente. O segundo motivo é a diversão das crianças, que se assustam com a máscara feia mas depois ganham a boneca e fazem amizade.\n\nEntão, para não perder essa tradição, as escolas deveriam ensinar sobre o Fofão todo ano e as famílias deveriam levar as crianças aos blocos de rua.",
    enviada: true,
    notas: [5, 4, 4, 4],
    comentario: "Bons argumentos! Para ficar ainda melhor, traga um dado da história do Fofão (de quando ele é, como a máscara é feita).",
    finalista: true,
  },
];

export function redacoesDemo(alunos: Aluno[], agora = Date.now()): Redacao[] {
  const existe = new Map(alunos.map((a) => [a.id, a]));
  return SEMENTE.filter((s) => existe.has(s.aluno)).map((s, i) => {
    const a = existe.get(s.aluno)!;
    const em = new Date(agora - (SEMENTE.length - i) * 3 * 3600000).toISOString();
    return {
      id: `r-demo-${i + 1}`,
      concursoId: CONCURSO.id,
      alunoId: a.id,
      turmaId: a.turmaId,
      texto: s.texto,
      atualizadaEm: em,
      ...(s.enviada ? { enviadaEm: em } : {}),
      ...(s.notas ? { avaliacao: { notas: { tema: s.notas[0], repertorio: s.notas[1], organizacao: s.notas[2], lingua: s.notas[3] }, comentario: s.comentario ?? "", por: "m-ana", em } } : {}),
      ...(s.finalista ? { finalista: true } : {}),
      ...(s.representante ? { representante: true } : {}),
    };
  });
}

/**
 * Notas fictícias das redações de São João e da Consciência Negra (sem
 * arquivo), para a demonstração mostrar a evolução da escrita no ano. Sorteio
 * próprio e fixo: quem escreve melhor no Carnaval vem subindo desde junho.
 */
export function historicoDemo(alunos: Aluno[], agora = Date.now()): Redacao[] {
  let x = 20261106;
  const r = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const out: Redacao[] = [];
  const fora = (a: Aluno) => a.id.endsWith("-teste") || a.apelido === "Sabiá" || a.apelido === "Cuxá";
  for (const a of alunos) {
    if (fora(a)) continue;
    const base = 1 + Math.floor(r() * 3); // 1 a 3 em junho
    [["saojoao-2026", 0, 150], ["tambor-2026", 1, 10]].forEach(([id, ganho, dias], i) => {
      if (r() < 0.12) return; // alguns faltaram no dia
      const n = () => Math.min(5, Math.max(1, base + (ganho as number) + Math.round(r() * 1.4 - 0.4)));
      const em = new Date(agora - (dias as number) * 86400000).toISOString();
      out.push({
        id: `r-hist-${a.id}-${i}`,
        concursoId: id as string,
        alunoId: a.id,
        turmaId: a.turmaId,
        texto: "",
        atualizadaEm: em,
        enviadaEm: em,
        avaliacao: { notas: { tema: n(), repertorio: n(), organizacao: n(), lingua: n() }, comentario: "", por: "m-ana", em },
      });
    });
  }
  return out;
}
