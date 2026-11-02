import ExcelJS from "exceljs";
import type { Membro } from "./dados";
import { disciplinasDaEtapa, mapaEscola, mapaTurma, relatorioTurma, type MapaAluno, type UsoJogo } from "./servico";
import { SITUACAO, SIMBOLO } from "./tipos";

/**
 * Planilhas do portal (.xlsx), no visual da Kambada (cabeçalho amarelo).
 * Mesmas permissões das telas: quem não vê o relatório não baixa; o nome de
 * verdade do aluno só sai para a escola (para a gestão Kambada, só o apelido).
 */

const AMARELO = "FFFFCC29";
const COR_SITUACAO: Record<string, string> = { reforco: "FFF6D3CD", atencao: "FFFCEFC2", bem: "FFD3EBDD", nada: "FFEDEDED" };
const data = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Fortaleza" }).format(new Date(iso)) : "");
const pontos = (l: { disciplina: string; habilidade: string }[]) => l.map((p) => `${p.disciplina}: ${p.habilidade}`).join("; ");

function aba(livro: ExcelJS.Workbook, nome: string, colunas: { titulo: string; largura: number }[]) {
  const ws = livro.addWorksheet(nome, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = colunas.map((c) => ({ header: c.titulo, width: c.largura }));
  const cab = ws.getRow(1);
  cab.font = { bold: true, color: { argb: "FF201E1F" } };
  cab.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARELO } };
  cab.alignment = { vertical: "middle", wrapText: true };
  cab.height = 22;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };
  return ws;
}

function abaAlunos(livro: ExcelJS.Workbook, alunos: MapaAluno[], nomes: boolean, comTurma: boolean) {
  const ws = aba(livro, "Quem precisa de reforço", [
    { titulo: "Situação", largura: 20 },
    ...(comTurma ? [{ titulo: "Turma", largura: 12 }] : []),
    ...(nomes ? [{ titulo: "Nome (só a escola vê)", largura: 26 }] : []),
    { titulo: "Apelido", largura: 18 },
    { titulo: "Precisa de reforço em", largura: 48 },
    { titulo: "Quase lá em", largura: 40 },
    { titulo: "Pontos", largura: 9 },
    { titulo: "Respostas", largura: 11 },
    { titulo: "Última vez que jogou", largura: 14 },
    { titulo: "Dias sem jogar", largura: 10 },
  ]);
  for (const a of alunos) {
    const linha = ws.addRow([
      SITUACAO[a.situacao].rotulo,
      ...(comTurma ? [a.turma] : []),
      ...(nomes ? [a.nome ?? ""] : []),
      a.apelido,
      pontos(a.reforcoEm),
      pontos(a.quaseEm),
      a.pontos,
      a.respostas,
      data(a.ultima),
      a.diasSemJogar ?? "",
    ]);
    linha.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_SITUACAO[a.situacao] } };
    linha.alignment = { vertical: "top", wrapText: true };
  }
}

function abaJogos(livro: ExcelJS.Workbook, jogos: UsoJogo[]) {
  const ws = aba(livro, "Jogos mais jogados", [
    { titulo: "Jogo", largura: 28 },
    { titulo: "Disciplina", largura: 12 },
    { titulo: "Alunos que jogaram", largura: 12 },
    { titulo: "De quantos podiam", largura: 12 },
    { titulo: "Respostas", largura: 11 },
    { titulo: "% certo de primeira", largura: 12 },
    { titulo: "Respostas no Arraial 3D", largura: 12 },
  ]);
  for (const j of jogos) ws.addRow([j.titulo, j.disciplina, j.alunos, j.podiam, j.respostas, j.primeira / 100, j.noArraial]).getCell(6).numFmt = "0%";
}

async function paraBuffer(livro: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await livro.xlsx.writeBuffer());
}

function novoLivro(): ExcelJS.Workbook {
  const livro = new ExcelJS.Workbook();
  livro.creator = "Kambada Play na escola";
  livro.created = new Date();
  return livro;
}

export async function planilhaTurma(m: Membro, turmaId: string): Promise<{ nome: string; arquivo: Buffer }> {
  const mapa = await mapaTurma(m, turmaId);
  const livro = novoLivro();
  abaAlunos(livro, mapa.alunos, mapa.nomes, false);

  // Matriz aluno × habilidade, uma coluna por habilidade de cada disciplina.
  const rels = await Promise.all(disciplinasDaEtapa(mapa.turma.etapa).map((disc) => relatorioTurma(m, turmaId, disc)));
  const colunas = rels.flatMap((r) => r.habilidades.map((h) => ({ disc: r.disciplina, h, rel: r })));
  const ws = aba(livro, "Por habilidade", [
    ...(mapa.nomes ? [{ titulo: "Nome (só a escola vê)", largura: 26 }] : []),
    { titulo: "Apelido", largura: 18 },
    ...colunas.map((c) => ({ titulo: `${c.disc} · ${c.h}`, largura: 14 })),
  ]);
  const nomeDe = new Map(mapa.alunos.map((a) => [a.id, a.nome ?? ""]));
  const simbolo = { domina: SIMBOLO.primeira, quase: SIMBOLO.segunda, reforco: SIMBOLO.reforco, nada: "·" } as const;
  for (const linha of rels[0]?.linhas ?? []) {
    const celulas = colunas.map((c) => simbolo[c.rel.linhas.find((l) => l.aluno.id === linha.aluno.id)!.celulas[c.h].status]);
    const r = ws.addRow([...(mapa.nomes ? [nomeDe.get(linha.aluno.id) ?? ""] : []), linha.aluno.apelido, ...celulas]);
    r.alignment = { horizontal: "center" };
  }
  ws.addRow([]);
  ws.addRow(["✓ já domina · ↻ quase lá (acerta na segunda) · ✗ precisa de reforço · · ainda não jogou"]);

  abaJogos(livro, mapa.jogos);

  const erros = aba(livro, "Erros mais comuns", [
    { titulo: "Disciplina", largura: 12 },
    { titulo: "Habilidade", largura: 18 },
    { titulo: "Pergunta", largura: 50 },
    { titulo: "Resposta errada escolhida", largura: 22 },
    { titulo: "Quantos alunos", largura: 10 },
    { titulo: "O que esse erro revela", largura: 50 },
    { titulo: "Apelidos", largura: 30 },
  ]);
  for (const r of rels) for (const e of r.erros) erros.addRow([r.disciplina, e.habilidade, e.questao, e.escolha, e.quantos, e.diagnostico, e.apelidos.join(", ")]).alignment = { vertical: "top", wrapText: true };

  return { nome: `kambada-play_${mapa.turma.nome}`, arquivo: await paraBuffer(livro) };
}

export async function planilhaEscola(m: Membro): Promise<{ nome: string; arquivo: Buffer }> {
  const mapa = await mapaEscola(m);
  const livro = novoLivro();
  const ws = aba(livro, "Turmas", [
    { titulo: "Turma", largura: 14 },
    { titulo: "Alunos", largura: 9 },
    { titulo: SITUACAO.reforco.rotulo, largura: 14 },
    { titulo: SITUACAO.atencao.rotulo, largura: 12 },
    { titulo: SITUACAO.bem.rotulo, largura: 12 },
    { titulo: SITUACAO.nada.rotulo, largura: 14 },
  ]);
  for (const t of mapa.turmas) ws.addRow([t.nome, t.total, t.contagem.reforco, t.contagem.atencao, t.contagem.bem, t.contagem.nada]);
  abaAlunos(livro, mapa.alunos, mapa.nomes, true);
  abaJogos(livro, mapa.jogos);
  return { nome: "kambada-play_escola", arquivo: await paraBuffer(livro) };
}
