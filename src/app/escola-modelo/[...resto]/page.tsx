import { notFound } from "next/navigation";

/** Endereço que não existe no portal: mostra o "não encontrada" do portal, não o da loja. */
export default function Resto() {
  notFound();
}
