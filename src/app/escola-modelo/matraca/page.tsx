import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";

/** O cordel animado (componente do Play) aponta para a matraca da loja: na escola não há loja, volta para a área de cultura. */
export default function MatracaDaEscolaAtalho() {
  redirect(rotaEscola("/aluno/cultura"));
}
