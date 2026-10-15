import type { Metadata } from "next";
import ArraialClient from "./ArraialClient";
import "@/components/play/arraial/arraial.css";

export const metadata: Metadata = {
  title: "Arraial da Kambada",
  description:
    "Ande pela festa de São João, converse com o povo do arraial e junte as cinco fitinhas no quiz da tradição maranhense.",
};

export default function ArraialPage() {
  return <ArraialClient />;
}
