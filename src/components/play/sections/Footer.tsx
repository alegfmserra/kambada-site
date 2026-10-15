import Link from "next/link";
import { copy } from "@/content/play/copy";
import { MicangaDashes } from "@/components/play/ornaments/MicangaDashes";

export function Footer() {
  return (
    <footer className="relative flex flex-col items-center gap-4 bg-kambada-noite px-6 pb-14 pt-10 text-center">
      <MicangaDashes count={6} />
      <Link
        href="/kambadaplay/conto"
        className="link-costura font-body text-sm text-kambada-cream/70 underline-offset-4"
      >
        O Auto do Boi, o conto em cordel
      </Link>
      <a
        href={copy.footer.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="link-costura font-body text-kambada-cream/85 underline-offset-4"
      >
        {copy.footer.instagramHandle}
      </a>
      <p className="font-display text-sm text-kambada-cream/70">{copy.footer.assinatura}</p>
    </footer>
  );
}
