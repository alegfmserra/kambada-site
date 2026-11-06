import { quemPede, tratar } from "@/lib/escola/api";
import { abrirArquivo } from "@/lib/escola/concursoServico";

/** Abre um arquivo do concurso (só para quem pode ver: ver `abrirArquivo`). Nunca vai para cache. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const quem = await quemPede(req);
  if (!quem) return new Response("Entre no portal.", { status: 401 });
  try {
    const { id } = await params;
    const { arquivo, bytes } = await abrirArquivo(quem, id);
    const ascii = arquivo.nome.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/"/g, "") || "arquivo";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": arquivo.tipo,
        "Content-Disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return tratar(e);
  }
}
