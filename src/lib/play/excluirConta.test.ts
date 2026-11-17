import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { criarSessaoDeConta, lerSessao } from "./acesso";
import { autenticar, buscarPorId, cadastrar, contaDaSessao, excluirConta, listarContas, marcaDaSenha, type Conta } from "./contas";
import { excluirContaDoPlay } from "./excluirConta";
import { listarEventosPartida, registrarEventoPartida } from "./jogos/partidas";
import { apagarPerfil, lerPerfil, registrarEventos } from "./jogos/perfilArmazem";
import { anonimizarJogador, dadosDoPlacar, jogadorDaConta, lerPlacar, registrarPontuacao } from "./jogos/placar";

const QUARTA = new Date("2026-11-11T15:00:00Z"); // semana de 09/11
const SENHA = "senha-de-teste";

async function criar(nome: string): Promise<Conta> {
  const r = await cadastrar({ nome, email: `${nome.toLowerCase()}@exemplo.com`, senha: SENHA, novidades: true }, QUARTA);
  if (!r.ok) throw new Error(r.mensagem);
  return r.conta;
}

describe("excluir a conta do Kambada Play", () => {
  let ana: Conta;
  let beto: Conta;

  beforeAll(async () => {
    const dir = await mkdtemp(join(tmpdir(), "kambada-excluir-conta-"));
    process.env.PLAY_CONTAS_ARQUIVO = join(dir, "contas.json");
    process.env.PLAY_PLACAR_ARQUIVO = join(dir, "placar.json");
    process.env.PLAY_PERFIS_ARQUIVO = join(dir, "perfis.json");
    process.env.PARTIDAS_ARQUIVO = join(dir, "partidas.jsonl");
    process.env.CUPONS_ARQUIVO = join(dir, "cupons.json");
    ana = await criar("Ana");
    beto = await criar("Beto");
    for (const c of [ana, beto]) {
      await registrarPontuacao({ jogador: jogadorDaConta(c.id), apelido: `Apelido${c.nome}`, avatar: "boi", jogo: "quiz", pontos: c === ana ? 1500 : 900 }, QUARTA);
      await registrarPontuacao({ jogador: jogadorDaConta(c.id), apelido: `Apelido${c.nome}`, avatar: "boi", jogo: "memoria", pontos: 800 }, QUARTA);
      await registrarEventos(c.id, [{ tipo: "acerto" }]);
      await registrarEventoPartida({ jogo: "quiz", tipo: "inicio", nivel: "facil", conta: c.id }, QUARTA);
      await registrarEventoPartida({ jogo: "quiz", tipo: "fim", nivel: "facil", conta: c.id }, QUARTA);
    }
    await registrarEventoPartida({ jogo: "memoria", tipo: "inicio" }, QUARTA); // visitante, sem conta
    // Um prêmio antigo da Ana, para conferir que também perde o vínculo.
    const arquivo = process.env.PLAY_PLACAR_ARQUIVO;
    const d = JSON.parse(await readFile(arquivo, "utf8")) as { premios: unknown[] };
    d.premios.push({ semana: "2026-11-02", jogador: jogadorDaConta(ana.id), posicao: 1, percentual: 10, codigo: "PLAY-ANA123", emitidoEm: QUARTA.toISOString() });
    await writeFile(arquivo, JSON.stringify(d), "utf8");
  });

  it("senha errada (ou nenhuma) não apaga nada", async () => {
    expect(await excluirContaDoPlay(ana.id, "senha-errada", "https://exemplo.test")).toEqual({ ok: false, mensagem: "Senha incorreta." });
    expect(await excluirContaDoPlay(ana.id, undefined, "https://exemplo.test")).toMatchObject({ ok: false });
    expect(await excluirContaDoPlay("conta-que-nao-existe", SENHA, "https://exemplo.test")).toMatchObject({ ok: false });
    expect(await buscarPorId(ana.id)).not.toBeNull();
    expect((await lerPlacar({ periodo: "semana" }, QUARTA)).map((l) => l.apelido)).toEqual(["ApelidoAna", "ApelidoBeto"]);
  });

  it("com a senha certa, apaga a conta e tudo o que estava ligado a ela", async () => {
    expect((await lerPerfil(ana.id)).xp).toBeGreaterThan(0);
    const sessao = lerSessao(criarSessaoDeConta(ana.id, marcaDaSenha(ana)));
    expect(await contaDaSessao(sessao)).not.toBeNull();

    const r = await excluirContaDoPlay(ana.id, SENHA, "https://exemplo.test");
    expect(r).toMatchObject({ ok: true, pontuacoesAnonimizadas: 3, perfilApagado: true, partidasDesvinculadas: 2, falhas: [] });

    // A conta some, a sessão deixa de valer e a senha não entra mais.
    expect(await buscarPorId(ana.id)).toBeNull();
    expect(await contaDaSessao(sessao)).toBeNull();
    expect(await autenticar("ana@exemplo.com", SENHA)).toBeNull();
    expect((await listarContas()).map((c) => c.nome)).toEqual(["Beto"]);

    // Ranking: a pontuação fica, mas como "Brincante" e sem o identificador da conta.
    const placar = await lerPlacar({ periodo: "semana" }, QUARTA);
    expect(placar.map((l) => [l.apelido, l.pontos])).toEqual([["Brincante", 2300], ["ApelidoBeto", 1700]]);
    const bruto = await dadosDoPlacar();
    const jogadorDaAna = jogadorDaConta(ana.id);
    expect(bruto.pontuacoes.some((p) => p.jogador === jogadorDaAna)).toBe(false);
    expect(bruto.premios.some((p) => p.jogador === jogadorDaAna)).toBe(false);
    expect(bruto.premios.find((p) => p.codigo === "PLAY-ANA123")?.jogador).toMatch(/^apagado-/);
    expect(JSON.stringify(bruto)).not.toContain("ApelidoAna");

    // Perfil do Arraial zerado e partidas sem o id da conta (a contagem continua).
    expect((await lerPerfil(ana.id)).xp).toBe(0);
    const partidas = await listarEventosPartida();
    expect(partidas).toHaveLength(5);
    expect(partidas.some((e) => e.conta === ana.id)).toBe(false);
    expect(await readFile(process.env.PARTIDAS_ARQUIVO!, "utf8")).not.toContain(ana.id);
  });

  it("não mexe em nada das outras contas", async () => {
    expect(await buscarPorId(beto.id)).not.toBeNull();
    expect((await lerPerfil(beto.id)).xp).toBeGreaterThan(0);
    expect((await listarEventosPartida()).filter((e) => e.conta === beto.id)).toHaveLength(2);
    expect((await dadosDoPlacar()).pontuacoes.filter((p) => p.jogador === jogadorDaConta(beto.id))).toHaveLength(2);
  });

  it("excluir duas vezes não quebra, e as peças sozinhas respondem certo quando não há o que apagar", async () => {
    expect(await excluirContaDoPlay(ana.id, SENHA, "https://exemplo.test")).toMatchObject({ ok: false });
    expect(await excluirConta(ana.id, SENHA)).toMatchObject({ ok: false, motivo: "nao-encontrada" });
    expect(await apagarPerfil(ana.id)).toBe(false);
    expect(await anonimizarJogador(jogadorDaConta(ana.id))).toBe(0);
  });
});
