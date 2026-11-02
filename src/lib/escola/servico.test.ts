import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { _zerarMemoria, lerDados } from "./dados";
import { TRILHAS } from "./desafios";
import { ehHostDaEscola, rotaEscola } from "./host";
import {
  ErroEscola,
  entrarAlunoConta,
  ativarMembro,
  celula,
  criarAluno,
  criarMembro,
  criarProfessor,
  criarTurma,
  editarTurma,
  entrarAluno,
  entrarMembro,
  equipe,
  iniciarPartida,
  marcaDoMembro,
  novasFiguras,
  novoCodigoTurma,
  permissao,
  podeFazer,
  quemEsta,
  ranking,
  relatorioTurma,
  responder,
  marcaDoAluno,
  restaurarDemonstracao,
  trocarSenha,
  turmaPorCodigo,
  visaoGeral,
  alunosDaTurma,
  fichaAluno,
  mapaEscola,
  mapaTurma,
  nomearAluno,
} from "./servico";
import ExcelJS from "exceljs";
import { planilhaEscola, planilhaTurma } from "./exportar";
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

describe("hub da gestão Kambada", () => {
  it("arquivo de antes do hub ganha o acesso kambada sem perder nada", async () => {
    const antigo = await lerDados();
    antigo.membros = antigo.membros.filter((m) => m.papel !== "gestor");
    writeFileSync(process.env.ESCOLA_ARQUIVO!, JSON.stringify(antigo), "utf8");
    _zerarMemoria();
    const d = await lerDados();
    expect(d.membros.filter((m) => m.papel === "gestor")).toHaveLength(1);
    expect(d.alunos).toHaveLength(25); // 24 da demonstração + a conta de teste "aluno"
  });

  it("a gestão entra e cadastra a coordenação; a coordenação não", async () => {
    expect(await entrarMembro("kambada", "senha-dos-testes-123")).not.toBeNull();
    const coord = await membro("coordenacao");
    await expect(criarMembro(coord, { nome: "Outra Coord", usuario: "coord.2", papel: "coordenacao" })).rejects.toThrow(/gestão Kambada/);
    const acesso = await criarMembro(await membro("kambada"), { nome: "Coordenação do Fundamental", usuario: "coord.fund", papel: "coordenacao" });
    expect((await entrarMembro(acesso.usuario, acesso.senha))?.papel).toBe("coordenacao");
    // a coordenação não vê o acesso da Kambada na equipe
    expect((await equipe(coord)).membros.some((m) => m.papel === "gestor")).toBe(false);
  });

  it("permissão desligada vale na hora: sem relatório, sem cadastro, sem figuras", async () => {
    const gestor = await membro("kambada");
    await permissao(gestor, "m-ana", "relatorio", false);
    await permissao(gestor, "m-ana", "cadastrar-alunos", false);
    const ana = await membro("prof.ana");
    expect(podeFazer(ana, "relatorio")).toBe(false);
    expect(podeFazer(ana, "cartoes")).toBe(true);
    await expect(relatorioTurma(ana, "t4a")).rejects.toThrow(/Ver relatório/);
    await expect(criarAluno(ana, "t4a", "GuaraNovo")).rejects.toThrow(/Cadastrar alunos/);
    await permissao(gestor, "m-ana", "cadastrar-alunos", true);
    await permissao(gestor, "m-ana", "cartoes", false);
    const ana2 = await membro("prof.ana");
    expect((await criarAluno(ana2, "t4a", "GuaraNovo")).figuras).toEqual([]);
    await expect(novasFiguras(ana2, "t4a-a1")).rejects.toBeInstanceOf(ErroEscola);
    // professor e coordenação não mexem em permissão
    await expect(permissao(await membro("coordenacao"), "m-ana", "relatorio", true)).rejects.toBeInstanceOf(ErroEscola);
  });

  it("suspender derruba a sessão aberta e reativar devolve", async () => {
    const gestor = await membro("kambada");
    const ana = await membro("prof.ana");
    const sessao = lerSessaoEscola(criarSessaoEscola("professor", ana.id, marcaDoMembro(ana)));
    expect(await quemEsta(sessao)).not.toBeNull();
    await ativarMembro(gestor, ana.id, false);
    expect(await quemEsta(sessao)).toBeNull();
    await ativarMembro(gestor, ana.id, true);
    expect(await quemEsta(sessao)).not.toBeNull();
    // ninguém suspende a si mesmo nem a gestão
    await expect(ativarMembro(gestor, gestor.id, false)).rejects.toBeInstanceOf(ErroEscola);
  });

  it("restaurar a demonstração é só da gestão e mantém o acesso Kambada", async () => {
    const gestor = await membro("kambada");
    await expect(restaurarDemonstracao(await membro("coordenacao"))).rejects.toBeInstanceOf(ErroEscola);
    await trocarSenha(gestor, "senha-dos-testes-123", "outra-senha-longa");
    await criarTurma(gestor, "9º ano Z", "f2", []);
    await restaurarDemonstracao(await membro("kambada"));
    const d = await lerDados();
    expect(d.turmas.some((t) => t.nome === "9º ano Z")).toBe(false);
    expect(await entrarMembro("kambada", "outra-senha-longa")).not.toBeNull();
    expect(d.log?.[0]?.texto).toMatch(/restaurou/);
  });

  it("registro de atividades guarda quem fez o quê", async () => {
    const gestor = await membro("kambada");
    await editarTurma(gestor, "t4a", "4º ano Azul", "f1");
    const { codigo } = await novoCodigoTurma(gestor, "t4a");
    expect(await turmaPorCodigo("4821")).toBeNull();
    expect((await turmaPorCodigo(codigo))?.turma).toBe("4º ano Azul");
    const v = await visaoGeral(await membro("kambada"));
    expect(v.log.map((e) => e.texto).join(" | ")).toMatch(/trocou o código do 4º ano Azul/);
    await expect(visaoGeral(await membro("coordenacao"))).rejects.toBeInstanceOf(ErroEscola);
  });
});

describe("contas de teste", () => {
  it("professor vê todas as turmas e aluno entra por usuário e senha", async () => {
    const p = await entrarMembro("professor", "senha-dos-testes-123");
    expect(p?.papel).toBe("professor");
    const d = await lerDados();
    expect(d.turmas.every((t) => t.professorIds.includes(p!.id))).toBe(true);
    expect((await entrarAlunoConta("aluno", "senha-dos-testes-123"))?.aluno.turmaId).toBe("t4a");
    expect(await entrarAlunoConta("aluno", "errada")).toBeNull();
    expect(await entrarAlunoConta("CaranguejoVeloz", "senha-dos-testes-123")).toBeNull();
    // a conta de teste nasce sem respostas
    expect(d.registros.some((r) => r.alunoId === "t4a-teste")).toBe(false);
  });
});

describe("mapa de reforço e privacidade do nome", () => {
  it("o nome de verdade só aparece para a escola; ranking, entrada e gestão Kambada veem só o apelido", async () => {
    const ana = await membro("prof.ana");
    const gestor = await membro("kambada");
    const daAna = await alunosDaTurma(ana, "t4a");
    expect(daAna.alunos.find((a) => a.apelido === "CaranguejoVeloz")?.nome).toBe("Davi Santos");
    expect((await alunosDaTurma(gestor, "t4a")).alunos.every((a) => a.nome === null)).toBe(true);
    expect((await mapaTurma(gestor, "t4a")).alunos.every((a) => a.nome === null)).toBe(true);
    const publico = JSON.stringify([await ranking(), await ranking("t4a"), await turmaPorCodigo("4821")]);
    expect(publico).not.toContain("Davi Santos");
    await expect(nomearAluno(gestor, "t4a-a1", "Outro Nome")).rejects.toBeInstanceOf(ErroEscola);
    expect((await nomearAluno(ana, "t4a-a1", "Davi S. Santos")).nome).toBe("Davi S. Santos");
    await expect(nomearAluno(ana, "t4a-a1", "<script>")).rejects.toBeInstanceOf(ErroEscola);
  });

  it("mapa da turma: urgentes primeiro, quem não jogou aparece, jogos com uso", async () => {
    const m = await mapaTurma(await membro("prof.ana"), "t5b");
    expect(m.alunos).toHaveLength(8);
    const ordem = ["reforco", "atencao", "nada", "bem"];
    const idx = m.alunos.map((a) => ordem.indexOf(a.situacao));
    expect(idx).toEqual([...idx].sort((x, y) => x - y));
    expect(m.alunos.find((a) => a.apelido === "Sabiá")?.situacao).toBe("nada");
    expect(m.contagem.reforco + m.contagem.atencao + m.contagem.bem + m.contagem.nada).toBe(8);
    expect(m.jogos.length).toBeGreaterThan(0);
    expect(m.jogos.every((j) => j.alunos <= j.podiam)).toBe(true);
    // professor fora da turma não vê; sem "Ver relatório" também não
    await expect(mapaTurma(await membro("prof.lucia"), "t5b")).rejects.toBeInstanceOf(ErroEscola);
    await permissao(await membro("kambada"), "m-ana", "relatorio", false);
    await expect(mapaTurma(await membro("prof.ana"), "t5b")).rejects.toBeInstanceOf(ErroEscola);
  });

  it("ficha do aluno mostra o erro escolhido e o que ele revela", async () => {
    const f = await fichaAluno(await membro("prof.ana"), "t4a-a1");
    expect(f.habilidades.length).toBeGreaterThan(0);
    const comErro = f.respostas.find((r) => r.escolheu);
    if (comErro) expect(comErro.pergunta).not.toBe("");
    await expect(fichaAluno(await membro("prof.lucia"), "t4a-a1")).rejects.toBeInstanceOf(ErroEscola);
  });

  it("planilha da turma e da escola: abas certas e nome só para a escola", async () => {
    const lerNomes = async (buf: Buffer) => {
      const livro = new ExcelJS.Workbook();
      await livro.xlsx.load(buf as never);
      return { abas: livro.worksheets.map((w) => w.name), texto: JSON.stringify(livro.worksheets.map((w) => w.getSheetValues())) };
    };
    const daAna = await lerNomes((await planilhaTurma(await membro("prof.ana"), "t4a")).arquivo);
    expect(daAna.abas).toEqual(["Quem precisa de reforço", "Por habilidade", "Jogos mais jogados", "Erros mais comuns"]);
    expect(daAna.texto).toContain("Davi Santos");
    const doGestor = await lerNomes((await planilhaEscola(await membro("kambada"))).arquivo);
    expect(doGestor.texto).not.toContain("Davi Santos");
    expect(doGestor.texto).toContain("CaranguejoVeloz");
    expect((await mapaEscola(await membro("coordenacao"))).alunos).toHaveLength(25);
    await expect(planilhaEscola(await membro("prof.ana"))).rejects.toBeInstanceOf(ErroEscola);
  });
});
