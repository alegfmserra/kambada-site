import { randomInt } from "node:crypto";
import { npcs } from "@/content/play/arraial";
import { BANCO as BANCO_PLAY } from "../play/jogos/quiz";
import { DIDATICA, type PerguntaCultura } from "./cultura";

/**
 * Hub de quiz do aluno (06/11/2026, pedido do Alexandre): "qual o assunto de
 * hoje?". Cada assunto tem um banco; cada prova sorteia 8 perguntas e
 * embaralha as opções (com 50 perguntas, dá umas 5 provas diferentes).
 *
 * Somente servidor: o sorteio acontece aqui e o navegador recebe só a prova
 * da vez. Os bancos de Bumba-meu-boi, Matraca, Sotaques, Tambor e São Luís
 * reaproveitam o quiz do Kambada Play público ("Éguas! Quem é quem?"), que
 * fica intocado; o de São João usa também o povo do Arraial.
 *
 * Conteúdo de protótipo: `REVISADO = false` até a revisão cultural
 * (Wilsonira, Elzanira, Cláudio Henrique) e pedagógica. Fatos do Fofão: O
 * Imparcial (2019, 2024, 2025), Jornal de Brasília, CBIC.
 */
export const REVISADO = false;
export const PERGUNTAS_POR_PROVA = 8;

/** Pergunta do banco: a certa e duas erradas (a ordem é sorteada na prova). */
type DoBanco = { pergunta: string; certa: string; erradas: [string, string]; explica: string };

export type Assunto = { id: string; titulo: string; emoji: string; resumo: string; banco: DoBanco[] };

const p = (pergunta: string, certa: string, e1: string, e2: string, explica: string): DoBanco => ({ pergunta, certa, erradas: [e1, e2], explica });

/** Do quiz do Play: a primeira opção é a certa; ficam as duas primeiras erradas. */
function doPlay(...ids: string[]): DoBanco[] {
  return ids.map((id) => {
    const q = BANCO_PLAY.find((x) => x.id === id);
    if (!q) throw new Error(`Pergunta do Play não encontrada: ${id}`);
    return p(q.enunciado, q.opcoes[0], q.opcoes[1], q.opcoes[2], q.explicacao);
  });
}

/** Das perguntas de cultura (HQs, vídeo, cordel) e do povo do Arraial. */
const deCultura = (lista: PerguntaCultura[]): DoBanco[] =>
  lista.map((q) => {
    const erradas = q.opcoes.filter((_, i) => i !== q.correta);
    return p(q.pergunta, q.opcoes[q.correta], erradas[0], erradas[1], q.explica);
  });
const doArraial = (...ids: string[]) =>
  deCultura(ids.map((id) => npcs.find((n) => n.id === id)!.quiz).map((q) => ({ pergunta: q.pergunta, opcoes: q.opcoes, correta: q.correta, explica: q.acerto.replace(/ ?(Toma|Leva|Tua|Tu mereceu)[^.!]*[.!]$/, "") })));

const CARNAVAL: DoBanco[] = [
  p("Qual é o personagem mais popular do carnaval de rua de São Luís?", "O Fofão", "O Saci", "O Curupira", "O Fofão é o personagem mais famoso e popular do carnaval de rua da cidade."),
  p("Do que é feita a máscara tradicional do Fofão?", "De papel machê, feita à mão", "De plástico, feita em fábrica", "De metal", "A máscara é moldada à mão, de papel machê, por artesãos da cidade."),
  p("Como é o nariz da máscara do Fofão?", "Comprido", "Redondo, de palhaço", "Achatado", "O nariz comprido é a marca da máscara do Fofão."),
  p("Por que a máscara do Fofão é feia?", "De propósito: ele assusta e depois brinca", "Porque é velha", "Porque ninguém sabe fazer bonita", "A máscara é feia de propósito. Primeiro o susto, depois a brincadeira."),
  p("O que o Fofão leva numa das mãos para fazer amizade com as crianças?", "Uma boneca", "Uma matraca", "Um balão", "A boneca é o jeito do Fofão de conquistar quem ficou com medo."),
  p("O que o Fofão carrega na outra mão?", "Uma varinha", "Um guarda-chuva", "Uma bandeira", "Numa mão a boneca, na outra a varinha."),
  p("De qual tecido é feito o macacão do Fofão?", "Chita", "Couro", "Jeans", "O macacão largo é de chita, tecido de flores coloridas."),
  p("Como é o macacão do Fofão?", "Bem largo, parecendo inflado", "Apertado no corpo", "Curto, como uma bermuda", "É tão folgado que o Fofão parece inflado."),
  p("A chita é um tecido conhecido por quê?", "Pelas estampas de flores grandes e coloridas", "Por ser todo preto", "Por ser feito de plástico", "A chita é estampada, colorida e muito usada nas festas populares."),
  p("Por que o Fofão oferece a boneca?", "Para conquistar quem ficou com medo da máscara", "Para vender a boneca", "Para trocar por doce", "A boneca faz amizade com a criança assustada."),
  p("De quando são os registros mais antigos do Fofão em São Luís?", "Do fim do século 19 e começo do século 20", "Do ano 2000", "De 1500", "Os primeiros registros são do fim do século 19 e do começo do século 20."),
  p("A origem do Fofão é…", "Ainda discutida por quem estuda", "Proibida de estudar", "Conhecida, sem nenhuma dúvida", "Quem estuda ainda não chegou a um acordo sobre de onde ele veio."),
  p("Uma das ideias sobre a origem do Fofão fala de influência…", "Das comédias de rua da Europa", "Dos desenhos animados", "Dos filmes de cinema", "Há estudiosos que veem no Fofão a influência das comédias de rua e dos carnavais da Europa."),
  p("Outra ideia sobre a origem do Fofão aponta raízes…", "Africanas", "Japonesas", "Australianas", "Há quem aponte raízes africanas no Fofão."),
  p("Em qual festa o Fofão aparece?", "No carnaval de rua de São Luís", "No São João, em junho", "No Natal", "O Fofão é personagem do carnaval de rua."),
  p("Quem faz as máscaras tradicionais do Fofão?", "Artesãos da cidade, à mão", "Robôs de uma fábrica", "Ninguém: vêm prontas de outro país", "Cada máscara é um trabalho de mão de artesãos de São Luís."),
  p("Papel machê é feito de quê?", "Papel e cola", "Areia e cimento", "Vidro", "Papel molhado com cola, moldado e depois pintado."),
  p("O Fofão é chamado de personagem “democrático” do carnaval. Por quê?", "Porque qualquer pessoa pode sair de Fofão", "Porque é eleito todo ano", "Porque só gente rica pode ser Fofão", "Não precisa de bloco nem de convite: qualquer um pode brincar de Fofão."),
  p("Por que o Fofão esconde o rosto?", "O mistério de quem está debaixo da fantasia faz parte da brincadeira", "Porque está doente", "Porque é proibido mostrar o rosto", "Ninguém vê quem está debaixo da máscara: esse é o mistério."),
  p("Qual grupo trabalha para manter vivo o Fofão em São Luís?", "O Blocão do Fofão", "A Turma do Saci", "O Clube da Matraca", "O Blocão do Fofão busca preservar o personagem típico do Maranhão."),
  p("Em 2025, qual museu de São Luís fez uma exposição só sobre o Fofão?", "O Museu Histórico e Artístico do Maranhão", "O Museu do Ipiranga", "O Museu do Louvre", "A exposição “Da máscara ao chitão” foi no Museu Histórico e Artístico do Maranhão."),
  p("Como se chamou a exposição de 2025 sobre o Fofão?", "Da máscara ao chitão", "O boi que renasce", "A Ilha Encantada", "O nome junta as duas marcas do Fofão: a máscara e a chita."),
  p("Em 2024, a Casa de Nhozinho, museu de São Luís, fez uma exposição sobre…", "As máscaras artesanais do Fofão", "Carros antigos", "Dinossauros", "A exposição mostrou máscaras de Fofão feitas à mão."),
  p("Segundo o artigo da temporada, o que faz uma tradição continuar existindo?", "Passar de uma geração para outra", "Ficar guardada sem ninguém usar", "Ser igual em todas as cidades", "Alguém precisa fazer a máscara, costurar a chita e sair na rua."),
  p("Em que época do ano acontece o carnaval?", "Antes da Quaresma, em fevereiro ou março", "Em junho", "No Natal", "O carnaval vem antes da Quaresma, por isso a data muda a cada ano."),
  p("Em que dia o carnaval termina?", "Na Quarta-feira de Cinzas", "No dia de São João", "No Dia das Crianças", "Na Quarta-feira de Cinzas a festa acaba e começa a Quaresma."),
  p("O que começa logo depois do carnaval?", "A Quaresma", "O São João", "As férias de julho", "A Quaresma começa na Quarta-feira de Cinzas."),
  p("O que é um bloco de carnaval?", "Um grupo que sai pela rua cantando e dançando junto", "Um prédio", "Uma comida típica", "No bloco, todo mundo brinca junto pela rua."),
  p("O que é confete?", "Papelzinho colorido picado, jogado na festa", "Um doce de milho", "Um instrumento de sopro", "O confete colore a rua e a fantasia de todo mundo."),
  p("O que é serpentina?", "Uma fita de papel enrolada que se joga na festa", "Uma cobra de verdade", "Uma fantasia de rei", "A serpentina se desenrola no ar quando é jogada."),
  p("O que é uma fantasia de carnaval?", "Uma roupa para se vestir de personagem", "Um sonho", "Uma comida típica", "No carnaval, a gente se fantasia de personagem; o Fofão é uma fantasia."),
  p("O que é uma marchinha de carnaval?", "Uma música curta e animada para cantar no bloco", "Uma dança de roda do tambor de crioula", "Uma brincadeira de pique", "As marchinhas são feitas para todo mundo cantar junto."),
  p("Quando o Fofão chega, o que as crianças costumam sentir?", "Um susto e, depois, vontade de brincar", "Sono", "Fome", "É assim a brincadeira: assusta e depois diverte."),
  p("Além da máscara, a fantasia do Fofão tem…", "Macacão de chita, boneca e varinha", "Capa e espada", "Coroa e cetro", "Essas são as marcas do Fofão."),
  p("Qual destas peças NÃO faz parte da fantasia do Fofão?", "Chapéu de couro de vaqueiro", "Máscara de nariz comprido", "Macacão de chita", "O chapéu de couro é do vaqueiro do sertão."),
  p("Qual destas NÃO é do Fofão?", "As matracas", "A boneca", "A varinha", "As matracas são do Bumba-meu-boi da Ilha, em junho."),
  p("De qual festa é a matraca?", "Do Bumba-meu-boi, no São João", "Do carnaval de rua", "Do Natal", "A matraca é o instrumento do boi da Ilha; no carnaval, quem brilha é o Fofão."),
  p("O Fofão é personagem do carnaval de qual cidade?", "São Luís", "Salvador", "Recife", "É o personagem mais popular do carnaval de rua de São Luís."),
  p("Em qual estado fica São Luís?", "No Maranhão", "Na Bahia", "No Pará", "São Luís é a capital do Maranhão."),
  p("Para que mais o Fofão usa a varinha na rua?", "Para afastar os cachorros da rua", "Para reger uma orquestra", "Para fazer mágica de verdade", "Quem estuda o Fofão conta que a varinha também espanta os cachorros."),
  p("Por que a máscara do Fofão é chamada de “trabalho de mão”?", "Porque é moldada e pintada à mão, uma por uma", "Porque se usa na mão", "Porque é feita de luva", "Cada máscara é única, feita por um artesão."),
  p("O que pode acontecer se ninguém mais fizer máscaras nem sair de Fofão?", "A tradição pode se perder", "Nada muda", "O carnaval fica maior", "Tradição precisa de gente para continuar."),
  p("O macacão do Fofão parece “inflado”. O que quer dizer “inflado”?", "Cheio de ar, como uma bola", "Rasgado", "Molhado", "Inflado é estufado, cheio, como um balão."),
  p("Qual é a cor do macacão do Fofão?", "Muitas cores, com flores", "Só branco", "Só preto", "A chita é estampada e colorida."),
  p("Onde acontece o carnaval de rua de São Luís?", "Nas ruas e nos bairros, com blocos e gente fantasiada", "Só dentro de casa", "Só dentro da escola", "A festa anda pela cidade."),
  p("Por que o Fofão é importante para São Luís?", "Ele faz parte da história e do jeito de ser do carnaval da cidade", "Porque vende carros", "Porque é um super-herói de filme", "É um personagem que conta a história da cidade."),
  p("Com quem tem medo dele, o que o Fofão faz?", "Oferece a boneca e brinca", "Vai embora correndo", "Tira a máscara", "Ele não tira a máscara: oferece a boneca."),
  p("O que é uma tradição?", "Um costume que passa de geração em geração", "Uma moda que dura um dia", "Uma lei do governo", "Como o Fofão, que existe há mais de cem anos."),
  p("O que é patrimônio cultural?", "Aquilo que um povo guarda e valoriza da sua história e da sua cultura", "Dinheiro guardado no banco", "Um tipo de fantasia", "Festas, saberes e personagens também são patrimônio."),
  p("Quem pode ajudar a manter o Fofão vivo?", "Quem faz as máscaras, costura a chita e sai na rua no carnaval", "Ninguém", "Só o governo", "A tradição continua com quem faz e com quem brinca."),
];

const SOTAQUES_EXTRA: DoBanco[] = [
  p("Quais instrumentos marcam o sotaque da Ilha?", "Matracas e pandeirões", "Saxofone e banjo", "Sanfona e triângulo", "Na Ilha, centenas de matracas batem junto com os pandeirões."),
  p("O sotaque de Orquestra usa quais instrumentos?", "Sopro e corda, como saxofone e banjo", "Só matracas", "Só tambores", "É o sotaque mais melodioso, da região do rio Munim."),
  p("O sotaque de Orquestra é da região de qual rio?", "Munim", "Amazonas", "São Francisco", "Rosário, Axixá e Morros ficam na região do Munim."),
  p("O Cazumbá é personagem muito presente em qual sotaque?", "Sotaque da Baixada", "Sotaque de Orquestra", "Sotaque da Ilha", "O Cazumbá, de máscara e bata colorida, é marca dos bois da Baixada."),
  p("Quantos são os sotaques principais do Bumba-meu-boi do Maranhão?", "Cinco", "Dois", "Dez", "Ilha (matraca), Zabumba, Orquestra, Baixada e Costa-de-mão."),
];

const MATRACA_EXTRA: DoBanco[] = [
  p("Do que é feita a matraca?", "De madeira", "De plástico", "De vidro", "São duas peças de madeira."),
  p("Como é o som da matraca?", "Um estalo seco", "Um apito fino", "Um som de corda", "É o estalo seco que a gente ouve no arraial."),
  p("Junto com as matracas, o sotaque da Ilha usa…", "Pandeirões", "Saxofones", "Violinos", "Matracas e pandeirões fazem o batalhão da Ilha."),
];

export const ASSUNTOS: Assunto[] = [
  { id: "carnaval", titulo: "Carnaval", emoji: "🎭", resumo: "O Fofão e o carnaval de rua de São Luís.", banco: CARNAVAL },
  {
    id: "saojoao",
    titulo: "São João",
    emoji: "🔥",
    resumo: "A fogueira, a quadrilha, o milho e o boi no arraial.",
    banco: [
      ...doArraial("noivos", "fogueira", "boi", "brincante"),
      p("Por que a festa de São João tem tanta comida de milho?", "Porque junho é tempo de colheita do milho", "Porque o boi só come milho", "Porque milho só pode ser comido em junho", "As festas juninas celebram a colheita: pamonha, canjica, cuscuz e bolo."),
      ...doPlay("mes-do-boi", "batizado", "sao-marcal", "morte-do-boi"),
    ],
  },
  {
    id: "boi",
    titulo: "Bumba-meu-boi",
    emoji: "🐂",
    resumo: "A história do boi, Catirina, Pai Francisco, o Amo e o Cazumbá.",
    banco: [...doPlay("lingua-do-boi", "quem-ressuscita", "cazumba", "unesco", "catirina", "pai-francisco", "amo-do-boi", "toada", "couro-bordado"), ...deCultura(DIDATICA["conto-boi"].perguntas)],
  },
  { id: "matraca", titulo: "Matraca", emoji: "🪵", resumo: "O instrumento do boi da Ilha.", banco: [...doPlay("matraca-instrumento", "duas-matracas", "capelo", "sao-marcal"), ...doArraial("brincante"), ...MATRACA_EXTRA] },
  { id: "sotaques", titulo: "Sotaques do boi", emoji: "🥁", resumo: "Ilha, Zabumba, Orquestra, Baixada e Costa-de-mão.", banco: [...doPlay("sotaques", "zabumba-origem", "costa-de-mao", "matraca-instrumento"), ...SOTAQUES_EXTRA] },
  { id: "tambor", titulo: "Tambor de Crioula", emoji: "🪘", resumo: "A roda, as coreiras, a punga e os três tambores.", banco: [...doPlay("iphan-tambor", "punga", "tres-tambores", "coreira", "esquentar-couro", "sao-benedito"), ...deCultura(DIDATICA["hq-tambor"].perguntas)] },
  { id: "mangue", titulo: "Mangue e guarás", emoji: "🦩", resumo: "O mangue, o caranguejo e a revoada dos guarás.", banco: [...doPlay("guara"), ...deCultura(DIDATICA["hq-guaras"].perguntas), ...deCultura(DIDATICA["video-guaras"].perguntas)] },
  { id: "saoluis", titulo: "São Luís e o Maranhão", emoji: "🏘️", resumo: "Azulejos, a fundação da cidade, a bandeira e a comida.", banco: doPlay("cidade-azulejos", "fundacao", "patrimonio-mundial", "reggae", "cuxa", "serpente", "bandeira", "listras", "lencois") },
];

export const assuntoPorId = (id: string) => ASSUNTOS.find((a) => a.id === id);
export const atividadeDoQuiz = (assunto: string) => `quiz-${assunto}`;

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Uma prova: 8 perguntas sorteadas do banco, cada uma com as opções embaralhadas. */
export function sortearProva(a: Assunto, n = PERGUNTAS_POR_PROVA): PerguntaCultura[] {
  return embaralhar(a.banco)
    .slice(0, n)
    .map((q) => {
      const opcoes = embaralhar([q.certa, ...q.erradas]);
      return { pergunta: q.pergunta, opcoes, correta: opcoes.indexOf(q.certa), explica: q.explica };
    });
}
