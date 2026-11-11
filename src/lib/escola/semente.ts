import { ATIVIDADES, DIDATICA } from "./cultura";
import { historicoDemo, redacoesDemo } from "./redacoesDemo";
import type { Aluno, Dados, FeitoCultural, Membro, Registro, Turma } from "./dados";
import { TRILHAS, trilhasDaEtapa } from "./desafios";
import { hashDemo } from "./senha";
import { AVATARES, PONTOS, type Resultado } from "./tipos";

/**
 * Demonstração da "Escola Modelo" (dados fictícios) para as reuniões com as
 * escolas. Determinística: restaurar devolve os MESMOS códigos de turma e as
 * mesmas senhas de figuras, então os cartões impressos continuam valendo.
 *
 * Gestão Kambada, acima da escola (hub de gestão): kambada.
 * Equipe de demonstração (senhas: ver `hashDemo` em senha.ts; os professores dividem a mesma):
 *   coordenacao · prof.ana (Matemática e Português, 4º A e 5º B)
 *   prof.marcos (Inglês, 5º B e 8º A) · prof.lucia (Matemática e Português, 8º A)
 */

function sorteador(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const APELIDOS: Record<string, string[]> = {
  t4a: ["CaranguejoVeloz", "Guará_do_4A", "MatracaDeOuro", "TamborForte", "PipaAzul", "Juçarinha", "BoiEstrela", "SolDaIlha"],
  t5b: ["CoreiraNinja", "Pandeirão", "Azulejo_5B", "Buritizinho", "MaréAlta", "FitaColorida", "Caboclinho", "Sabiá"],
  t8a: ["MestreDaMatraca", "Sobrado22", "ReggaeDaIlha", "LençolBranco", "Fogueteiro", "Zabumba", "BaixadaBoy", "Cuxá"],
};

/** Nomes FICTÍCIOS (para a escola ver quem é quem no mapa de reforço), na mesma ordem dos apelidos. */
const NOMES: Record<string, string[]> = {
  t4a: ["Davi Santos", "Lara Mendes", "Heitor Sousa", "Ana Clara Lima", "Miguel Rocha", "Sofia Araújo", "Arthur Nunes", "Helena Pires"],
  t5b: ["Gael Moraes", "Valentina Reis", "Theo Carvalho", "Maria Alice Dias", "Bernardo Freitas", "Laura Teixeira", "Pedro Henrique Costa", "Cecília Barros"],
  t8a: ["Enzo Gabriel Silva", "Isadora Matos", "Caio Ferreira", "Beatriz Campos", "Lucas Viana", "Manuela Prado", "Rafael Duarte", "Júlia Andrade"],
};

/** Quanto cada jogo é procurado na demonstração (chance de o aluno jogar a trilha). */
const PROCURA: Record<string, number> = {
  "contas-do-arraial": 0.95,
  "feira-da-jucara": 0.9,
  "palavras-da-festa": 0.7,
  "leitura-do-auto": 0.55,
  "kambadinha-in-english": 0.6,
};

/** O acesso da Kambada ao hub de gestão da escola. */
export function gestorDemo(criadoEm: string): Membro {
  return { id: "m-kambada", papel: "gestor", nome: "Gestão Kambada", usuario: "kambada", senhaHash: hashDemo("gestor"), disciplinas: [], criadoEm };
}

/**
 * Contas de teste do Alexandre (02/11/2026), fáceis de digitar: "professor"
 * (todas as turmas e disciplinas) e "aluno" (4º ano A, sem histórico, entra
 * por usuário e senha na tela da equipe ou pelas figuras 🦀 🐂 🥁).
 */
export function professorTeste(criadoEm: string): Membro {
  return { id: "m-teste", papel: "professor", nome: "Professor de Teste", usuario: "professor", senhaHash: hashDemo("professorTeste"), disciplinas: ["Matemática", "Português", "Inglês"], criadoEm };
}
export function alunoTeste(criadoEm: string): Aluno {
  return { id: "t4a-teste", turmaId: "t4a", apelido: "Aluno", nome: "Aluno de Teste", avatar: "🦀", figuras: [0, 1, 2], usuario: "aluno", senhaHash: hashDemo("alunoTeste"), criadoEm };
}

/**
 * Acessos temporários do SESI (09/11/2026, depois da apresentação): um de
 * aluno, um de professor e um de coordenação, valendo até o fim de 14/11
 * (horário de São Luís). Depois disso o login é recusado e a sessão cai.
 */
export const FIM_SESI = "2026-11-15T03:00:00.000Z";
export function contasSesi(criadoEm: string): { membros: Membro[]; aluno: Aluno } {
  return {
    membros: [
      { id: "m-sesi-prof", papel: "professor", nome: "Professor SESI", usuario: "professor.sesi", senhaHash: hashDemo("professorSesi"), disciplinas: ["Matemática", "Português", "Inglês"], expiraEm: FIM_SESI, criadoEm },
      { id: "m-sesi-coord", papel: "coordenacao", nome: "Coordenação SESI", usuario: "coordenacao.sesi", senhaHash: hashDemo("coordenacaoSesi"), disciplinas: [], expiraEm: FIM_SESI, criadoEm },
    ],
    aluno: { id: "t4a-sesi", turmaId: "t4a", apelido: "AlunoSESI", nome: "Aluno SESI", avatar: "⭐", figuras: [6, 3, 1], usuario: "aluno.sesi", senhaHash: hashDemo("alunoSesi"), expiraEm: FIM_SESI, criadoEm },
  };
}

/**
 * Coordenação do Colégio Ipê de Educação Básica (11/11/2026, depois da
 * apresentação): um login só, de coordenação, sobre a escola de demonstração
 * (dados fictícios), valendo até o fim de 16/11 (horário de São Luís). Pela
 * troca "Ver como", passeia também pelas visões de professor e de aluno.
 */
export const FIM_IPE = "2026-11-17T03:00:00.000Z";
export function contaIpe(criadoEm: string): Membro {
  return { id: "m-ipe-coord", papel: "coordenacao", nome: "Coordenação · Colégio Ipê", usuario: "colegioipe", senhaHash: hashDemo("coordenacaoIpe"), disciplinas: [], expiraEm: FIM_IPE, criadoEm };
}

/** Garante as contas de teste num arquivo de demonstração (o de antes de 02/11 não tinha). */
export function comContasDeTeste(d: Dados): Dados {
  const agora = new Date().toISOString();
  if (!d.membros.some((m) => m.usuario === "professor")) {
    const p = professorTeste(agora);
    d.membros.push(p);
    for (const t of d.turmas) if (!t.professorIds.includes(p.id)) t.professorIds.push(p.id);
  }
  if (!d.alunos.some((a) => a.usuario === "aluno") && d.turmas.some((t) => t.id === "t4a") && !d.alunos.some((a) => a.id === "t4a-teste")) d.alunos.push(alunoTeste(agora));
  // SESI: entra uma vez; vencido, fica guardado mas não entra mais.
  const sesi = contasSesi(agora);
  for (const m of sesi.membros) {
    if (d.membros.some((x) => x.id === m.id || x.usuario === m.usuario)) continue;
    d.membros.push(m);
    if (m.papel === "professor") for (const t of d.turmas) if (!t.professorIds.includes(m.id)) t.professorIds.push(m.id);
  }
  if (d.turmas.some((t) => t.id === "t4a") && !d.alunos.some((a) => a.id === sesi.aluno.id || a.usuario === sesi.aluno.usuario)) d.alunos.push(sesi.aluno);
  const ipe = contaIpe(agora);
  if (!d.membros.some((x) => x.id === ipe.id || x.usuario === ipe.usuario)) d.membros.push(ipe);
  return d;
}

/** Quanto cada atividade de cultura é procurada no histórico fictício. */
const PROCURA_CULTURA: Record<string, number> = {
  "arraial-festa": 0.8,
  "jogo-auto-do-boi": 0.55,
  "jogo-sotaques": 0.4,
  "hq-guaras": 0.7,
  "hq-tambor": 0.6,
  "video-guaras": 0.75,
  "conto-boi": 0.35,
  "artigo-carnaval": 0.5,
  "quiz-carnaval": 0.45,
};

const PERGUNTAS_CULTURA: Record<string, number> = { "arraial-festa": 5, "jogo-auto-do-boi": 6, "jogo-sotaques": 5, "quiz-carnaval": 8, "quiz-saojoao": 8, "quiz-boi": 8, "quiz-matraca": 8, "quiz-sotaques": 8, "quiz-tambor": 8, "quiz-mangue": 8, "quiz-saoluis": 8, "quebra-agua": 3, "quebra-saojoao": 3, "quebra-tambor": 3 };

/**
 * Histórico fictício da área de cultura (sorteio próprio: não mexe nos
 * códigos, figuras e respostas dos desafios). Contas de teste ficam de fora.
 */
export function culturaDemo(alunos: Aluno[], agora = Date.now()): FeitoCultural[] {
  const r = sorteador(20261102);
  const feitos: FeitoCultural[] = [];
  for (const a of alunos) {
    if (a.id.endsWith("-teste") || a.apelido === "Sabiá" || a.apelido === "Cuxá") continue;
    for (const at of ATIVIDADES) {
      if (r() > (PROCURA_CULTURA[at.id] ?? 0.5)) continue;
      const total = PERGUNTAS_CULTURA[at.id] ?? DIDATICA[at.id]?.perguntas.length;
      const acertos = total ? Math.min(total, Math.round(total * (0.5 + r() * 0.55))) : undefined;
      const dias = Math.floor(r() * 12);
      feitos.push({ alunoId: a.id, turmaId: a.turmaId, atividade: at.id, ...(total ? { acertos, total } : {}), em: new Date(agora - dias * 86400000 - Math.floor(r() * 8) * 3600000).toISOString() });
    }
  }
  return feitos.sort((x, y) => x.em.localeCompare(y.em));
}

export function sementeDemo(agora = Date.now()): Dados {
  const r = sorteador(20261101);
  const criadoEm = new Date(agora).toISOString();
  const coord = hashDemo("coordenacao");
  const prof = hashDemo("professor");

  const membros: Membro[] = [
    gestorDemo(criadoEm),
    { id: "m-coord", papel: "coordenacao", nome: "Coordenação Pedagógica", usuario: "coordenacao", senhaHash: coord, disciplinas: [], criadoEm },
    { id: "m-ana", papel: "professor", nome: "Ana Ribeiro", usuario: "prof.ana", senhaHash: prof, disciplinas: ["Matemática", "Português"], criadoEm },
    { id: "m-marcos", papel: "professor", nome: "Marcos Lima", usuario: "prof.marcos", senhaHash: prof, disciplinas: ["Inglês"], criadoEm },
    { id: "m-lucia", papel: "professor", nome: "Lúcia Costa", usuario: "prof.lucia", senhaHash: prof, disciplinas: ["Matemática", "Português"], criadoEm },
  ];

  const turmas: Turma[] = [
    { id: "t4a", nome: "4º ano A", etapa: "f1", codigo: "4821", professorIds: ["m-ana"], criadoEm },
    { id: "t5b", nome: "5º ano B", etapa: "f1", codigo: "5730", professorIds: ["m-ana", "m-marcos"], criadoEm },
    { id: "t8a", nome: "8º ano A", etapa: "f2", codigo: "8164", professorIds: ["m-marcos", "m-lucia"], criadoEm },
  ];

  const alunos: Aluno[] = [];
  for (const t of turmas) {
    APELIDOS[t.id].forEach((apelido, i) => {
      alunos.push({
        id: `${t.id}-a${i + 1}`,
        turmaId: t.id,
        apelido,
        nome: NOMES[t.id][i],
        avatar: AVATARES[Math.floor(r() * AVATARES.length)],
        figuras: [0, 1, 2].map(() => Math.floor(r() * 9)),
        criadoEm,
      });
    });
  }

  // Histórico fictício das duas últimas semanas, para o relatório não nascer vazio.
  // Cada aluno tem um "jeito" (domínio de 0,45 a 0,95) e cada habilidade um peso de dificuldade.
  const registros: Registro[] = [];
  const dificuldade = new Map<string, number>();
  for (const t of TRILHAS) for (const q of t.questoes) if (!dificuldade.has(q.habilidade)) dificuldade.set(q.habilidade, r() * 0.3);
  for (const a of alunos) {
    const turma = turmas.find((t) => t.id === a.turmaId)!;
    const dominio = 0.45 + r() * 0.5;
    if (a.apelido === "Sabiá" || a.apelido === "Cuxá") continue; // ainda não jogaram: aparecem em cinza
    for (const trilha of trilhasDaEtapa(turma.etapa)) {
      if (trilha.disciplina === "Inglês" && turma.id === "t4a") continue; // 4º A ainda não começou o inglês
      if (r() > (PROCURA[trilha.id] ?? 0.8)) continue; // nem todo mundo joga todos os jogos
      for (const q of trilha.questoes) {
        if (r() < 0.2) continue;
        const p = dominio - (dificuldade.get(q.habilidade) ?? 0);
        const sorte = r();
        const resultado: Resultado = sorte < p ? "primeira" : sorte < p + 0.22 ? "segunda" : "reforco";
        const erradas = q.opcoes.map((_, i) => i).filter((i) => i !== q.correta);
        // O erro mais comum de cada questão é a primeira opção errada do diagnóstico (2 em 3 vezes).
        const errou = resultado === "primeira" ? null : r() < 0.66 ? erradas[0] : erradas[erradas.length - 1];
        const dias = Math.floor(r() * 14);
        registros.push({
          alunoId: a.id,
          turmaId: a.turmaId,
          trilhaId: trilha.id,
          questaoId: q.id,
          disciplina: trilha.disciplina,
          habilidade: q.habilidade,
          resultado,
          errou,
          pontos: PONTOS[resultado],
          em: new Date(agora - dias * 86400000 - Math.floor(r() * 8) * 3600000).toISOString(),
        });
      }
    }
  }
  registros.sort((x, y) => x.em.localeCompare(y.em));

  // Depois do histórico: as contas de teste nascem sem respostas (e não mexem no sorteio dos outros).
  return comContasDeTeste({
    versao: 1,
    demo: true,
    escola: {
      nome: "Escola Modelo",
      sigla: "EM",
      cor: "#F5821F",
      cidade: "São Luís, Maranhão",
      temporada: { emoji: "🥁", titulo: "Temporada Consciência Negra", texto: "Tambor de Crioula e a herança afro-maranhense" },
    },
    membros,
    turmas,
    alunos,
    registros,
    partidas: [],
    cultura: culturaDemo(alunos, agora),
    redacoes: [...historicoDemo(alunos, agora), ...redacoesDemo(alunos, agora)],
    criadoEm,
  });
}
