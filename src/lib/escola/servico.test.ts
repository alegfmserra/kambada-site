import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { _zerarMemoria, lerDados } from "./dados";
import { TRILHAS } from "./desafios";
import { ehHostDaEscola, rotaEscola } from "./host";
import {
  ErroEscola,
  celula,
  criarAluno,
  criarProfessor,
  entrarAluno,
  entrarMembro,
  iniciarPartida,
  novasFiguras,
  quemEsta,
  ranking,
  relatorioTurma,
  responder,
  marcaDoAluno,
  turmaPorCodigo,
} from "./servico";
import { criarSessaoEscola, lerSessaoEscola } from "./sessao";

beforeEach(() => {
  process.env.ESCOLA_ARQUIVO = join(mkdtempSync(join(tmpdir(), "kambada-escola-")), "escola.json");
  process.env.ESCOLA_DEMO_SENHA = "senha-dos-testes-123";
  _zerarMemoria();
});

async function membro(usuario: string) {
  const d = await lerDados();
  return d.membros.find((m) => m.usuario === usuario)!;
}

describe("host do portal", () => {
  it("só o subdomínio modelo. é da escola", () => {
    expect(ehHostDaEscola("modelo.somoskambada.com.br")).toBe(true);
    expect(ehHostDaEscola("modelo.localhost:3000")).toBe(true);
    expect(ehHostDaEscola("somoskambada.com.br")).toBe(false);
    expect(ehHostDaEscola("www.somoskambada.com.br")).toBe(false);
    expect(ehHostDaEscola(null)).toBe(false);
    expect(rotaEscola("/aluno")).toBe("/kambadaplay/aluno");
    expect(rotaEscola()).toBe("/kambadaplay");
  });
});

describe("entrada", () => {
  it("aluno entra com código + apelido + figuras certas", async () => {
    const t = await turmaPorCodigo("4821");
    expect(t?.turma).toBe("4º ano A");
    const d = await lerDados();
    const a = d.alunos.find((x) => x.turmaId === "t4a")!;
    expect(await entrarAluno("4821", a.id, a.figuras)).not.toBeNull();
    expect(await entrarAluno("4821", a.id, [(a.figuras[0] + 1) % 9, a.figuras[1], a.figuras[2]])).toBeNull();
    // aluno de outra turma com o código errado não entra
    expect(await entrarAluno("5730", a.id, a.figuras)).toBeNull();
    expect(await turmaPorCodigo("abc")).toBeNull();
  });

  it("equipe entra com usuário e senha; senha errada não", async () => {
    expect(await entrarMembro("prof.ana", "senha-dos-testes-123")).not.toBeNull();
    expect(await entrarMembro("PROF.ANA ", "senha-dos-testes-123")).not.toBeNull();
    expect(await entrarMembro("prof.ana", "errada")).toBeNull();
    expect(await entrarMembro("ninguem", "senha-dos-testes-123")).toBeNull();
  });

  it("nova senha de figuras derruba a sessão antiga do aluno", async () => {
    const d = await lerDados();
    const a = d.alunos[0];
    const s = lerSessaoEscola(criarSessaoEscola("aluno", a.id, marcaDoAluno(a)));
    expect((await quemEsta(s))?.papel).toBe("aluno");
    const antes = a.figuras.join();
    let trocou = await novasFiguras(await membro("prof.ana"), a.id);
    while (trocou.figuras.join() === antes) trocou = await novasFiguras(await membro("prof.ana"), a.id);
    expect(await quemEsta(s)).toBeNull();
  });
});

describe("desafio", () => {
  it("duas tentativas: ✓ de primeira, ↻ na segunda, ✗ depois de dois erros", async () => {
    const d = await lerDados();
    const aluno = d.alunos.find((x) => x.apelido === "Sabiá")!; // sem histórico
    const turma = d.turmas.find((t) => t.id === aluno.turmaId)!;
    const trilha = TRILHAS.find((t) => t.etapa === turma.etapa)!;
    let estado = await iniciarPartida(aluno, turma, trilha.id);
    expect(estado.questao).not.toHaveProperty("correta");

    const certaNaTela = (e: typeof estado) => {
      const q = trilha.questoes.find((x) => x.enunciado === e.questao.enunciado)!;
      return e.questao.opcoes.indexOf(q.opcoes[q.correta]);
    };
    const erradaNaTela = (e: typeof estado, menos: number[] = []) => e.questao.opcoes.findIndex((_, i) => i !== certaNaTela(e) && !menos.includes(i));

    // 1) de primeira
    let r = await responder(aluno, estado.partida, certaNaTela(estado));
    expect(r.resultado).toBe("primeira");
    expect(r.pontosGanhos).toBe(100);
    estado = r.proxima!;

    // 2) erra, ganha dica, acerta na segunda
    const e1 = erradaNaTela(estado);
    r = await responder(aluno, estado.partida, e1);
    expect(r.certo).toBe(false);
    expect(r.dica).toBeTruthy();
    expect(r.resultado).toBeUndefined();
    await expect(responder(aluno, estado.partida, e1)).rejects.toBeInstanceOf(ErroEscola); // a mesma opção não vale de novo
    r = await responder(aluno, estado.partida, certaNaTela(estado));
    expect(r.resultado).toBe("segunda");
    expect(r.pontosGanhos).toBe(50);
    estado = r.proxima!;

    // 3) erra duas vezes
    const p1 = erradaNaTela(estado);
    await responder(aluno, estado.partida, p1);
    r = await responder(aluno, estado.partida, erradaNaTela(estado, [p1]));
    expect(r.resultado).toBe("reforco");
    expect(r.correta).toBe(certaNaTela(estado));

    const regs = (await lerDados()).registros.filter((x) => x.alunoId === aluno.id);
    expect(regs.map((x) => x.resultado)).toEqual(["primeira", "segunda", "reforco"]);
    expect(regs[0].errou).toBeNull();
    expect(regs[2].errou).not.toBeNull();
  });

  it("aluno não abre trilha de outra etapa", async () => {
    const d = await lerDados();
    const aluno = d.alunos.find((x) => x.turmaId === "t4a")!;
    const turma = d.turmas.find((t) => t.id === "t4a")!;
    await expect(iniciarPartida(aluno, turma, "feira-da-jucara")).rejects.toBeInstanceOf(ErroEscola);
  });

  it("ranking conta a melhor resposta de cada pergunta (repetir não soma)", async () => {
    const d = await lerDados();
    const aluno = d.alunos.find((x) => x.apelido === "Sabiá")!;
    const turma = d.turmas.find((t) => t.id === aluno.turmaId)!;
    const trilha = TRILHAS.find((t) => t.etapa === turma.etapa)!;
    for (let rodada = 0; rodada < 2; rodada++) {
      let e = await iniciarPartida(aluno, turma, trilha.id);
      for (;;) {
        const q = trilha.questoes.find((x) => x.enunciado === e.questao.enunciado)!;
        const r = await responder(aluno, e.partida, e.questao.opcoes.indexOf(q.opcoes[q.correta]));
        if (r.fim) break;
        e = r.proxima!;
      }
    }
    const rank = await ranking(turma.id);
    expect(rank.alunos.find((a) => a.id === aluno.id)?.pontos).toBe(trilha.questoes.length * 100);
  });
});

describe("permissões e relatório", () => {
  it("professor só vê e mexe nas turmas dele", async () => {
    const lucia = await membro("prof.lucia"); // só 8º A
    await expect(relatorioTurma(lucia, "t4a")).rejects.toBeInstanceOf(ErroEscola);
    await expect(criarAluno(lucia, "t4a", "Intruso")).rejects.toBeInstanceOf(ErroEscola);
    const rel = await relatorioTurma(lucia, "t8a", "Matemática");
    expect(rel.habilidades.length).toBeGreaterThan(0);
    expect(rel.linhas).toHaveLength(8);
  });

  it("só a coordenação cria professor", async () => {
    await expect(criarProfessor(await membro("prof.ana"), "X", "prof.x", [], [])).rejects.toBeInstanceOf(ErroEscola);
    const acesso = await criarProfessor(await membro("coordenacao"), "Joana Pereira", "prof.joana", ["Matemática"], ["t4a"]);
    expect(await entrarMembro(acesso.usuario, acesso.senha)).not.toBeNull();
  });

  it("apelido não aceita nome completo com espaço nem repetido", async () => {
    const ana = await membro("prof.ana");
    await expect(criarAluno(ana, "t4a", "Maria da Silva")).rejects.toThrow(/apelido/i);
    await expect(criarAluno(ana, "t4a", "PipaAzul")).rejects.toThrow(/já existe/i);
    expect((await criarAluno(ana, "t4a", "GuaraNovo")).figuras).toHaveLength(3);
  });

  it("célula: últimas 6 respostas decidem a cor", () => {
    const r = (resultado: "primeira" | "segunda" | "reforco") => ({ resultado }) as never;
    expect(celula([]).status).toBe("nada");
    expect(celula([r("primeira"), r("primeira"), r("primeira"), r("segunda")]).status).toBe("domina");
    expect(celula([r("segunda"), r("segunda")]).status).toBe("quase");
    expect(celula([r("reforco"), r("reforco"), r("segunda")]).status).toBe("reforco");
  });

  it("relatório mostra os erros mais comuns com o diagnóstico", async () => {
    const rel = await relatorioTurma(await membro("prof.ana"), "t4a", "Matemática");
    expect(rel.erros.length).toBeGreaterThan(0);
    expect(rel.erros[0].diagnostico).not.toBe("");
  });
});
