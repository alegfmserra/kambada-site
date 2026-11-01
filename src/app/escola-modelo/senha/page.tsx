import { TrocarSenha } from "@/components/escola/Coordenacao";
import { exigir } from "@/lib/escola/pagina";

export const metadata = { title: "Trocar senha" };

export default async function SenhaPagina() {
  const { membro } = await exigir("professor", "coordenacao");
  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Trocar senha</h1>
        <p className="text-texto-suave">{membro.nome} · usuário {membro.usuario}</p>
      </div>
      <TrocarSenha />
    </div>
  );
}
