/**
 * Descrição curta de cada produto, pronta para o Bling (e, por ele, para o site).
 *
 * Origem: rascunho do Fred (11/10/2026) revisado pela Wilsonira em 13/10/2026
 * ("Kambada_Descricoes - AJUSTES.docx"). Tudo que ela respondeu entrou; o que
 * ela disse não saber saiu do texto, em vez de ficar inventado.
 *
 * Formato: história em um parágrafo, linha em branco, ficha linha a linha.
 * O site mostra como texto (ver limparDescricao); o Bling guarda como veio.
 *
 * Ficaram de fora, de propósito, por falta de fonte: Livro Trilíngue (ficha).
 * Pontos em que a contagem do ateliê diverge do cadastro do Bling estão em
 * `DIVERGENCIAS` — não mudam o texto, mas precisam de decisão do Alexandre.
 */

const ADULTO = "Medidas (busto × comprimento): P 50×71 · M 51×72 · G 57×73 · GG 60×75 · XG 64×80 cm.";
const ALGODAO = "Material: 100% algodão, gola redonda, manga curta, estampa em silk.";
const SEM_ALVEJANTE = "Cuidados: não usar alvejante.";
const ECOBAG_MAT = "Material: algodão cru, estampa em silk, fechamento em velcro.";
const ECOBAG_CUIDADO = "Cuidados: lavável; não usar alvejante.";
const BONE_MAT = "Material: brim, aba curva, fechamento ajustável com fivela.";
const PAREO_MAT = "Material: 90% poliéster e 10% elastano, tecido leve.";
const NECESSAIRE_MAT = "Material: algodão cru, estampa em silk, fechamento em zíper.";
const MATRACA_CUIDADO = "Cuidados: lugar seco, pano seco.";
const A_MAO = "Feita por encomenda. Pintada à mão, uma por uma: pode variar um pouco da foto.";
const KIT_ITENS =
  "Acompanha: bloco pautado de 40 fls (off set, 20×13,5 cm, capa dura kraft ilustrada), dois lápis, caneta ecológica, régua de madeira, régua plástica, apontador, borracha e post-it.";

const texto = (historia: string, ...ficha: string[]) => [historia, "", ...ficha].join("\n");

export const DESCRICOES: Record<number, string> = {
  // ───────────────── Camisas ─────────────────
  16698811377: texto(
    "São Luís não se visita, se sente. Azulejo na parede, reggae na esquina, casarão que a gente olha de perto e sempre acha um detalhe novo. Esta camisa é a nossa declaração pra Ilha do Amor — pra quem é daqui e pra quem veio, foi embora e ficou com saudade. A estampa reúne elementos da arquitetura e da cultura de São Luís, sobre azul marinho.",
    ALGODAO,
    "Cor: azul marinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698808826: texto(
    "Junho chega e o boi toma conta da Ilha: cor, toada, dança e aquele boi que morre e renasce todo ano, maranhense que só. Aqui ele vem em corte babylook, mais justinho — o Boi no peito, do jeito que a gente gosta, em rosa.",
    "Material: 100% algodão, gola careca, manga curta, estampa em silk.",
    "Cor: rosa.",
    "Medidas (busto × comprimento): P 40×58 · M 40×60 · G 44×62 cm.",
    SEM_ALVEJANTE,
  ),
  16698811730: texto(
    "Tem gente que precisa explicar de onde é. A gente não: é só vestir. \"Maranhense que só\" é o nosso jeito de dizer daqui, de verdade, sem meio-termo — e nesta camisa vinho a frase vem acompanhada do boi, que é quem manda no nosso São João.",
    ALGODAO,
    "Cor: vinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698810433: texto(
    "Olha o boizinho pendurado no fio da matraca! Madeira batendo em madeira, um som que não pede licença — foi uma matraquinha de brinde, no arraial da nossa família, que virou a Kambada. Estampa minimalista, de traço leve, pra quem brinca o Boi e não leva a vida tão a sério.",
    ALGODAO,
    "Cor: vinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698808484: texto(
    "Criança daqui bate matraca antes de aprender a ler. Dança no arraial, pede toada, dorme no colo com o Boi ainda tocando lá fora. Esta camisa é pra esse pequeno brincante: o Bumba Meu Boi no peito, em preto, pra aguentar poeira de arraial e respingo de Guaraná Jesus.",
    ALGODAO,
    "Cor: preta.",
    "Tamanhos: 6, 8, 12 e 14 anos.",
    "Medidas (busto × comprimento): 6 anos 35×46 · 8 anos 36×49 · 12 anos 36×58 · 14 anos 36×60 cm.",
    SEM_ALVEJANTE,
  ),
  16698809408: texto(
    "Quando o Caboclo de Pena entra na roda, a rua inteira abre espaço. Cocar alto, pena colorida, um passo que ninguém ensina — se aprende olhando. É dos personagens mais bonitos do nosso Bumba Meu Boi e aqui vem em ilustração autoral da Kambada, numa camisa salmão pra quem chega chegando.",
    ALGODAO,
    "Cor: salmão.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698814722: texto(
    "Égua, lá vem o Cazumbá! Máscara grande, roupa rodada, e a meninada sai correndo — rindo e voltando pra ver de novo. É a figura mais engraçada e querida do nosso Bumba Meu Boi, e mora nas nossas ilustrações. Aqui, em bege, pra vestir no dia a dia sem perder a graça.",
    ALGODAO,
    "Cor: bege.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698814825: texto(
    "O Cazumbá do tamanho de quem corre dele. Máscara grande, roupa rodada e aquele susto que acaba em risada — a melhor porta de entrada da criança no Boi. Camisa salmão pros pequenos que já sabem que no arraial ninguém fica parado.",
    ALGODAO,
    "Cor: salmão.",
    "Tamanho: 8 anos.",
    "Medidas (busto × comprimento): 8 anos 39×53 cm.",
    SEM_ALVEJANTE,
  ),
  16698815216: texto(
    "Quem é de São Luís cresce ouvindo: a Ilha é encantada. Tem a serpente que dorme embaixo da cidade, a carranca que guarda a proa, a caravela que trouxe gente de longe. A estampa Ilha Encantada junta os três numa arte dourada — e aqui a lenda vem em camisa branca, no tamanho dos pequenos.",
    "Material: 100% algodão, gola redonda, manga curta, estampa em DTF.",
    "Cor: branca.",
    "Tamanhos: 2, 4, 6 e 10 anos.",
    "Medidas (busto × comprimento): 2 anos 32×46 · 4 anos 34×49 · 6 anos 35×51 · 10 anos 38×54 cm.",
    SEM_ALVEJANTE,
  ),
  16698808333: texto(
    "Toda criança da Ilha um dia escuta a avó contar: tem uma serpente dormindo embaixo de São Luís. Ela cresce devagarinho e, no dia em que a cabeça encontrar o rabo... bom, o resto a gente conta em casa, com a luz acesa. A lenda mais famosa da cidade, em camisa off white pros pequenos.",
    ALGODAO,
    "Cor: off white.",
    "Tamanhos: 2, 4, 6, 8 e 10 anos.",
    "Medidas (busto × comprimento): 6 anos 31×50 cm.",
    SEM_ALVEJANTE,
  ),
  16698804685: texto(
    "Lenda é o que a gente conta à noite em São Luís, de voz baixa: a serpente encantada que dorme embaixo da Ilha. Nesta camisa preta ela aparece em traço minimalista — a nossa estampa mais misteriosa.",
    ALGODAO,
    "Cor: preta.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698807702: texto(
    "Chamam São Luís de Jamaica brasileira e não é conversa: aqui o reggae é de bairro, de radiola na praça, de dança agarradinha que ninguém aprende em aula — aprende dançando. A Reggae Roots é pra quem sente o baixo antes de ouvir. Preta, que combina com a noite.",
    ALGODAO,
    "Cor: preta.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698806570: texto(
    "Fim de tarde no litoral maranhense, o céu fica vermelho de guará voltando pra dormir. Quem viu uma vez não esquece; quem não viu, se achega que a gente mostra. A Revoada dos Guarás é a nossa estampa mais querida: fogo sobre fundo claro, em off white ou rosa.",
    ALGODAO,
    "Cores: off white e rosa.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698816511: texto(
    "A revoada de guarás que a gente mais ama, agora em tecido suede: macio no toque, leve no corpo, corte feminino. Pra quem quer o pássaro mais bonito do Maranhão num jeito mais solto — pra sair de tarde, pra ficar em casa, pra qualquer hora da Ilha.",
    "Material: suede, 90% poliéster e 10% elastano, estampa em silk.",
    "Cores: branco e azul.",
    "Medidas (busto × comprimento): M 39×55 · G 41×57 · GG 44×58 cm.",
    SEM_ALVEJANTE,
  ),
  16698816975: texto(
    "Mesma revoada, outro caimento: suede unissex, macio, leve, pra usar sem cerimônia. O guará vermelho do nosso litoral no tecido mais fresquinho da coleção — porque aqui o calor não dá folga e a gente nem reclama.",
    "Material: suede, 90% poliéster e 10% elastano, estampa em silk.",
    "Cor: branca.",
    "Medidas (busto × comprimento): G 50×66 cm.",
    SEM_ALVEJANTE,
  ),
  16698815567: texto(
    "Revoada pequena pra gente pequena. Os guarás, os pássaros vermelhos do litoral do Maranhão, em camisa infantil — a mesma que aparece nas nossas fotos de família, no colo do pai e rindo à toa. Em azul, off white ou rosa, pra escolher a cor do pequeno.",
    ALGODAO,
    "Cores: azul, off white e rosa.",
    "Tamanhos: 2 e 4 anos.",
    "Medidas (busto × comprimento): 4 anos 31×43 cm.",
    SEM_ALVEJANTE,
  ),
  16698816110: texto(
    "A serpente da Ilha contada em pedacinho de cor, igual azulejo de fachada de São Luís. A lenda mais famosa da cidade virou mosaico, e o mosaico virou camisa off white pros pequenos — pra criança levar a história no peito e perguntar em casa como termina.",
    "Material: 100% algodão, gola redonda, manga curta, estampa em DTF.",
    "Cor: off white.",
    "Medidas (busto × comprimento): 4 anos 31×43 cm.",
    SEM_ALVEJANTE,
  ),
  16698814567: texto(
    "Em São Luís sol não é notícia, é rotina — e a gente agradece. O regatão Sol Nosso de Cada Dia traz o sol da Ilha na estampa e é pra esse calor que não pede licença: sem manga, respirando, pra praia, pra praça e pro arraial de tarde.",
    "Material: 100% algodão, estampa em silk.",
    "Cor: off white.",
    "Medidas (busto × comprimento): GG 50×71 cm.",
    SEM_ALVEJANTE,
  ),
  16698802616: texto(
    "Tradição é a estampa que junta a turma toda do Bumba Meu Boi: o boi, os brincantes, a roda que não para. É a camisa que mais aparece nas nossas fotos de família, azul marinho, e a que a gente veste quando quer dizer de onde é sem abrir a boca. Maranhense que só.",
    ALGODAO,
    "Cor: azul marinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16698813505: texto(
    "A linha Tradição, agora em letra. Em vez das figuras do Boi, a palavra — o peso das tradições culturais do Maranhão escrito no peito, em camisa vinho. Mesma raiz, outro jeito de vestir o Maranhão.",
    ALGODAO,
    "Cor: vinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),

  // ───────────────── Matracas ─────────────────
  16698775382: texto(
    "Tá ouvindo? Madeira batendo em madeira, som seco que não pede licença. Uma matraquinha de brinde no arraial da nossa família virou a Kambada. Esta tem suporte: mora na parede o ano todo e desce em junho.",
    "Material: tatajuba (matraca) e pinus (suporte); tintas e verniz à base d'água.",
    "Medidas: matraca 20×10×2 cm · suporte ~35×14 cm · ~805 g.",
    "Acompanha: suporte de parede e cordão.",
    "Estampas: Bandeira do Maranhão, Caboclo de Pena, Leque Bordado, Mosaico Colorido, Serpente e Rei da Ilha, Topo Boi Preto.",
    MATRACA_CUIDADO,
    A_MAO,
  ),
  16698776080: texto(
    "Cem matracas juntas e o chão do arraial treme — é assim o nosso Bumba Meu Boi. Foi uma matraquinha de brinde, lá no arraial da nossa família, que virou a Kambada. Esta vem sem suporte: só ela e o cordão, pra levar e bater à vontade.",
    "Material: tatajuba polida; tintas e verniz à base d'água.",
    "Medidas: 20×10×2 cm · ~390 g.",
    "Acompanha: cordão. NÃO acompanha suporte.",
    "Estampas: personagens da cultura maranhense, em cores diversas.",
    MATRACA_CUIDADO,
    A_MAO,
  ),
  16698777669: texto(
    "A matraca é generosa: a criança bate, a avó bate, o turista erra e acerta na segunda. Em poucos minutos todo mundo tá no mesmo compasso. A pequena com suporte é a que mais vira presente — cabe em qualquer parede e ninguém esquece de onde veio.",
    "Material: tatajuba (matraca) e pinus (suporte); tintas e verniz à base d'água.",
    "Medidas: matraca 12×10×2 cm · suporte 20×14 cm · ~400 g.",
    "Acompanha: suporte de parede e cordão.",
    "Estampas: modelos e cores diversos, temática maranhense.",
    MATRACA_CUIDADO,
    A_MAO,
  ),
  16698777979: texto(
    "Matraca guardada em caixa não faz barulho — e matraca que não faz barulho é enfeite. Esta é a menorzinha, com cordão e sem suporte: cabe na mão da criança e no bolso de quem chega no arraial sem conhecer ninguém e sai batendo com a fila inteira.",
    "Material: tatajuba polida; tintas e verniz à base d'água.",
    "Medidas: 12×10×2 cm · ~200 g.",
    "Acompanha: cordão. NÃO acompanha suporte.",
    "Estampas: modelos e cores diversos, temática maranhense.",
    MATRACA_CUIDADO,
    A_MAO,
  ),
  16698778218: texto(
    "O coração do nosso Bumba Meu Boi em edição especial: a matraca do Kambada Play, projeto da Kambada de criação original inspirada no Boi, patrimônio do Maranhão. Matraca grande com imã, suporte de pinus com chapéu bordado, tudo pintado à mão.",
    "Material: tatajuba (matraca, com imã) e pinus (suporte); tintas e verniz à base d'água.",
    "Medidas: matraca 20×10×2 cm · suporte 37×18 cm · ~835 g.",
    "Acompanha: suporte de parede com imã.",
    "Figuras: o boi com a bandeira do Maranhão; o boi e o miolo do boi.",
    MATRACA_CUIDADO,
    A_MAO,
  ),

  // ───────────────── Ecobags ─────────────────
  16701491097: texto(
    "Boizinho preso no fio da matraca, aquele instrumento que nasceu brinde no arraial da nossa família e virou a cara da Kambada. Ecobag mini, de alça curta, pra levar na mão à feira, à praia e ao arraial — cabe o essencial e sobra história.",
    ECOBAG_MAT,
    "Medidas: Mini 30×25 cm, alça curta de 30 cm.",
    ECOBAG_CUIDADO,
  ),
  16701486198: texto(
    "Pena colorida, passo que toma a rua: o Caboclo de Pena é dos personagens mais vistosos do nosso Bumba Meu Boi. Aqui ele vem em azul e laranja sobre algodão cru. Bolsa de feira, de praia e de arraial — cabe tudo e ainda conta história.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    "Mini 30×25 cm, alça de 52 cm.",
    ECOBAG_CUIDADO,
  ),
  16701485938: texto(
    "Carcará é ave de cara limpa e voo rasteiro, dono do céu do interior, que o sertanejo respeita e canta. Virou ilustração autoral da Kambada, em marrom sobre algodão cru, numa ecobag grande dessas que carregam o dia inteiro sem reclamar.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    ECOBAG_CUIDADO,
  ),
  16701491012: texto(
    "Quem sustenta o interior do Maranhão é mulher: a quebradeira de coco babaçu, machado na mão, amêndoa quebrada de geração em geração. Nossa homenagem em ilustração autoral, em verde e laranja, numa ecobag grande que também carrega peso — e com orgulho.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    ECOBAG_CUIDADO,
  ),
  16701490748: texto(
    "Céu vermelho de guará no fim da tarde: é o litoral do Maranhão se despedindo do dia. A nossa estampa mais querida virou ecobag — cor de fogo sobre algodão cru, pra feira, praia e arraial. Leva junto e todo mundo pergunta onde comprou.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    "Mini 30×25 cm, alça de 52 cm.",
    ECOBAG_CUIDADO,
  ),
  16701491047: texto(
    "Os azulejos portugueses cobrem fachadas inteiras do Centro de São Luís — azul, branco, amarelo, padrão que repete e nunca igual. E olha o detalhe: não estavam ali por beleza, tavam protegendo a parede de chuva e sol. A elegância veio de brinde. Mini, de alça curta.",
    ECOBAG_MAT,
    "Medidas: Mini 30×25 cm, alça curta de 30 cm.",
    ECOBAG_CUIDADO,
  ),
  16701490850: texto(
    "Dizem que uma serpente dorme embaixo de São Luís e cresce um tiquinho a cada ano. A lenda mais famosa da Ilha virou estampa em tons de azul sobre algodão cru. Bolsa de feira, de praia e de arraial — e de assunto, porque todo mundo quer saber da serpente.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    "Mini 30×25 cm, alça curta de 30 cm.",
    ECOBAG_CUIDADO,
  ),
  16701490705: texto(
    "A turma toda do Bumba Meu Boi numa bolsa: o boi, os brincantes, a roda que não para. A estampa Tradição em ecobag grande, de algodão cru — a festa do Maranhão indo junto pra feira, pra praia e pro arraial. Égua, que bonita.",
    ECOBAG_MAT,
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    ECOBAG_CUIDADO,
  ),

  // ───────────────── Bonés ─────────────────
  16701478057: texto(
    "O guará, pássaro vermelho do nosso litoral, pousou num boné bege de brim, em estampa de silk com relevo. Serve pra proteger a moleira no sol da Ilha, pra curtir o reggae na praça e pra dizer de onde é sem falar nada.",
    BONE_MAT,
    "Estampa: silk em relevo.",
    "Tamanho: único (ajustável).",
    "Cor: bege.",
    "Cuidados: não lavar na máquina.",
  ),
  16701478099: texto(
    "\"Maranhense que só\" — pronto, tá dito. Nosso jeito de falar daqui, de verdade, sem meio-termo, bordado em boné azul marinho de brim com a marca Kambada. Pra sol de praça, de praia e de arraial de tarde.",
    BONE_MAT,
    "Tamanho: único (ajustável).",
    "Cor: azul marinho, frase e marca bordadas.",
    "Cuidados: não lavar na máquina.",
  ),
  16701477657: texto(
    "As lendas de São Luís na cabeça: a serpente, o rei encantado, a ilha que some. Boné preto de brim, estampa de silk com relevo, pra quem gosta de um mistério por perto e de sol longe da testa.",
    BONE_MAT,
    "Estampa: silk em relevo.",
    "Tamanho: único (ajustável).",
    "Cor: preta.",
    "Cuidados: não lavar na máquina.",
  ),

  // ───────────────── Pareôs ─────────────────
  16701478379: texto(
    "São Luís se olha de perto: os azulejos cobrem fachadas inteiras do Centro Histórico, em padrão que repete e nunca igual. Esse desenho virou pareô — amarra, joga no ombro, estende na areia. Pra praia, pro calor, pro Maranhão inteiro.",
    PAREO_MAT,
    "Medidas: 1,05 × 1,45 m.",
    "Cuidados: lavar à mão; não usar alvejante.",
  ),
  16701478410: texto(
    "Pedacinho de cor junto de pedacinho de cor até virar desenho, igual azulejo de fachada da Ilha. O Mosaico junta elementos característicos de São Luís no nosso pareô mais colorido: amarra na cintura, joga no ombro, estende na areia e fica.",
    PAREO_MAT,
    "Medidas: 1,05 × 1,45 m.",
    "Cuidados: lavar à mão; não usar alvejante.",
  ),
  16701478418: texto(
    "A radiola começa, o sol vai baixando e ninguém quer sair da praia — São Luís é a Jamaica brasileira, reggae de bairro, dança agarradinha. A Reggae Roots em pareô é pra esse momento exato, que a gente conhece bem.",
    PAREO_MAT,
    "Medidas: 1,05 × 1,45 m.",
    "Cuidados: lavar à mão; não usar alvejante.",
  ),
  16701478426: texto(
    "Guará voltando pra dormir, céu pegando fogo: é o litoral maranhense no fim do dia. A nossa estampa mais querida em tecido leve pra praia — amarra, joga no ombro, estende na areia. Se achega que o pôr do sol é de graça.",
    PAREO_MAT,
    "Medidas: 1,05 × 1,45 m.",
    "Cuidados: lavar à mão; não usar alvejante.",
  ),

  // ───────────────── Necessaires ─────────────────
  16701478149: texto(
    "Azulejo de São Luís na bolsa: azul, branco, amarelo, padrão que repete e nunca igual, como as fachadas do Centro Histórico. Necessaire de algodão cru, pequena, prática e com a nossa cara.",
    NECESSAIRE_MAT,
    "Medidas: 15 × 20 cm.",
    ECOBAG_CUIDADO,
  ),
  16701478191: texto(
    "Um guará, o pássaro vermelho do nosso litoral, pousado numa necessaire de algodão cru. Cabe na bolsa, na mochila e na mala de quem vai embora mas leva o Maranhão junto — do jeito que tem que ser.",
    NECESSAIRE_MAT,
    "Medidas: 15 × 20 cm.",
    ECOBAG_CUIDADO,
  ),
  16701478241: texto(
    "A serpente que, dizem, dorme embaixo de São Luís — a lenda mais famosa da Ilha — em tons de azul sobre algodão cru. Pequena, prática e com história dentro. Boa pra guardar coisa miúda e pra contar a lenda pra quem perguntar.",
    NECESSAIRE_MAT,
    "Medidas: 15 × 20 cm.",
    ECOBAG_CUIDADO,
  ),
  16701478277: texto(
    "A estampa Tradição, que junta a turma do Bumba Meu Boi, aqui em marrom, tom único e sóbrio, sobre algodão cru. Pra quem gosta do Boi com discrição — o que no Maranhão já é raridade.",
    NECESSAIRE_MAT,
    "Cor da estampa: marrom.",
    "Medidas: 15 × 20 cm.",
    ECOBAG_CUIDADO,
  ),
  16701478328: texto(
    "O boi, os brincantes, a roda que não para — a estampa Tradição em versão colorida, sobre algodão cru. É a festa do Maranhão cabendo na bolsa, pra abrir no meio do dia e lembrar que junho sempre volta.",
    NECESSAIRE_MAT,
    "Medidas: 15 × 20 cm.",
    ECOBAG_CUIDADO,
  ),

  // ───────────────── Papelaria ─────────────────
  16701503083: texto(
    "Pra anotar o que não pode esquecer: a lista da feira, o verso que veio do nada, o nome de quem a gente conheceu no arraial. Bloquinho de capa kraft com a turma da cultura maranhense — o boi, o Cazumbá, o Caboclo de Pena, a lenda da serpente.",
    "Papel: 40 folhas off set branco, sem pauta.",
    "Medidas: 14 × 10 cm.",
    "Capa: mole, em papel kraft, encadernação costurada.",
    "Estampas: Boi, Cazumbá, Caboclo de Pena e Lenda da Serpente — você escolhe a estampa.",
  ),
  16689786870: texto(
    "Pequeno, leve, com cara de Maranhão. Pra lista, recado, rabisco e aquele verso que chega sem avisar no meio da tarde. Capa branca com figuras da cultura maranhense.",
    "Papel: 40 folhas off set branco, sem pauta.",
    "Medidas: 14 × 10 cm.",
    "Capa: mole, branca, encadernação costurada.",
    "Estampas: Boi, Azulejo, Guará e Lendas.",
  ),
  16701502720: texto(
    "Caneta de corpo de papel com um personagem maranhense desenhado e uma tag contando quem ele é: o boi, o Cazumbá, o Caboclo de Pena ou o guará. A gente escreve e, de brinde, aprende um tiquinho do Maranhão na mesma linha.",
    "Material: corpo em papel, ponta com ajuste superior.",
    "Tinta: azul. Não recarregável.",
    "Medidas: 14 cm.",
    "Acompanha: tag explicativa sobre o personagem.",
    "Estampas: Boi, Cazumbá, Caboclo de Pena e Guará — você escolhe a estampa.",
  ),
  16701502407: texto(
    "Brincadeira de papel com a cara do Maranhão, pra juntar a família e passar o tempo rindo: caça-palavras, labirinto, sete erros e outras brincadeiras com os personagens da nossa cultura.",
    "Material: papel off set.",
    "Medidas: 15 × 21 cm.",
  ),
  16701503196: texto(
    "Livro de colorir da Kambada: um mimo pequeno pra levar um pedaço do Maranhão sem ocupar espaço na mala — e pra pintar o boi, o Cazumbá e os guarás do jeito que a imaginação mandar.",
    "Material: papel off set.",
    "Medidas: 15 × 21 cm.",
  ),
  16701539190: texto(
    "Bloco, lápis, régua e o boi na capa — a festa maior do Maranhão, que morre e renasce todo junho. Kit pra escrever, anotar e desenhar com um toque sustentável, pra quem gosta do Maranhão e do planeta.",
    KIT_ITENS,
    "Cuidados: manter seco.",
  ),
  16701539241: texto(
    "O Cazumbá tomou conta da capa: máscara grande, roupa rodada, aquele susto que vira risada no Bumba Meu Boi. Kit pra escrever, anotar e desenhar com juízo ecológico e cara de Maranhão.",
    KIT_ITENS,
    "Cuidados: manter seco.",
  ),
  16701538916: texto(
    "Guarás em revoada na capa, incendiando o céu do litoral maranhense. Kit pra escrever, anotar e desenhar com um toque sustentável — papelaria pra quem gosta do Maranhão e do planeta.",
    KIT_ITENS,
    "Cuidados: manter seco.",
  ),
  16701539267: texto(
    "A Ilha do Amor na capa: a arte reúne os elementos da lenda da serpente encantada que dorme sob São Luís. Kit pra escrever, anotar e desenhar com um toque sustentável — pra quem leva a cidade no coração e no caderno.",
    KIT_ITENS,
    "Cuidados: manter seco.",
  ),
  16689787486: texto(
    "Lápis que escreve, desenha e, quando acaba, vira planta: na ponta de cima vem uma cápsula com sementes de rúcula, alface, coentro, salsa ou tomate. É enterrar o toco em vez de jogar fora — égua, que ideia boa. No corpo, ilustração autoral: guarás, Bumba Meu Boi, azulejos ou lendas.",
    "Material: madeira de reflorestamento, grafite HB, corpo sextavado, cápsula transparente com sementes.",
    "Medidas: 18 cm.",
    "Não acompanha apontador.",
    "Como plantar: quando o lápis ficar pequeno, plante-o com a ponta da cápsula para cima e regue com carinho.",
  ),
  16689788713: texto(
    "Livrinho em três línguas pra apresentar o Maranhão a quem chega de longe — e lembrar quem é daqui de que a gente tem muito o que mostrar.",
  ),
  16689788251: texto(
    "\"A Lenda do Bumba Meu Boi\": uma historinha pra ler em voz alta, de preferência com criança no colo e sotaque maranhense — e depois colorir, porque o livro é pra ler e pintar.",
    "Autor: João Rubens Rabêlo Carvalho. Ilustrações: Éguas Paper Toys.",
    "Páginas: 14.",
    "Medidas: 21 × 21 cm.",
  ),

  // ───────────────── Brindes ─────────────────
  16719152093: texto(
    "Um pedacinho do Boi pendurado na chave: o boi, o Cazumbá, o Caboclo de Pena, o tambor, a Tradição, em madeira de pinus com ilustração autoral. Mimo pra dar de lembrança ou pra guardar o Maranhão no bolso. Vem sortido — a gente escolhe com carinho, prometido.",
    "Material: madeira de pinus, retangular; ilustração em DTF; acabamento em verniz à base d'água.",
    "Fecho: mosquetão prata.",
    "Medidas: 8,5 × 3 × 0,5 cm.",
    "Estampas: Boi, Tambor, Cazumbá, Tradição e Caboclo de Pena, sortidas — o modelo enviado pode variar.",
  ),
  16719577340: texto(
    "Tambor de Crioula é roda, canto e batida de parelha que atravessa a noite em São Luís. Esta camisa azul marinho leva o tambor no peito — pra quem dança, pra quem toca e pra quem fica na beira da roda sem conseguir ficar parado.",
    ALGODAO,
    "Cor: azul marinho.",
    ADULTO,
    SEM_ALVEJANTE,
  ),
  16701502913: texto(
    "O Kambadinha, mascote da Kambada, pendurado na chave: pequeno, leve e com cara de Maranhão. Mimo pra dar de lembrança ou pra guardar um pedacinho da gente no bolso.",
    "Fecho: mosquetão prata.",
    "Cores: conforme o modelo disponível.",
  ),
  16689786358: texto(
    "Chegou em casa, pendurou a chave e lembrou de onde é. Placa redonda de pinus com ilustração autoral — o boi, o Cazumbá, o tambor, a Tradição ou o Caboclo de Pena —, três ganchos e alça caramelo pra fixar na parede. Simples, bonito, maranhense que só.",
    "Material: madeira de pinus; tintas e verniz brilhante à base d'água; alça em material sintético caramelo.",
    "Medidas: Ø 20 cm × 1,5 cm. Três ganchos.",
    "Fixação: na parede, pela alça. Não acompanha parafuso.",
    "Pintada à mão, uma por uma: pode variar um pouco da foto.",
  ),

  // ───────────────── Decoração ─────────────────
  16701503226: texto(
    "Uma roda de corda e fio em volta de uma placa pintada à mão: no centro, o boi, o Cazumbá ou o Caboclo de Fitas. É a cultura maranhense tomando conta da parede — e da conversa de quem entra na sala.",
    "Material: placa central em pinus (Ø 20 cm) pintada à mão; detalhes em corda e fio preto; fundo em MDF 3 mm; verniz brilhante.",
    "Medidas: Ø 39 cm · ~940 g.",
    "Fixação: gancho traseiro para parede.",
    "Temas: Boi, Cazumbá e Caboclo de Fitas, conforme modelo.",
    "Pintada à mão, uma por uma: pode variar um pouco da foto.",
  ),
  // Placa de Madeira Retangular (era "Placa de Madeira Grande"; Wilzanira, 20/10/2026):
  // modelos Coreira e Coreiro, R$ 160; com parafuso e puxador, R$ 180.
  16701503321: texto(
    "Tambor de Crioula na parede: a Coreira, de saia rodada, dançando na roda, e o Coreiro, que bate o tambor e puxa o canto. Placa retangular de pinus, pintada à mão — fecha o olho que dá pra ouvir.",
    "Material: madeira de pinus; tintas e verniz à base d'água.",
    "Medidas: 35 × 14 cm.",
    "Modelos: Coreira e Coreiro.",
    "Fixação: opcional, com parafuso e puxador (+ R$ 20,00).",
    "Pintada à mão, uma por uma: pode variar um pouco da foto.",
  ),
  16701503283: texto(
    "O boi, o Cazumbá ou o Caboclo de Fitas em placa redonda de pinus, com alça caramelo pra pendurar. Ilustração autoral, colorida ou em preto. Pra decorar a casa com arte do Maranhão e dar assunto pra visita.",
    "Material: madeira de pinus; tintas e verniz brilhante à base d'água; alça em material sintético caramelo de 40 cm.",
    "Medidas: Ø 20 cm × 1,5 cm · ~200 g.",
    "Fixação: suporte traseiro para parede.",
    "Temas: Bumba Meu Boi, Cazumbá e Caboclo de Fitas, coloridos ou em preto.",
    "Pintada à mão, uma por uma: pode variar um pouco da foto.",
  ),
  16701503257: texto(
    "Tambor de Crioula na parede: a Coreira, de saia rodada, dançando na roda em volta dos tambores, e o Solista, que puxa o canto. Placa retangular de pinus, pintada à mão, com alça caramelo. Fecha o olho que dá pra ouvir.",
    "Material: madeira de pinus; tintas e verniz brilhante à base d'água; alça em material sintético caramelo de 40 cm.",
    "Medidas: 35 × 14 × 1,5 cm · ~430 g.",
    "Acompanha: pino de pinus (Ø 5 cm) para fixação na parede.",
    "Modelos: Coreira e Solista.",
    "Pintada à mão, uma por uma: pode variar um pouco da foto.",
  ),
};

/**
 * Onde a contagem física da Wilsonira (13/10/2026) não bate com a grade do
 * Bling. Não altera texto nem cadastro: é lista para decisão do Alexandre.
 */
export const DIVERGENCIAS = [
  "Camisa Alusiva São Luís: ateliê diz que não existe PP; o Bling tem variação PP com saldo 1.",
  "Camisa Bumba meu Boi Infantil: ateliê diz que não existe 10 anos; o Bling tem 10 anos com saldo 2.",
  "Camisa Revoada dos Guarás Suede Unissex: ateliê mediu só o G; o Bling tem só GG (saldo 2).",
  "Camisa Serpente Mosaico Infantil: ateliê mediu 4 anos; o Bling tem só 6 anos (saldo 1).",
  "Camisa Caboclo de Pena: descrição diz salmão, mas as fotos de 05/06 mostram a estampa também em camisa preta.",
];
