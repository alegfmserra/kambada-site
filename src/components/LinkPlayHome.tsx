"use client";

import Link from "next/link";
import { evento } from "@/lib/analytics/eventos";

/** Link da home para o Play; avisa o GA4 do clique (a home é página de adulto, fora do Play). */
export default function LinkPlayHome({ href, destino, className, children }: { href: string; destino: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className} onClick={() => evento("play_cta_home", { destino })}>
      {children}
    </Link>
  );
}
