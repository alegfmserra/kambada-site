import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";

/**
 * Batiza as estampas da matraca (2026-09-03) — ver
 * site-novo/ESTUDO-ESTAMPAS-MATRACA_2026-09-03.md para o estudo completo
 * que originou esta lista. Nomes são SUGESTÃO, a confirmar com o Alexandre;
 * o que está aqui é o primeiro cadastro, não o fechamento.
 *
 * Diferente de criar-ecobags: aqui o produto-PAI já existe ("Matraca
 * Kambada Grande com Suporte"). Por isso os filhos novos são criados
 * apontando `variacao.produtoPai.id` para o ID real do pai já cadastrado —
 * NUNCA `cloneInfo: true` (isso só se aplica ao criar o pai junto com os
 * filhos na mesma chamada, e foi o que causou o bug de preço herdado em
 * criar-ecobags). Preço de cada filho novo é lido fresco do pai na hora,
 * não hardcoded — e é reconferido por releitura depois de gravar, mesma
 * disciplina de sempre.
 *
 * Tamanho: as 5 fotos mostram a peça com suporte de madeira, mas não dá
 * pra saber Grande ou Pequena só pela foto. Fica em "Grande com Suporte"
 * como padrão — o Alexandre confirmou que corrige no pente-fino.
 *
 * Estoque de cada estampa nova entra ZERADO de propósito: não existe
 * contagem por desenho em lugar nenhum (nem Bling, nem planilha) — só um
 * total "Desenhos Diversos". Zerar evita inventar uma quantidade.
 *
 * A foto é anexada por link externo (`midia.imagens.externas`), porque o
 * Bling não aceita upload de arquivo — só URL pública. O link aponta pra
 * somoskambada.com.br/fotos/..., que só resolve depois que esse deploy for
 * publicado. Até lá, o link fica cadastrado mas "quebrado" no Bling.
 *
 * A linha "All Black"/DTF (Cazumbá, Boi) ficou de fora — não tem produto-pai
 * cadastrado ainda, e falta preço. Não inventar preço: fica pendente.
 *
 * ESTA ROTA ESCREVE NO ERP: GET ensaia, POST exige aplicar=1, apenas=<slug>
 * testa uma peça de cada vez, tudo conferido por releitura.
 */

const ID_CATEGORIA = 13568333;
const ID_DEPOSITO = 14888952004;
const BASE_FOTOS = "https://somoskambada.com.br/fotos";

const NOME_PAI_ESTAMPAS = "Matraca Kambada Grande com Suporte";
const NOME_PAI_PLAY = "Matraca Kambada Play";

type NovaEstampa = { slug: string; estampa: string; foto: string };

const ESTAMPAS: NovaEstampa[] = [
  { slug: "bandeira-maranhao", estampa: "Bandeira do Maranhão", foto: "matraca-bandeira-maranhao.webp" },
  { slug: "mosaico-colorido", estampa: "Mosaico Colorido", foto: "matraca-mosaico-colorido.webp" },
  { slug: "serpente-rei-da-ilha", estampa: "Serpente e Rei da Ilha", foto: "matraca-serpente-rei-da-ilha.webp" },
  { slug: "topo-boi-preto", estampa: "Topo Boi Preto", foto: "matraca-topo-boi-preto.webp" },
  { slug: "leque-bordado", estampa: "Leque Bordado", foto: "matraca-leque-bordado.webp" },
];

const FOTO_PLAY = "matraca-play.webp";

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function nomeVariacao(e: NovaEstampa): string {
  return `Estampa:${e.estampa}`;
}

function linkFoto(arquivo: string): string {
  return `${BASE_FOTOS}/${arquivo}`;
}

/** Read-modify-write: nunca monta um corpo novo, só acrescenta a foto ao que já existe. */
async function anexarFotoSePreciso(idProduto: number, arquivo: string) {
  const atual = await chamarBling<{
    data: {
      midia?: { imagens?: { externas?: { link: string }[] } };
      [chave: string]: unknown;
    };
  }>(`/produtos/${idProduto}`, { revalidar: 0 });

  const link = linkFoto(arquivo);
  const externasAtuais = atual.data.midia?.imagens?.externas ?? [];
  if (externasAtuais.some((img) => img.link === link)) {
    return { jaTinha: true };
  }

  const corpoCorrigido = {
    ...atual.data,
    midia: {
      ...atual.data.midia,
      imagens: {
        ...atual.data.midia?.imagens,
        externas: [...externasAtuais, { link }],
      },
    },
  };
  await chamarBling(`/produtos/${idProduto}`, { metodo: "PUT", corpo: corpoCorrigido });

  const relido = await chamarBling<{
    data: { midia?: { imagens?: { externas?: { link: string }[] } } };
  }>(`/produtos/${idProduto}`, { revalidar: 0 });
  const bateu = (relido.data.midia?.imagens?.externas ?? []).some((img) => img.link === link);

  return { jaTinha: false, bateu };
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenas = url.searchParams.get("apenas");
  const incluirPlay = apenas === null || apenas === "play";
  const alvos = ESTAMPAS.filter((e) => apenas === null || e.slug === apenas);

  const todosAtuais = await listarTudo<ProdutoBling>("/produtos?criterio=2", {
    revalidar: 0,
  });
  const paiEstampas = todosAtuais.find(
    (p) => p.formato === "V" && p.nome === NOME_PAI_ESTAMPAS,
  );
  const paiPlay = todosAtuais.find(
    (p) => p.formato === "V" && p.nome === NOME_PAI_PLAY,
  );

  if (!paiEstampas) {
    return NextResponse.json(
      { erro: `Produto-pai "${NOME_PAI_ESTAMPAS}" não encontrado no Bling — não vou adivinhar.` },
      { status: 422 },
    );
  }
  if (incluirPlay && !paiPlay) {
    return NextResponse.json(
      { erro: `Produto-pai "${NOME_PAI_PLAY}" não encontrado no Bling — não vou adivinhar.` },
      { status: 422 },
    );
  }

  const filhosExistentes = todosAtuais.filter(
    (p) => p.nome.startsWith(`${NOME_PAI_ESTAMPAS} `) && p.id !== paiEstampas.id,
  );

  const plano = {
    paiEstampas: { id: paiEstampas.id, nome: paiEstampas.nome, precoAtual: paiEstampas.preco },
    paiPlay: paiPlay ? { id: paiPlay.id, nome: paiPlay.nome } : null,
    estampas: alvos.map((e) => ({
      slug: e.slug,
      variacao: nomeVariacao(e),
      foto: linkFoto(e.foto),
      acao: filhosExistentes.some((f) => f.nome === `${NOME_PAI_ESTAMPAS} ${nomeVariacao(e)}`)
        ? "já existe — só confere foto"
        : "criar",
    })),
    play: incluirPlay ? { foto: linkFoto(FOTO_PLAY), acao: "anexar foto se faltar" } : null,
  };

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({ modo: "ensaio — nada foi escrito no Bling", plano });
  }

  const feitos: Record<string, unknown>[] = [];

  if (incluirPlay && paiPlay) {
    try {
      const resultado = await anexarFotoSePreciso(paiPlay.id, FOTO_PLAY);
      feitos.push({ item: "play", idPai: paiPlay.id, ...resultado });
    } catch (err) {
      feitos.push({
        item: "play",
        erro: err instanceof Error ? err.message : String(err),
        respostaDoBling: err instanceof ErroBling ? err.corpo : undefined,
      });
    }
  }

  for (const e of alvos) {
    const nomeCompleto = `${NOME_PAI_ESTAMPAS} ${nomeVariacao(e)}`;
    try {
      let idFilho: number;
      const jaExiste = filhosExistentes.find((f) => f.nome === nomeCompleto);

      if (jaExiste) {
        idFilho = jaExiste.id;
      } else {
        // Preço lido fresco do pai — nunca hardcoded.
        const paiFresco = await chamarBling<{ data: { preco?: number } }>(
          `/produtos/${paiEstampas.id}`,
          { revalidar: 0 },
        );
        const preco = paiFresco.data.preco ?? paiEstampas.preco ?? 0;

        const criado = await chamarBling<{ data: { id: number } }>("/produtos", {
          metodo: "POST",
          corpo: {
            nome: nomeCompleto,
            preco,
            tipo: "P",
            situacao: "A",
            formato: "S",
            categoria: { id: ID_CATEGORIA },
            variacao: {
              nome: nomeVariacao(e),
              ordem: ESTAMPAS.indexOf(e) + 1,
              produtoPai: { id: paiEstampas.id },
            },
          },
        });
        idFilho = criado.data.id;
      }

      const relido = await chamarBling<{
        data: {
          preco: number;
          variacao?: { produtoPai?: { id: number } };
        };
      }>(`/produtos/${idFilho}`, { revalidar: 0 });

      const ehFilhoDeVerdade = relido.data.variacao?.produtoPai?.id === paiEstampas.id;

      const foto = await anexarFotoSePreciso(idFilho, e.foto);

      // Estoque zerado — placeholder explícito, sem dado de contagem real.
      await chamarBling("/estoques", {
        metodo: "POST",
        corpo: {
          produto: { id: idFilho },
          deposito: { id: ID_DEPOSITO },
          operacao: "B",
          quantidade: 0,
          observacoes: `Estampa nova, aguardando contagem física por desenho. Cadastrado em ${new Date().toISOString().slice(0, 10)}.`,
        },
      });

      feitos.push({
        slug: e.slug,
        idFilho,
        nome: nomeCompleto,
        ehFilhoDeVerdade,
        preco: relido.data.preco,
        foto,
        bateu: ehFilhoDeVerdade,
      });
    } catch (err) {
      feitos.push({
        slug: e.slug,
        nome: nomeCompleto,
        erro: err instanceof Error ? err.message : String(err),
        respostaDoBling: err instanceof ErroBling ? err.corpo : undefined,
      });
      break;
    }
  }

  return NextResponse.json({ modo: "aplicado", feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
