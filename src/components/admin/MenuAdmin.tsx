import Link from "next/link";
import { sair } from "@/app/admin/acoes";

/** Navegação da área de controle — pedidos e cupons. */
export default function MenuAdmin({ ativa }: { ativa: "pedidos" | "cupons" }) {
  const item = (href: string, rotulo: string, chave: typeof ativa) => (
    <Link
      href={href}
      aria-current={ativa === chave ? "page" : undefined}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        ativa === chave ? "bg-kambada-amarelo text-kambada-grafite" : "border border-borda hover:border-kambada-amarelo-escuro"
      }`}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav aria-label="Área de controle" className="flex flex-wrap items-center gap-2">
      {item("/admin/pedidos", "Pedidos", "pedidos")}
      {item("/admin/cupons", "Cupons", "cupons")}
      <form action={sair} className="ml-auto">
        <button type="submit" className="rounded-full border border-borda px-4 py-2 text-sm font-semibold hover:border-kambada-amarelo-escuro">
          Sair
        </button>
      </form>
    </nav>
  );
}
