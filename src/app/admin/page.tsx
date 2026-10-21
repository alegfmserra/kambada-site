import { redirect } from "next/navigation";

/** /admin sozinho dava 404 (Alexandre, 20/10/2026): a área de controle começa nos pedidos. */
export default function Admin() {
  redirect("/admin/pedidos");
}
