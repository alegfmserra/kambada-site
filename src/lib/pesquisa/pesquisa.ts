import { appendFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { type Atribuicao, lerAtribuicao } from "../atribuicao/atribuicao";
import { arquivoTokens } from "../bling/tokens";

/**
 * Pesquisa de satisfação do site (20/10/2026). Não guardamos IP. Desde 22/10
 * a pessoa pode dizer o primeiro nome e a idade (opcionais, só para conhecer o
 * público) e, se estiver com a conta do Kambada Play ligada, o e-mail da conta
 * vai junto. Fora isso: o que marcou, a página e o tamanho da tela (para saber
 * se o problema foi no celular).
 * Uma resposta por linha (JSONL) na pasta persistente `.kambada/`.
 */

export const OPCOES = {
  funcionou: ["sim", "com-problemas"],
  curtiu: ["loja", "cultura", "play", "sobre", "encomendas"],
  valorPlay: ["muito", "um-pouco", "nao-conheco", "nao"],
  assinaria: ["familia", "brincante", "talvez", "nao"],
  origem: ["instagram", "tiktok", "indicacao", "evento", "google", "outro"],
  // Bloco MIT / MaraInTech (FAPEMA, 23/10/2026): perguntas para adultos que alimentam os indicadores do programa.
  confirmaDor: ["sim", "em-parte", "nao"],
  frequenciaBusca: ["semanal", "mensal", "poucas-vezes", "nunca"],
  conseguiu: ["sim", "com-dificuldade", "nao"],
  aprendeu: ["sim", "um-pouco", "nao", "nao-usei"],
  cargoDirecao: ["sim", "nao"],
  tipoInstituicao: ["escola-publica", "escola-privada", "ies", "governo", "espaco-cultural", "ong", "empresa", "investidor", "inovacao", "outra"],
  interessePiloto: ["sim", "talvez", "nao"],
} as const;

export const ROTULOS: Record<string, string> = {
  sim: "Sim",
  "com-problemas": "Com problemas",
  loja: "Loja",
  cultura: "Cultura",
  play: "Kambada Play",
  sobre: "Sobre / nossa história",
  encomendas: "Encomendas",
  muito: "Muito",
  "um-pouco": "Um pouco",
  "nao-conheco": "Ainda não conheço",
  nao: "Não",
  familia: "Sim — Família (R$ 9,90/mês)",
  brincante: "Sim — Brincante (R$ 19,90/mês)",
  talvez: "Talvez",
  instagram: "Instagram",
  tiktok: "TikTok",
  indicacao: "Indicação",
  evento: "Evento / feira",
  google: "Google",
  outro: "Outro",
  "em-parte": "Em parte",
  semanal: "Toda semana",
  mensal: "Todo mês",
  "poucas-vezes": "Poucas vezes ao ano",
  nunca: "Nunca procurei",
  "com-dificuldade": "Com dificuldade",
  "nao-usei": "Ainda não usei",
  "escola-publica": "Escola pública / rede de ensino",
  "escola-privada": "Escola privada",
  ies: "Universidade / instituto / pesquisa",
  governo: "Governo (secretaria, prefeitura, fundação)",
  "espaco-cultural": "Espaço cultural (museu, biblioteca, centro cultural)",
  ong: "ONG / associação / coletivo",
  empresa: "Empresa",
  investidor: "Investidor / fundo / apoiador",
  inovacao: "Incubadora / hub / ambiente de inovação",
  outra: "Outra",
};

export type Resposta = {
  em: string;
  /** Só o primeiro nome, como a pessoa digitou. */
  nome?: string;
  idade?: number;
  /** Só quando há conta do Kambada Play ligada na hora do envio. */
  email?: string;
  nota?: number;
  funcionou?: (typeof OPCOES.funcionou)[number];
  problema?: string;
  curtiu: (typeof OPCOES.curtiu)[number][];
  sugestao?: string;
  valorPlay?: (typeof OPCOES.valorPlay)[number];
  assinaria?: (typeof OPCOES.assinaria)[number];
  origem?: (typeof OPCOES.origem)[number];
  comentario?: string;
  // Bloco MIT / MaraInTech — ver docs em Kambada-Play/MIT-indicadores-pesquisa.md
  confirmaDor?: (typeof OPCOES.confirmaDor)[number];
  frequenciaBusca?: (typeof OPCOES.frequenciaBusca)[number];
  conseguiu?: (typeof OPCOES.conseguiu)[number];
  /** NPS do Kambada Play, 0 a 10 (separado da nota 1–5 do site, que é CSAT). */
  recomendaria?: number;
  aprendeu?: (typeof OPCOES.aprendeu)[number];
  cargoDirecao?: (typeof OPCOES.cargoDirecao)[number];
  tipoInstituicao?: (typeof OPCOES.tipoInstituicao)[number];
  instituicao?: string;
  interessePiloto?: (typeof OPCOES.interessePiloto)[number];
  /** E-mail ou WhatsApp deixado de propósito, para a Kambada retornar. */
  contato?: string;
  /** De onde veio quem respondeu (utm/referência). */
  atribuicao?: Atribuicao;
  pagina?: string;
  gatilho?: string;
  largura?: number;
};

function texto(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max);
  return t || undefined;
}

function umaDas<T extends readonly string[]>(v: unknown, lista: T): T[number] | undefined {
  return typeof v === "string" && (lista as readonly string[]).includes(v) ? (v as T[number]) : undefined;
}

/** Valida o que veio do navegador. Devolve null se não houver nenhuma resposta. */
export function validarResposta(corpo: Record<string, unknown>, agora = new Date(), emailDaConta?: string): Resposta | null {
  const nota = typeof corpo.nota === "number" && Number.isInteger(corpo.nota) && corpo.nota >= 1 && corpo.nota <= 5 ? corpo.nota : undefined;
  const curtiu = Array.isArray(corpo.curtiu)
    ? [...new Set(corpo.curtiu.map((c) => umaDas(c, OPCOES.curtiu)).filter((c) => c !== undefined))]
    : [];
  const largura = typeof corpo.largura === "number" && corpo.largura > 0 && corpo.largura < 10000 ? Math.round(corpo.largura) : undefined;
  const idadeBruta = typeof corpo.idade === "string" ? Number(corpo.idade.trim()) : corpo.idade;
  const idade = typeof idadeBruta === "number" && Number.isInteger(idadeBruta) && idadeBruta >= 1 && idadeBruta <= 110 ? idadeBruta : undefined;
  const recBruta = typeof corpo.recomendaria === "string" && corpo.recomendaria.trim() !== "" ? Number(corpo.recomendaria) : corpo.recomendaria;
  const recomendaria = typeof recBruta === "number" && Number.isInteger(recBruta) && recBruta >= 0 && recBruta <= 10 ? recBruta : undefined;
  const cargoDirecao = umaDas(corpo.cargoDirecao, OPCOES.cargoDirecao);
  const r: Resposta = {
    em: agora.toISOString(),
    // Primeiro nome só: corta no primeiro espaço.
    nome: texto(corpo.nome, 40)?.split(/\s+/)[0],
    idade,
    email: emailDaConta || undefined,
    nota,
    funcionou: umaDas(corpo.funcionou, OPCOES.funcionou),
    problema: texto(corpo.problema, 500),
    curtiu,
    sugestao: texto(corpo.sugestao, 500),
    valorPlay: umaDas(corpo.valorPlay, OPCOES.valorPlay),
    assinaria: umaDas(corpo.assinaria, OPCOES.assinaria),
    origem: umaDas(corpo.origem, OPCOES.origem),
    comentario: texto(corpo.comentario, 500),
    confirmaDor: umaDas(corpo.confirmaDor, OPCOES.confirmaDor),
    frequenciaBusca: umaDas(corpo.frequenciaBusca, OPCOES.frequenciaBusca),
    conseguiu: umaDas(corpo.conseguiu, OPCOES.conseguiu),
    recomendaria,
    aprendeu: umaDas(corpo.aprendeu, OPCOES.aprendeu),
    cargoDirecao,
    // Detalhes da instituição só valem para quem declarou cargo de direção.
    tipoInstituicao: cargoDirecao === "sim" ? umaDas(corpo.tipoInstituicao, OPCOES.tipoInstituicao) : undefined,
    instituicao: cargoDirecao === "sim" ? texto(corpo.instituicao, 80) : undefined,
    interessePiloto: cargoDirecao === "sim" ? umaDas(corpo.interessePiloto, OPCOES.interessePiloto) : undefined,
    contato: texto(corpo.contato, 100),
    atribuicao: lerAtribuicao(corpo.origemVisita),
    pagina: texto(corpo.pagina, 200)?.replace(/[?#].*$/, ""),
    gatilho: texto(corpo.gatilho, 40),
    largura,
  };
  const temAlgo =
    r.nota || r.funcionou || r.problema || r.curtiu.length || r.sugestao || r.valorPlay || r.assinaria || r.origem || r.comentario ||
    r.confirmaDor || r.frequenciaBusca || r.conseguiu || r.recomendaria !== undefined || r.aprendeu || r.cargoDirecao;
  return temAlgo ? r : null;
}

export function arquivoPesquisa(): string {
  return process.env.PESQUISA_ARQUIVO ?? join(dirname(arquivoTokens()), "pesquisa-satisfacao.jsonl");
}
const arquivoTemporario = () => join(tmpdir(), "kambada-pesquisa-satisfacao.jsonl");

export async function gravarResposta(r: Resposta): Promise<void> {
  const linha = JSON.stringify(r) + "\n";
  try {
    await mkdir(dirname(arquivoPesquisa()), { recursive: true });
    await appendFile(arquivoPesquisa(), linha, "utf8");
  } catch (e) {
    console.error("[pesquisa] pasta persistente indisponível, gravando na temporária:", e);
    await appendFile(arquivoTemporario(), linha, "utf8");
  }
}

export async function listarRespostas(): Promise<Resposta[]> {
  const todas: Resposta[] = [];
  for (const caminho of [arquivoPesquisa(), arquivoTemporario()]) {
    try {
      for (const l of (await readFile(caminho, "utf8")).split("\n")) {
        if (!l.trim()) continue;
        try {
          todas.push(JSON.parse(l) as Resposta);
        } catch {
          /* linha corrompida: ignora */
        }
      }
    } catch {
      /* arquivo ainda não existe */
    }
  }
  return todas.sort((a, b) => a.em.localeCompare(b.em));
}

function contar<T extends string>(lista: (T | undefined)[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const v of lista) if (v) c[ROTULOS[v] ?? v] = (c[ROTULOS[v] ?? v] ?? 0) + 1;
  return c;
}

function idades(rs: Resposta[]) {
  const ids = rs.map((r) => r.idade).filter((n): n is number => typeof n === "number");
  const faixas: Record<string, number> = {};
  for (const i of ids) {
    const f = i < 13 ? "até 12" : i < 18 ? "13–17" : i < 30 ? "18–29" : i < 45 ? "30–44" : i < 60 ? "45–59" : "60+";
    faixas[f] = (faixas[f] ?? 0) + 1;
  }
  return {
    idadeMedia: ids.length ? Math.round((ids.reduce((a, b) => a + b, 0) / ids.length) * 10) / 10 : null,
    idades: faixas,
  };
}

const pct = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);

/**
 * Números para os indicadores do MIT / MaraInTech (FAPEMA). Cada item traz o
 * denominador (n) — a planilha do programa pede "explicitar critério e período".
 * Só contam quem respondeu a pergunta; resposta em branco não entra na conta.
 */
export function indicadoresMit(rs: Resposta[]) {
  const com = <K extends keyof Resposta>(k: K) => rs.filter((r) => r[k] !== undefined && r[k] !== "");
  const dor = com("confirmaDor");
  const cont = com("conseguiu");
  const rec = rs.map((r) => r.recomendaria).filter((n): n is number => typeof n === "number");
  const promotores = rec.filter((n) => n >= 9).length;
  const detratores = rec.filter((n) => n <= 6).length;
  const dir = com("cargoDirecao");
  const gestores = rs.filter((r) => r.cargoDirecao === "sim");
  return {
    // F1.2 · entrevistados que confirmam a dor (%)
    F1_2_confirmaDor: { n: dor.length, sim: dor.filter((r) => r.confirmaDor === "sim").length, pct: pct(dor.filter((r) => r.confirmaDor === "sim").length, dor.length), distribuicao: contar(dor.map((r) => r.confirmaDor)) },
    // F1.3 · frequência (janela: últimos 12 meses, como na pergunta)
    F1_3_frequencia: { n: com("frequenciaBusca").length, distribuicao: contar(rs.map((r) => r.frequenciaBusca)) },
    // F2.2 · conclusão de tarefas (autodeclarada; o teste moderado com observação é à parte)
    F2_2_conseguiu: { n: cont.length, pctSemAjuda: pct(cont.filter((r) => r.conseguiu === "sim").length, cont.length), distribuicao: contar(cont.map((r) => r.conseguiu)) },
    // F2.3 · NPS do Play (0–10). CSAT do site é a "nota" 1–5 — não misturar.
    F2_3_nps: {
      n: rec.length,
      promotores,
      neutros: rec.length - promotores - detratores,
      detratores,
      nps: rec.length ? Math.round(((promotores - detratores) / rec.length) * 100) : null,
    },
    // F2.7 e I7 · evidência de valor / aprendizado (ODS 4 e 11.4)
    F2_7_I7_aprendeu: { n: com("aprendeu").length, distribuicao: contar(rs.map((r) => r.aprendeu)) },
    // F3.2 e F3.7 · instituições com interesse em piloto/parceria
    F3_2_F3_7_instituicoes: {
      respondeuCargoDirecao: dir.length,
      comCargoDirecao: gestores.length,
      interessePiloto: contar(gestores.map((r) => r.interessePiloto)),
      comContato: gestores.filter((r) => r.contato).length,
      distintas: new Set(gestores.map((r) => r.instituicao?.toLowerCase().replace(/\s+/g, " ")).filter(Boolean)).size,
    },
    // I6 · por tipo de ator do ecossistema
    I6_tipoInstituicao: contar(gestores.map((r) => r.tipoInstituicao)),
  };
}

export function resumir(rs: Resposta[]) {
  const notas = rs.map((r) => r.nota).filter((n): n is number => typeof n === "number");
  return {
    total: rs.length,
    notaMedia: notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null,
    funcionou: contar(rs.map((r) => r.funcionou)),
    curtiu: contar(rs.flatMap((r) => r.curtiu)),
    valorPlay: contar(rs.map((r) => r.valorPlay)),
    assinaria: contar(rs.map((r) => r.assinaria)),
    origem: contar(rs.map((r) => r.origem)),
    ...idades(rs),
    mit: indicadoresMit(rs),
  };
}

const COLUNAS: (keyof Resposta)[] = [
  "em", "nome", "idade", "email", "nota", "funcionou", "problema", "curtiu", "sugestao", "valorPlay", "assinaria", "origem", "comentario",
  "confirmaDor", "frequenciaBusca", "conseguiu", "recomendaria", "aprendeu", "cargoDirecao", "tipoInstituicao", "instituicao", "interessePiloto", "contato",
  "pagina", "gatilho", "largura",
];

export function respostasParaCsv(rs: Resposta[]): string {
  const cel = (v: unknown) => {
    const s = Array.isArray(v) ? v.map((x) => ROTULOS[x] ?? x).join(" | ") : v === undefined ? "" : String(ROTULOS[String(v)] ?? v);
    // Planilha não executa fórmula vinda de texto livre.
    const seguro = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  return "﻿" + [COLUNAS.join(";"), ...rs.map((r) => COLUNAS.map((c) => cel(r[c])).join(";"))].join("\r\n");
}
