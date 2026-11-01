import type { Disciplina, Etapa, TrilhaPublica } from "./tipos";

/**
 * Desafios do portal da escola: a conta, a regra ou a palavra dentro de uma
 * cena da cultura do Maranhão (o troco na barraca, os guarás no mangue).
 *
 * TEM O GABARITO: só o servidor importa este arquivo. O navegador recebe a
 * pergunta sem a resposta (ver `QuestaoPublica`) e a ordem das opções é
 * embaralhada por partida.
 *
 * `diagnostico` = o que a escolha errada costuma revelar. É isso que aparece
 * no relatório do professor ("quem escolheu R$ 13 somou em vez de tirar").
 *
 * Conteúdo de protótipo (01/11/2026): `REVISADO = false` até a coordenação
 * pedagógica de uma escola parceira e os mestres da cultura conferirem.
 */
export const REVISADO = false;

export type Questao = {
  id: string;
  habilidade: string;
  cena: string;
  enunciado: string;
  opcoes: string[];
  correta: number;
  /** Mostrada depois de acertar ou de errar a segunda vez. */
  explica: string;
  /** Mostrada depois do primeiro erro. */
  dica: string;
  diagnostico?: Record<number, string>;
};

export type Trilha = {
  id: string;
  titulo: string;
  emoji: string;
  disciplina: Disciplina;
  etapa: Etapa;
  resumo: string;
  questoes: Questao[];
};

export const TRILHAS: Trilha[] = [
  {
    id: "contas-do-arraial",
    titulo: "Contas do Arraial",
    emoji: "🧮",
    disciplina: "Matemática",
    etapa: "f1",
    resumo: "Somar matracas, dar o troco da pamonha e repartir as fitas do chapéu.",
    questoes: [
      {
        id: "ca-1", habilidade: "Adição", cena: "Arraial · grupo do boi",
        enunciado: "No arraial, o Kambadinha contou 8 matracas no grupo do boi. Chegaram mais 7. Quantas matracas tem agora?",
        opcoes: ["13", "15", "16"], correta: 1,
        dica: "Junte as duas quantidades: 8 + 7.",
        explica: "8 + 7 = 15. Dica de cabeça: 8 + 2 = 10, e sobram 5: 15.",
        diagnostico: { 0: "Errou a soma de cabeça (8 + 7).", 2: "Contou um a mais." },
      },
      {
        id: "ca-2", habilidade: "Adição", cena: "Quadrilha da escola",
        enunciado: "Na quadrilha da escola dançaram 12 pares no primeiro dia e 9 pares no segundo. Quantos pares dançaram ao todo?",
        opcoes: ["21", "20", "3"], correta: 0,
        dica: "“Ao todo” pede para juntar: 12 + 9.",
        explica: "12 + 9 = 21 pares.",
        diagnostico: { 1: "Errou a soma por um.", 2: "Tirou em vez de somar." },
      },
      {
        id: "ca-3", habilidade: "Dinheiro e troco", cena: "Barraca da pamonha",
        enunciado: "A pamonha custa R$ 3. O Kambadinha pagou com uma nota de R$ 10. Quanto ele recebe de troco?",
        opcoes: ["R$ 6", "R$ 7", "R$ 13"], correta: 1,
        dica: "Troco é o que sobra: tire o preço do que foi pago.",
        explica: "10 − 3 = 7. O troco é R$ 7.",
        diagnostico: { 0: "Errou a subtração.", 2: "Somou em vez de tirar." },
      },
      {
        id: "ca-4", habilidade: "Subtração", cena: "Chapéu dos brincantes",
        enunciado: "O grupo levou 25 fitas para enfeitar os chapéus. Já usou 18. Quantas fitas sobraram?",
        opcoes: ["7", "13", "43"], correta: 0,
        dica: "Sobrou = o que tinha menos o que usou: 25 − 18.",
        explica: "25 − 18 = 7 fitas.",
        diagnostico: { 1: "Errou a subtração com reserva (25 − 18).", 2: "Somou em vez de tirar." },
      },
      {
        id: "ca-5", habilidade: "Multiplicação", cena: "Mangue · guarás",
        enunciado: "No mangue pousaram 4 bandos de guarás, cada um com 6 guarás. Quantos guarás voltaram?",
        opcoes: ["10", "24", "20"], correta: 1,
        dica: "São 4 grupos iguais de 6: 6 + 6 + 6 + 6.",
        explica: "4 × 6 = 24 guarás.",
        diagnostico: { 0: "Somou 4 + 6: ainda não entende grupos iguais.", 2: "Errou a tabuada do 4." },
      },
      {
        id: "ca-6", habilidade: "Multiplicação", cena: "Sotaque de matraca",
        enunciado: "Cada brincante toca com 2 matracas, uma em cada mão. São 9 brincantes. Quantas matracas?",
        opcoes: ["11", "18", "16"], correta: 1,
        dica: "9 brincantes, 2 matracas cada: 9 vezes 2.",
        explica: "9 × 2 = 18 matracas.",
        diagnostico: { 0: "Somou 9 + 2 em vez de multiplicar.", 2: "Errou a tabuada do 2." },
      },
      {
        id: "ca-7", habilidade: "Divisão", cena: "Bordado do chapéu",
        enunciado: "A bordadeira tem 24 fitas para enfeitar 3 chapéus de brincante, com a mesma quantidade em cada. Quantas fitas em cada chapéu?",
        opcoes: ["6", "8", "12"], correta: 1,
        dica: "Reparta 24 em 3 partes iguais.",
        explica: "24 ÷ 3 = 8 fitas em cada chapéu.",
        diagnostico: { 0: "Errou a divisão.", 2: "Dividiu por 2 em vez de 3." },
      },
      {
        id: "ca-8", habilidade: "Divisão", cena: "Barraca de bolo",
        enunciado: "A tia da barraca repartiu 20 pedaços de bolo de tapioca em 4 pratos iguais. Quantos pedaços em cada prato?",
        opcoes: ["5", "16", "4"], correta: 0,
        dica: "Repartir em pratos iguais é dividir: 20 ÷ 4.",
        explica: "20 ÷ 4 = 5 pedaços em cada prato.",
        diagnostico: { 1: "Tirou 4 em vez de dividir.", 2: "Confundiu o número de pratos com a resposta." },
      },
      {
        id: "ca-9", habilidade: "Dinheiro e troco", cena: "Duas compras",
        enunciado: "O Kambadinha comprou um suco de juçara de R$ 4 e uma pamonha de R$ 3. Pagou com R$ 10. Qual é o troco?",
        opcoes: ["R$ 3", "R$ 7", "R$ 1"], correta: 0,
        dica: "Primeiro some as duas compras; depois tire de R$ 10.",
        explica: "4 + 3 = 7; 10 − 7 = 3. O troco é R$ 3.",
        diagnostico: { 1: "Esqueceu uma das compras (fez só 10 − 3).", 2: "Errou a conta em uma das etapas." },
      },
      {
        id: "ca-10", habilidade: "Multiplicação", cena: "Entrada do arraial",
        enunciado: "A entrada do arraial da escola custa R$ 2 por criança. Quanto pagam 6 crianças?",
        opcoes: ["R$ 8", "R$ 12", "R$ 3"], correta: 1,
        dica: "6 crianças, R$ 2 cada: 6 vezes 2.",
        explica: "6 × 2 = R$ 12.",
        diagnostico: { 0: "Somou 6 + 2.", 2: "Dividiu em vez de multiplicar." },
      },
    ],
  },
  {
    id: "feira-da-jucara",
    titulo: "Feira da Juçara",
    emoji: "🫐",
    disciplina: "Matemática",
    etapa: "f2",
    resumo: "Proporção, regra de três e porcentagem na barraca e no bordado do boi.",
    questoes: [
      {
        id: "fj-1", habilidade: "Regra de três", cena: "Barraca da juçara",
        enunciado: "Com 2 kg de juçara a barraca faz 6 litros de suco. Para a festa, precisa de 15 litros. Quantos quilos de juçara?",
        opcoes: ["4 kg", "5 kg", "7,5 kg"], correta: 1,
        dica: "Quantos litros saem de 1 kg? Depois veja quantos quilos dão 15 litros.",
        explica: "1 kg rende 3 litros; 15 ÷ 3 = 5 kg.",
        diagnostico: { 0: "Errou a conta da proporção.", 2: "Confundiu a relação entre quilos e litros (fez 15 ÷ 2)." },
      },
      {
        id: "fj-2", habilidade: "Proporção", cena: "Doce de buriti",
        enunciado: "A receita leva 3 xícaras de açúcar para cada 2 de polpa de buriti. Com 8 xícaras de polpa, quanto de açúcar?",
        opcoes: ["11", "12", "16"], correta: 1,
        dica: "8 xícaras de polpa são quantas vezes 2?",
        explica: "8 ÷ 2 = 4 vezes a receita; 4 × 3 = 12 xícaras de açúcar.",
        diagnostico: { 0: "Somou 3 em vez de multiplicar: erro aditivo, o mais comum em proporção.", 2: "Dobrou a polpa em vez de aplicar a razão 3 : 2." },
      },
      {
        id: "fj-3", habilidade: "Porcentagem", cena: "Camisa do boi",
        enunciado: "A camisa do bumba-meu-boi custava R$ 80 e entrou com 25% de desconto no arraial. Quanto ficou?",
        opcoes: ["R$ 55", "R$ 60", "R$ 65"], correta: 1,
        dica: "25% é a quarta parte. Quanto é a quarta parte de 80?",
        explica: "25% de 80 = 20; 80 − 20 = R$ 60.",
        diagnostico: { 0: "Tirou R$ 25 em vez de 25%.", 2: "Calculou o desconto errado." },
      },
      {
        id: "fj-4", habilidade: "Porcentagem", cena: "Grupo de matraca",
        enunciado: "Dos 40 brincantes de um grupo, 30% tocam matraca. Quantos tocam matraca?",
        opcoes: ["12", "30", "10"], correta: 0,
        dica: "10% de 40 é 4. E 30%?",
        explica: "10% de 40 = 4; 30% = 3 × 4 = 12 brincantes.",
        diagnostico: { 1: "Confundiu a porcentagem com a quantidade.", 2: "Calculou 25% em vez de 30%." },
      },
      {
        id: "fj-5", habilidade: "Frações", cena: "Barraca da pamonha",
        enunciado: "A barraca vendeu três quartos das 20 pamonhas que fez. Quantas pamonhas foram vendidas?",
        opcoes: ["15", "5", "12"], correta: 0,
        dica: "Um quarto de 20 é 5. Três quartos?",
        explica: "20 ÷ 4 = 5; 3 × 5 = 15 pamonhas.",
        diagnostico: { 1: "Calculou só um quarto (o que sobrou).", 2: "Errou a fração." },
      },
      {
        id: "fj-6", habilidade: "Regra de três", cena: "Bordado do couro do boi",
        enunciado: "4 bordadeiras bordam o couro de um boi em 12 dias. No mesmo ritmo, em quantos dias 6 bordadeiras bordam?",
        opcoes: ["8 dias", "18 dias", "10 dias"], correta: 0,
        dica: "Mais gente bordando: o tempo aumenta ou diminui?",
        explica: "É inversa: 4 × 12 = 48 dias de trabalho; 48 ÷ 6 = 8 dias.",
        diagnostico: { 1: "Usou proporção direta: mais gente não aumenta o tempo.", 2: "Errou a conta da inversa." },
      },
      {
        id: "fj-7", habilidade: "Proporção", cena: "Mapa da Ilha",
        enunciado: "No mapa da Ilha, 1 cm vale 2 km. Dois arraiais estão a 7 cm no mapa. Qual é a distância real?",
        opcoes: ["14 km", "9 km", "3,5 km"], correta: 0,
        dica: "Cada centímetro vale 2 km. Quantos km valem 7 cm?",
        explica: "7 × 2 = 14 km.",
        diagnostico: { 1: "Somou 7 + 2 em vez de multiplicar.", 2: "Dividiu em vez de multiplicar." },
      },
      {
        id: "fj-8", habilidade: "Porcentagem", cena: "Diária da barraca",
        enunciado: "A diária da barraca era R$ 50 e subiu 10%. Quanto ficou?",
        opcoes: ["R$ 55", "R$ 60", "R$ 51"], correta: 0,
        dica: "10% de 50 é 5.",
        explica: "50 + 5 = R$ 55.",
        diagnostico: { 1: "Somou R$ 10 em vez de 10%.", 2: "Somou 1% em vez de 10%." },
      },
    ],
  },
  {
    id: "palavras-da-festa",
    titulo: "Palavras da Festa",
    emoji: "📝",
    disciplina: "Português",
    etapa: "f1",
    resumo: "Fala e escrita, ortografia e leitura de cena com o Kambadinha.",
    questoes: [
      {
        id: "pf-1", habilidade: "Fala e escrita", cena: "Kambadinha conversando",
        enunciado: "Kambadinha: “Nóis vai pro arraial hoje!” Na conversa, tudo bem. Como fica na redação?",
        opcoes: ["Nóis vai ao arraial.", "Nós vamos ao arraial.", "Nós vai ao arraial."], correta: 1,
        dica: "Na escrita formal, o verbo combina com “nós”.",
        explica: "“Nós vamos.” A fala do dia a dia não está errada: a escrita formal é que tem outra regra.",
        diagnostico: { 0: "Ainda escreve como fala.", 2: "Acertou o pronome, mas não a concordância." },
      },
      {
        id: "pf-2", habilidade: "Ortografia", cena: "Placa do arraial",
        enunciado: "O Kambadinha escreveu na placa: “Entrada grátis para criansa.” Qual é a escrita certa?",
        opcoes: ["criança", "criãça", "criansça"], correta: 0,
        dica: "O som de “s” antes do “a”, nessa palavra, vem com ç.",
        explica: "Criança, com ç.",
        diagnostico: { 1: "Confunde o til com o n.", 2: "Sabe que leva ç, mas ainda mistura com s." },
      },
      {
        id: "pf-3", habilidade: "Leitura e interpretação", cena: "Quadrinho do boi",
        enunciado: "No quadrinho: “O tambor parou. O boi deitou no chão e a plateia ficou em silêncio.” O que está acontecendo?",
        opcoes: ["O boi cansou e dormiu.", "Faz parte do auto: o boi morre e depois renasce.", "A festa acabou."], correta: 1,
        dica: "Lembre da história do bumba-meu-boi: o que acontece com o boi?",
        explica: "No auto do bumba-meu-boi, o boi morre e depois renasce, e a festa recomeça.",
        diagnostico: { 0: "Leu só a superfície da cena.", 2: "Não usou o contexto da festa." },
      },
      {
        id: "pf-4", habilidade: "Ortografia", cena: "Mangue",
        enunciado: "Qual palavra está escrita certo?",
        opcoes: ["caranguejo", "carangueijo", "caranquejo"], correta: 0,
        dica: "Fale devagar: ca-ran-gue-jo. Tem “i”?",
        explica: "Caranguejo, sem “i”. Muita gente fala “carangueijo”, mas escreve-se caranguejo.",
        diagnostico: { 1: "Escreve como fala (“carangueijo”).", 2: "Troca gu por qu." },
      },
      {
        id: "pf-5", habilidade: "Concordância", cena: "Fim de tarde no mangue",
        enunciado: "Complete: “Os guarás ___ no mangue ao entardecer.”",
        opcoes: ["chega", "chegam", "chegou"], correta: 1,
        dica: "São vários guarás. O verbo vai para o plural.",
        explica: "Os guarás chegam: plural com plural.",
        diagnostico: { 0: "Não concordou o verbo com o plural.", 2: "Trocou o tempo do verbo." },
      },
      {
        id: "pf-6", habilidade: "Leitura e interpretação", cena: "Jeito de falar daqui",
        enunciado: "O Kambadinha disse: “Éguas, que festa bonita!” O que “éguas” quer dizer nessa frase?",
        opcoes: ["Ele viu cavalos na festa.", "É uma expressão de espanto, bem do Maranhão.", "Ele está bravo."], correta: 1,
        dica: "Ele está falando de um animal ou mostrando o que sentiu?",
        explica: "“Éguas!” é uma expressão de surpresa, muito usada no Maranhão e no Pará.",
        diagnostico: { 0: "Leu ao pé da letra.", 2: "Não identificou o sentimento da frase." },
      },
      {
        id: "pf-7", habilidade: "Ortografia", cena: "Doce de buriti",
        enunciado: "Na barraca tinha uma ___ de doce de buriti.",
        opcoes: ["caixa", "caicha", "cacha"], correta: 0,
        dica: "Depois de “ai”, o som de “ch” costuma ser escrito com x.",
        explica: "Caixa, com x.",
        diagnostico: { 1: "Confunde x com ch.", 2: "Esqueceu o “i” e trocou o x." },
      },
      {
        id: "pf-8", habilidade: "Pontuação", cena: "Conversa no arraial",
        enunciado: "Qual destas frases é uma pergunta?",
        opcoes: ["O boi dançou na praça.", "O boi vai dançar hoje?", "Que boi bonito!"], correta: 1,
        dica: "Procure o ponto de interrogação.",
        explica: "“O boi vai dançar hoje?” termina com ponto de interrogação.",
        diagnostico: { 0: "Não diferencia afirmação de pergunta.", 2: "Confundiu exclamação com pergunta." },
      },
    ],
  },
  {
    id: "leitura-do-auto",
    titulo: "Leitura do Auto",
    emoji: "📖",
    disciplina: "Português",
    etapa: "f2",
    resumo: "Variação linguística, figuras de linguagem e interpretação do auto do boi.",
    questoes: [
      {
        id: "la-1", habilidade: "Variação linguística", cena: "Fala de São Luís",
        enunciado: "Na fala de São Luís, “Éguas!” e “Rapaz…!” são exemplos de:",
        opcoes: ["erros de português.", "variação linguística regional.", "gírias proibidas em qualquer texto."], correta: 1,
        dica: "Um jeito de falar de uma região é erro ou é variação?",
        explica: "É variação linguística regional: adequada na conversa, e a norma-padrão é usada nos textos formais.",
        diagnostico: { 0: "Ainda vê a fala regional como erro.", 2: "Não diferencia adequação de proibição." },
      },
      {
        id: "la-2", habilidade: "Leitura e interpretação", cena: "Auto do bumba-meu-boi",
        enunciado: "No auto, Catirina, grávida, deseja comer a língua do boi, e Pai Francisco mata o boi para atender o desejo. Qual é o conflito que move a história?",
        opcoes: ["A morte do boi de estimação do amo.", "A festa de São João.", "A chegada dos guarás."], correta: 0,
        dica: "O que deixa o amo, dono da fazenda, contra Pai Francisco?",
        explica: "O conflito é a morte do boi de estimação do amo. Depois o boi renasce e a festa celebra.",
        diagnostico: { 1: "Confundiu o enredo com o contexto da festa.", 2: "Não leu o enunciado com atenção." },
      },
      {
        id: "la-3", habilidade: "Figuras de linguagem", cena: "Roda de tambor",
        enunciado: "“O tambor conversa com o coração da gente.” Que figura de linguagem aparece?",
        opcoes: ["Personificação (prosopopeia)", "Comparação", "Onomatopeia"], correta: 0,
        dica: "Tambor conversa? Quem costuma conversar?",
        explica: "Personificação: o tambor ganha uma ação de gente (conversar).",
        diagnostico: { 1: "Procurou um “como” que não existe na frase.", 2: "Confundiu com imitação de som." },
      },
      {
        id: "la-4", habilidade: "Figuras de linguagem", cena: "Sotaque de matraca",
        enunciado: "“Tec-tec-tec, as matracas não param!” O “tec-tec-tec” é:",
        opcoes: ["onomatopeia.", "metáfora.", "antítese."], correta: 0,
        dica: "A palavra imita um som.",
        explica: "Onomatopeia: a palavra imita o som das matracas.",
        diagnostico: { 1: "Ainda confunde as figuras.", 2: "Ainda confunde as figuras." },
      },
      {
        id: "la-5", habilidade: "Concordância", cena: "Apresentação do grupo",
        enunciado: "Qual frase está de acordo com a norma-padrão?",
        opcoes: ["Fazem dois anos que o grupo se apresenta.", "Faz dois anos que o grupo se apresenta.", "Fazem dois ano que o grupo se apresenta."], correta: 1,
        dica: "O verbo “fazer” indicando tempo passado fica no singular.",
        explica: "“Faz dois anos”: indicando tempo, “fazer” é impessoal e fica no singular.",
        diagnostico: { 0: "Flexionou o verbo “fazer” indicando tempo.", 2: "Errou também a concordância do substantivo." },
      },
      {
        id: "la-6", habilidade: "Leitura e interpretação", cena: "O boi renasce",
        enunciado: "No auto, o boi “morre” e “renasce”. Para quem brinca, isso costuma representar:",
        opcoes: ["um erro do enredo.", "renovação e celebração da comunidade.", "uma tragédia sem final."], correta: 1,
        dica: "Como a festa termina: triste ou em celebração?",
        explica: "O renascimento do boi fecha o auto em festa: renovação e celebração.",
        diagnostico: { 0: "Leu ao pé da letra.", 2: "Não considerou o desfecho." },
      },
    ],
  },
  {
    id: "kambadinha-in-english",
    titulo: "Kambadinha in English",
    emoji: "🗣️",
    disciplina: "Inglês",
    etapa: "f1",
    resumo: "Verb to be, cores, números e o vocabulário da festa.",
    questoes: [
      {
        id: "en-1", habilidade: "Verb to be", cena: "Kambadinha talking",
        enunciado: "Kambadinha: “I is happy at the arraial!” Será que ele falou certo?",
        opcoes: ["I is happy.", "I am happy.", "I are happy."], correta: 1,
        dica: "Com “I”, o verbo to be é sempre o mesmo.",
        explica: "I am happy. “I” sempre vai com “am”.",
        diagnostico: { 0: "Sabe que precisa do verbo, mas ainda não conjuga (I is).", 2: "Sabe que precisa do verbo, mas ainda não conjuga (I are)." },
      },
      {
        id: "en-2", habilidade: "Verb to be", cena: "The mangrove",
        enunciado: "The guarás ___ red, and they live in the mangrove.",
        opcoes: ["is", "am", "are"], correta: 2,
        dica: "“The guarás” são vários: they.",
        explica: "They are: os guarás são vermelhos.",
        diagnostico: { 0: "Usou o singular com sujeito plural.", 1: "Usou “am”, que é só para “I”." },
      },
      {
        id: "en-3", habilidade: "Vocabulário", cena: "The party",
        enunciado: "Which one is a drum?",
        opcoes: ["Matraca", "Tambor", "Chapéu"], correta: 1,
        dica: "Drum faz “tum-tum”.",
        explica: "Drum = tambor.",
        diagnostico: { 0: "Confundiu os instrumentos.", 2: "Ainda não conhece a palavra." },
      },
      {
        id: "en-4", habilidade: "Cores e números", cena: "The mangrove",
        enunciado: "The guará is ___. (vermelho)",
        opcoes: ["blue", "red", "green"], correta: 1,
        dica: "Vermelho em inglês tem só três letras.",
        explica: "Red = vermelho. The guará is red.",
        diagnostico: { 0: "Ainda não fixou as cores.", 2: "Ainda não fixou as cores." },
      },
      {
        id: "en-5", habilidade: "Cores e números", cena: "Counting matracas",
        enunciado: "Kambadinha has 3 matracas. How do you write 3 in English?",
        opcoes: ["two", "three", "tree"], correta: 1,
        dica: "Cuidado: uma das opções é “árvore”.",
        explica: "Three = 3. Tree = árvore.",
        diagnostico: { 0: "Confundiu os números.", 2: "Confundiu three (3) com tree (árvore)." },
      },
      {
        id: "en-6", habilidade: "Plural", cena: "The mangrove",
        enunciado: "One crab, two ___.",
        opcoes: ["crab", "crabs", "crabes"], correta: 1,
        dica: "Na maioria das palavras, o plural ganha só um “s”.",
        explica: "Crabs: crab + s.",
        diagnostico: { 0: "Não fez o plural.", 2: "Aplicou a regra do plural do português." },
      },
      {
        id: "en-7", habilidade: "Vocabulário", cena: "The party",
        enunciado: "What is “festa” in English?",
        opcoes: ["party", "forest", "fish"], correta: 0,
        dica: "Birthday ___ = festa de aniversário.",
        explica: "Party = festa.",
        diagnostico: { 1: "Confundiu pelo som parecido.", 2: "Ainda não conhece a palavra." },
      },
      {
        id: "en-8", habilidade: "Verb to be", cena: "Kambadinha",
        enunciado: "Kambadinha ___ a crab.",
        opcoes: ["is", "are", "am"], correta: 0,
        dica: "Kambadinha é “he”. He ___.",
        explica: "He is: Kambadinha is a crab.",
        diagnostico: { 1: "Ainda não conjuga he/she/it is.", 2: "Ainda não conjuga he/she/it is." },
      },
    ],
  },
];

export function trilhaPorId(id: unknown): Trilha | undefined {
  return typeof id === "string" ? TRILHAS.find((t) => t.id === id) : undefined;
}

export function trilhasDaEtapa(etapa: Etapa): Trilha[] {
  return TRILHAS.filter((t) => t.etapa === etapa);
}

export function publica(t: Trilha): TrilhaPublica {
  return { id: t.id, titulo: t.titulo, emoji: t.emoji, disciplina: t.disciplina, etapa: t.etapa, resumo: t.resumo, total: t.questoes.length };
}

/** Habilidades de uma disciplina, na ordem em que aparecem nas trilhas. */
export function habilidades(disciplina?: string, etapa?: Etapa): string[] {
  const vistas: string[] = [];
  for (const t of TRILHAS) {
    if (disciplina && t.disciplina !== disciplina) continue;
    if (etapa && t.etapa !== etapa) continue;
    for (const q of t.questoes) if (!vistas.includes(q.habilidade)) vistas.push(q.habilidade);
  }
  return vistas;
}

export function questaoPorId(id: string): { trilha: Trilha; questao: Questao } | undefined {
  for (const trilha of TRILHAS) {
    const questao = trilha.questoes.find((q) => q.id === id);
    if (questao) return { trilha, questao };
  }
  return undefined;
}
