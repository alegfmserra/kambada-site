import { assinar, verificar } from "./seguranca";
import { hojeEmSaoLuis } from "../../cupons/cupons";

/**
 * Palavra do dia maranhense (somente servidor) — estilo Termo, 6 tentativas.
 *
 * A palavra do dia sai da data de São Luís; o navegador nunca a recebe antes de
 * a partida acabar. Cada palpite é conferido aqui e só as cores voltam. O
 * estado da partida (palpites já feitos) viaja assinado, como no quiz.
 *
 * Lista inicial de 5 letras: `revisado` só vira true depois que mestres e
 * brincantes conferirem significado e exemplo (regra de todo texto do Play).
 */

export const TAMANHO = 5;
export const TENTATIVAS = 6;

export type Palavra = {
  /** Como se escreve (com acento). */
  palavra: string;
  significado: string;
  exemplo: string;
  revisado: boolean;
  /** Data fixa (AAAA-MM-DD, São Luís): nesse dia é esta palavra; fora dela, não entra no rodízio. */
  dia?: string;
};

export const BANCO: Palavra[] = [
  { palavra: "ÉGUAS", significado: "Exclamação maranhense de surpresa, espanto ou admiração; serve para quase tudo.", exemplo: "Éguas, que calor é esse!", revisado: false },
  // 20/11, Dia da Consciência Negra: palavra do tambor de crioula, manifestação de matriz africana.
  { palavra: "PUNGA", significado: "A umbigada do tambor de crioula: o toque de barriga com que a dançarina convida outra para o meio da roda.", exemplo: "Ela deu a punga e a roda inteira vibrou.", revisado: false, dia: "2026-11-20" },
  // Novembro é o mês do Tambor de Crioula: as primeiras do rodízio são dele.
  { palavra: "SAIAS", significado: "As saias rodadas e coloridas das coreiras, que giram no tambor de crioula.", exemplo: "As saias rodaram forte quando os tambores esquentaram.", revisado: false },
  { palavra: "COURO", significado: "A pele esticada do tambor, que dá o som; também o couro bordado que veste o boi.", exemplo: "O tambor foi aquecido na fogueira para o couro ficar firme.", revisado: false },
  { palavra: "DANÇA", significado: "Movimento ao ritmo da música. No tambor de crioula, as coreiras dançam em roda, uma de cada vez.", exemplo: "A dança só termina quando o último tambor cala.", revisado: false },
  { palavra: "TOADA", significado: "A canção do bumba-meu-boi. Cada grupo tem as suas, e o amo é quem puxa.", exemplo: "O amo puxou a toada e o terreiro respondeu.", revisado: false },
  { palavra: "COCAL", significado: "Mata de palmeiras, sobretudo de babaçu. Dá nome à região dos Cocais, no Maranhão e no Piauí.", exemplo: "A quebradeira de coco trabalha no cocal desde cedo.", revisado: false },
  { palavra: "BEIJU", significado: "Massa de tapioca ou de mandioca assada em forma de disco fino, comida do café da manhã.", exemplo: "No café teve beiju com manteiga.", revisado: false },
  { palavra: "FITAS", significado: "Tiras coloridas que enfeitam o chapéu do vaqueiro e o boi nas festas juninas.", exemplo: "O chapéu dele estava coberto de fitas de todas as cores.", revisado: false },
  { palavra: "CANOA", significado: "Barco pequeno e estreito, movido a remo ou a vela, muito usado nos rios e baías do Maranhão.", exemplo: "Atravessamos a baía de canoa.", revisado: false },
  { palavra: "PIRÃO", significado: "Papa feita com o caldo do peixe e farinha de mandioca; acompanha peixe e carne.", exemplo: "Pirão quentinho com peixe frito não tem erro.", revisado: false },
  { palavra: "GUARÁ", significado: "Ave de plumagem vermelho-vivo que habita os manguezais do litoral maranhense.", exemplo: "No fim da tarde, os guarás cobrem o céu do mangue de vermelho.", revisado: false },
  { palavra: "LENDA", significado: "História tradicional contada de geração em geração, com parte de fato e parte de encanto.", exemplo: "Dizem que a lenda da serpente vem do tempo dos antigos.", revisado: false },
  { palavra: "FUZUÊ", significado: "Confusão alegre ou festa barulhenta, com muita gente e muito movimento.", exemplo: "Foi um fuzuê no arraial quando o boi chegou.", revisado: false },
  { palavra: "DENGO", significado: "Carinho, manha, graça no jeito de ser; também o ato de mimar alguém.", exemplo: "A vovó enche o neto de dengo.", revisado: false },
  { palavra: "ARROZ", significado: "Cereal base da mesa maranhense. O arroz de cuxá, feito com vinagreira, é o prato mais conhecido do estado.", exemplo: "Domingo é dia de arroz de cuxá na casa da família.", revisado: false },
  { palavra: "FORRÓ", significado: "Festa dançante e também o ritmo nordestino de sanfona, zabumba e triângulo.", exemplo: "O forró de ontem só acabou de manhã.", revisado: false },
  { palavra: "VIOLA", significado: "Instrumento de cordas, parente do violão, presente em cantorias e festas populares.", exemplo: "O repentista afinou a viola e começou o verso.", revisado: false },
  { palavra: "BREJO", significado: "Terreno baixo e encharcado, de terra úmida, onde a água fica empoçada.", exemplo: "O gado desceu até o brejo para beber.", revisado: false },
  { palavra: "RITMO", significado: "A batida que organiza o som e a dança. Cada sotaque do bumba-meu-boi tem o seu.", exemplo: "O ritmo da matraca acelera quando o boi entra na roda.", revisado: false },
  { palavra: "TERNO", significado: "Conjunto de pessoas que formam um grupo cantado ou dançado; também o traje completo.", exemplo: "O terno de reis saiu cantando de casa em casa.", revisado: false },
  { palavra: "BUMBA", significado: "A palavra que abre o nome do bumba-meu-boi, a brincadeira mais conhecida das festas juninas do Maranhão.", exemplo: "No São João, o bumba chega com o boi, o amo e os vaqueiros.", revisado: false },
  { palavra: "FOLIA", significado: "Festa animada, com música, dança e muita gente reunida.", exemplo: "A folia do arraial varou a madrugada.", revisado: false },
  { palavra: "BAIÃO", significado: "Ritmo nordestino de sanfona e zabumba; também o nome do baião de dois, prato de arroz com feijão.", exemplo: "Teve baião de dois e baião de viola na festa.", revisado: false },
  { palavra: "MARÉS", significado: "O sobe e desce do mar. As marés de São Luís estão entre as maiores do Brasil e mudam o desenho da praia.", exemplo: "Com as marés de lua cheia, a água invade a praia toda.", revisado: false },
  { palavra: "CHITA", significado: "Tecido de algodão estampado de flores, símbolo das festas juninas e das roupas de quadrilha.", exemplo: "O vestido de chita rodou no meio do arraial.", revisado: false },
  { palavra: "PALHA", significado: "Fibra seca de palmeira, como o buriti e o babaçu, usada em chapéus, esteiras e cestos.", exemplo: "O chapéu de palha protege do sol da roça.", revisado: false },
  { palavra: "SANTO", significado: "Figura de devoção. Em junho se festejam Santo Antônio, São João, São Pedro e São Marçal.", exemplo: "Cada santo de junho tem a sua fogueira e a sua festa.", revisado: false },
  { palavra: "FAROL", significado: "Torre com luz que guia os barcos. O Farol de São Marcos fica na costa de São Luís.", exemplo: "Do farol se vê a entrada da baía.", revisado: false },
  { palavra: "MANGA", significado: "Fruta de polpa doce e suculenta, muito comum nos quintais de São Luís.", exemplo: "A mangueira do quintal carrega manga o ano todo.", revisado: false },
  { palavra: "BRABO", significado: "Forte, intenso; no falar nordestino também vale como elogio.", exemplo: "Esse tambor é brabo, não deixa ninguém parado.", revisado: false },
  { palavra: "CANTO", significado: "A voz que conduz a brincadeira: no boi, é o amo quem puxa o canto.", exemplo: "O canto do amo atravessou o terreiro.", revisado: false },
  { palavra: "PRETO", significado: "A cor do boi mais tradicional de muitos grupos, coberto de bordados de miçangas e canutilhos.", exemplo: "O boi preto brilhou de estrelas bordadas.", revisado: false },
  { palavra: "FESTA", significado: "Dia de encontro, com comida, música e dança. No Maranhão, o calendário de festas do ano é longo.", exemplo: "A festa de São Marçal reúne bois de várias partes da ilha.", revisado: false },
  { palavra: "TRAJE", significado: "A roupa que o grupo veste para se apresentar, pensada nas cores e no tema da brincadeira.", exemplo: "O traje novo da turma foi bordado à mão.", revisado: false },
];

/** Tira acentos e deixa só A–Z maiúsculo: é assim que palpite e palavra são comparados. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/** Em produção, só palavras revisadas, a não ser que `PLAY_PALAVRAS_NAO_REVISADAS=1`. */
export function palavrasAtivas(): Palavra[] {
  const liberarTudo = process.env.NODE_ENV !== "production" || process.env.PLAY_PALAVRAS_NAO_REVISADAS === "1";
  return BANCO.filter((p) => (liberarTudo || p.revisado) && normalizar(p.palavra).length === TAMANHO);
}

const DIA_MS = 24 * 60 * 60 * 1000;
/** Dia 1 do jogo (AAAA-MM-DD, São Luís). */
export const DIA_UM = "2026-11-01";

/** Dias desde o dia 1 do jogo, mais 1 (negativo ou zero antes do lançamento). */
function indiceDoDia(dia: string): number {
  return Math.floor((Date.parse(`${dia}T00:00:00Z`) - Date.parse(`${DIA_UM}T00:00:00Z`)) / DIA_MS) + 1;
}

/** Número da edição ("Palavra do dia #N"); antes do lançamento fica em 1 só na tela. */
export function numeroDaEdicao(dia: string): number {
  return Math.max(1, indiceDoDia(dia));
}

/** Palavra do dia: percorre a lista na ordem, sem repetir até acabar. */
export function palavraDoDia(dia: string, lista: Palavra[] = palavrasAtivas()): Palavra | null {
  const fixa = lista.find((p) => p.dia === dia);
  if (fixa) return fixa;
  const rodizio = lista.filter((p) => !p.dia);
  if (rodizio.length === 0) return null;
  // Dia de palavra fixa não gasta uma vez do rodízio: o contador só anda nos dias comuns.
  const fixasAntes = lista.filter((p) => p.dia && p.dia >= DIA_UM && p.dia < dia).length;
  // Antes do lançamento o índice anda para trás (dias de pré-visualização), para a palavra girar todo dia.
  const n = indiceDoDia(dia) - fixasAntes;
  return rodizio[((n - 1) % rodizio.length + rodizio.length) % rodizio.length];
}

export type Cor = "certa" | "lugar" | "nao";

/** Cores de um palpite, tratando letras repetidas como o Termo: a certa tem prioridade e cada letra da resposta vale uma vez. */
export function avaliar(palpite: string, resposta: string): Cor[] {
  const p = normalizar(palpite).split("");
  const r = normalizar(resposta).split("");
  const cores: Cor[] = p.map(() => "nao");
  const sobra: Record<string, number> = {};
  p.forEach((l, i) => {
    if (l === r[i]) cores[i] = "certa";
    else sobra[r[i]] = (sobra[r[i]] ?? 0) + 1;
  });
  p.forEach((l, i) => {
    if (cores[i] === "certa") return;
    if ((sobra[l] ?? 0) > 0) {
      cores[i] = "lugar";
      sobra[l] -= 1;
    }
  });
  return cores;
}

// --- Partida ---------------------------------------------------------------

type EstadoPalavra = { v: 1; jogo: "palavra"; dia: string; palpites: string[] };

export type LinhaPalpite = { palpite: string; cores: Cor[] };

export type RespostaPalavra = {
  ok: true;
  dia: string;
  edicao: number;
  linhas: LinhaPalpite[];
  /** Estado assinado, para enviar junto do próximo palpite. */
  estado: string;
  situacao: "jogando" | "ganhou" | "perdeu";
  /** Só quando a partida acaba. */
  revelacao?: { palavra: string; significado: string; exemplo: string };
};

function montar(estado: EstadoPalavra, alvo: Palavra): RespostaPalavra {
  const linhas = estado.palpites.map((p) => ({ palpite: p, cores: avaliar(p, alvo.palavra) }));
  const ganhou = estado.palpites.some((p) => normalizar(p) === normalizar(alvo.palavra));
  const perdeu = !ganhou && estado.palpites.length >= TENTATIVAS;
  const situacao = ganhou ? "ganhou" : perdeu ? "perdeu" : "jogando";
  return {
    ok: true,
    dia: estado.dia,
    edicao: numeroDaEdicao(estado.dia),
    linhas,
    estado: assinar(estado),
    situacao,
    revelacao: situacao === "jogando" ? undefined : { palavra: alvo.palavra, significado: alvo.significado, exemplo: alvo.exemplo },
  };
}

export type ErroPalavra = { ok: false; mensagem: string };

/** Abre (ou retoma) a partida do dia. */
export function iniciarDoDia(agora = new Date()): RespostaPalavra | ErroPalavra {
  const dia = hojeEmSaoLuis(agora);
  const alvo = palavraDoDia(dia);
  if (!alvo) return { ok: false, mensagem: "A palavra do dia ainda não foi liberada." };
  return montar({ v: 1, jogo: "palavra", dia, palpites: [] }, alvo);
}

/** Confere um palpite contra a palavra do dia. */
export function palpitar(tokenEstado: unknown, palpiteBruto: unknown, agora = new Date()): RespostaPalavra | ErroPalavra {
  const estado = verificar<EstadoPalavra>(tokenEstado);
  if (!estado || estado.v !== 1 || estado.jogo !== "palavra") return { ok: false, mensagem: "Partida inválida. Recarregue a página." };
  if (estado.dia !== hojeEmSaoLuis(agora)) return { ok: false, mensagem: "Virou o dia! Recarregue para ver a palavra nova." };
  const alvo = palavraDoDia(estado.dia);
  if (!alvo) return { ok: false, mensagem: "A palavra do dia ainda não foi liberada." };
  const jaAcabou = estado.palpites.length >= TENTATIVAS || estado.palpites.some((p) => normalizar(p) === normalizar(alvo.palavra));
  if (jaAcabou) return { ok: false, mensagem: "A partida de hoje já acabou." };
  const palpite = typeof palpiteBruto === "string" ? normalizar(palpiteBruto) : "";
  if (palpite.length !== TAMANHO) return { ok: false, mensagem: `Digite uma palavra de ${TAMANHO} letras.` };
  return montar({ ...estado, palpites: [...estado.palpites, palpite] }, alvo);
}
