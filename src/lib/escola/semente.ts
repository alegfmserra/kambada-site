import type { Aluno, Dados, Membro, Registro, Turma } from "./dados";
import { TRILHAS, trilhasDaEtapa } from "./desafios";
import { hashDemo } from "./senha";
import { AVATARES, PONTOS, type Resultado } from "./tipos";

/**
 * Demonstração da "Escola Modelo" (dados fictícios) para as reuniões com as
 * escolas. Determinística: restaurar devolve os MESMOS códigos de turma e as
 * mesmas senhas de figuras, então os cartões impressos continuam valendo.
 *
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

export function sementeDemo(agora = Date.now()): Dados {
  const r = sorteador(20261101);
  const criadoEm = new Date(agora).toISOString();
  const coord = hashDemo("coordenacao");
  const prof = hashDemo("professor");

  const membros: Membro[] = [
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
        avatar: AVATARES[Math.floor(r() * AVATARES.length)],
        figuras: [0, 1, 2].map(() => Math.floor(r() * 9)),
        criadoEm,
      });
    });
  }

  // Histórico fictício das duas últimas semanas, para o relatório não nascer vazio.
  // Cada aluno tem um "jeito" (domínio de 0,35 a 0,9) e cada habilidade um peso de dificuldade.
  const registros: Registro[] = [];
  const dificuldade = new Map<string, number>();
  for (const t of TRILHAS) for (const q of t.questoes) if (!dificuldade.has(q.habilidade)) dificuldade.set(q.habilidade, r() * 0.3);
  for (const a of alunos) {
    const turma = turmas.find((t) => t.id === a.turmaId)!;
    const dominio = 0.35 + r() * 0.55;
    if (a.apelido === "Sabiá" || a.apelido === "Cuxá") continue; // ainda não jogaram: aparecem em cinza
    for (const trilha of trilhasDaEtapa(turma.etapa)) {
      if (trilha.disciplina === "Inglês" && turma.id === "t4a") continue; // 4º A ainda não começou o inglês
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

  return {
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
    criadoEm,
  };
}
