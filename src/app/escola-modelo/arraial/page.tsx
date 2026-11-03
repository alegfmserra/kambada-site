import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";

/** O cordel animado (componente do Play) aponta para /kambadaplay/arraial: na escola, é o Arraial em modo festa. */
export default function ArraialDaEscolaAtalho() {
  redirect(rotaEscola("/aluno/arraial?trilha=festa"));
}
