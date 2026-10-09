import type { Metadata } from "next";
import Link from "next/link";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Direitos autorais",
  description:
    "A marca Kambada é registrada no INPI, e as artes, estampas, ilustrações e personagens são criações próprias, protegidas pela Lei de Direitos Autorais.",
  alternates: { canonical: "/direitos-autorais" },
};

/**
 * Direitos autorais — pedido do Alexandre (09/10/2026): deixar claro que todas
 * as artes são próprias da Kambada.
 *
 * Cuidados de redação: (1) fotografias podem ser de fotógrafos parceiros, que
 * têm direito de autor sobre elas — por isso o texto não diz que toda foto é
 * "da Kambada"; (2) o registro no INPI cobre a MARCA (nome + logo), não as
 * estampas — estas são protegidas como obra pela Lei 9.610/1998, sem registro.
 * Dados do certificado (Fred - Kambada/Comprovações/Para-o-celular/
 * Q16-3_Certificado_INPI.pdf): processo 932317162, marca mista, NCL 35,
 * concedida em 09/12/2025, vigente até 09/12/2035, titular Somos Kambada LTDA.
 * Base: Leis 9.279/1996 (marcas) e 9.610/1998 (direitos autorais).
 */
export default function PaginaDireitosAutorais() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Direitos autorais</h1>
        <p className="mt-3 text-lg text-texto-suave">
          Cada estampa da Kambada nasce aqui, de quem vive o Maranhão.
        </p>

        <div className="mt-10 space-y-10 leading-relaxed">
          <article>
            <h2 className="font-display text-2xl font-bold">Marca registrada</h2>
            <p className="mt-3">
              A marca <strong>Kambada</strong> — o nome e o logotipo — é{" "}
              <strong>registrada no INPI</strong> (Instituto Nacional da Propriedade Industrial) em
              nome da Somos Kambada LTDA, processo nº <strong>932317162</strong>, com vigência até
              2035. O uso do nome ou do logotipo por terceiros, em produtos, lojas, perfis ou
              anúncios, depende de autorização por escrito (Lei nº 9.279/1996).
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Artes próprias</h2>
            <p className="mt-3">
              Todas as <strong>artes, estampas, ilustrações e personagens</strong> que aparecem
              nos produtos e neste site — o Boi, os Guarás, o Cazumbá, as Carrancas, a Serpente,
              os personagens do Kambada Play e todas as outras — são{" "}
              <strong>criações próprias da Kambada</strong> (Somos Kambada LTDA), protegidas pela
              Lei de Direitos Autorais (Lei nº 9.610/1998).
            </p>
            <p className="mt-3">
              As fotografias do site são da Kambada ou de fotógrafos parceiros, e são usadas com
              autorização.
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">O que não é permitido</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Reproduzir, copiar ou adaptar as nossas artes e estampas, total ou parcialmente.</li>
              <li>Produzir ou vender peças com as nossas artes sem autorização por escrito.</li>
              <li>Usar as artes ou as fotos do site em outros sites, lojas ou anúncios.</li>
              <li>Usar o nome ou o logotipo Kambada sem autorização.</li>
            </ul>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">O que a gente adora</h2>
            <p className="mt-3">
              Compartilhar o link de um produto, postar foto vestindo a sua Kambada e marcar o{" "}
              <strong>@somos.kambada</strong>. Isso espalha a nossa cultura — e a gente agradece!
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Encomendas personalizadas</h2>
            <p className="mt-3">
              A arte criada para uma encomenda é exclusiva do cliente — não a usamos em outra
              encomenda — mas os direitos sobre ela continuam com a Kambada, e ela não pode ser
              reproduzida por terceiros sem autorização. Isso vai num termo de exclusividade junto
              com a aprovação.{" "}
              <Link href="/encomendas" className="font-semibold underline underline-offset-4">
                Veja como funciona a encomenda
              </Link>
              .
            </p>
          </article>

          <article>
            <h2 className="font-display text-2xl font-bold">Viu uma cópia?</h2>
            <p className="mt-3">
              Se encontrar uma arte da Kambada sendo usada sem autorização, avise a gente.{" "}
              <a
                href={linkWhatsApp("Oi! Encontrei uma possível cópia de uma arte da Kambada.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                Falar no WhatsApp
              </a>
              .
            </p>
          </article>
        </div>

        <p className="mt-10 text-sm text-texto-tenue">Atualizado em 9 de outubro de 2026.</p>
      </div>
    </section>
  );
}
