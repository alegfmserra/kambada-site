import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { idAleatorio } from "../play/jogos/seguranca";
import { arquivoEscola } from "./dados";
import { ErroEscola } from "./servico";

/**
 * Arquivos do portal (somente servidor): a redação que o aluno manda em PDF
 * ou foto, e a correção que o professor anexa. Ficam na pasta persistente,
 * ao lado dos dados (`escola-arquivos/`), com nome aleatório e sem extensão;
 * o tipo e o nome original vão nos dados. Só saem pela rota com sessão
 * (`/api/escola/arquivo/<id>`), que confere quem pode ver.
 *
 * Protótipo: quando a escola de verdade chegar, isto vai para o storage do
 * Supabase, sem mudar as telas.
 */

export type Arquivo = { id: string; nome: string; tipo: TipoArquivo; tamanho: number; em: string };
export type TipoArquivo = "application/pdf" | "image/jpeg" | "image/png";

export const LIMITE_BYTES = 5 * 1024 * 1024;
export const ACEITOS = "application/pdf,image/jpeg,image/png";

const pasta = () => join(dirname(arquivoEscola()), "escola-arquivos");
const caminho = (id: string) => {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) throw new ErroEscola("Arquivo não encontrado.", 404);
  return join(pasta(), id);
};

/** O tipo vem dos primeiros bytes (não da extensão que o navegador manda). */
function tipoPelosBytes(b: Uint8Array): TipoArquivo | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf"; // %PDF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  return null;
}

function nomeLimpo(bruto: string, tipo: TipoArquivo): string {
  const ext = tipo === "application/pdf" ? ".pdf" : tipo === "image/png" ? ".png" : ".jpg";
  const base = bruto.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 60) || "redacao";
  return base + ext;
}

export async function guardarArquivo(bytes: Uint8Array, nomeOriginal: string): Promise<Arquivo> {
  if (!bytes.length) throw new ErroEscola("O arquivo está vazio.");
  if (bytes.length > LIMITE_BYTES) throw new ErroEscola("O arquivo passa de 5 MB. Diminua a foto ou o PDF e tente de novo.");
  const tipo = tipoPelosBytes(bytes);
  if (!tipo) throw new ErroEscola("Mande um PDF ou uma foto (JPG ou PNG).");
  const id = idAleatorio(16);
  await mkdir(pasta(), { recursive: true });
  await writeFile(caminho(id), bytes);
  return { id, nome: nomeLimpo(nomeOriginal, tipo), tipo, tamanho: bytes.length, em: new Date().toISOString() };
}

export async function lerArquivo(id: string): Promise<Buffer> {
  try {
    return await readFile(caminho(id));
  } catch {
    throw new ErroEscola("Arquivo não encontrado.", 404);
  }
}

export async function apagarArquivo(id: string | undefined): Promise<void> {
  if (!id) return;
  await rm(caminho(id), { force: true });
}
