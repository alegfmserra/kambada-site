/**
 * Build para o Gate 4 do Gauntlet.
 *
 * O site só se declara produção quando NEXT_PUBLIC_SITE_URL for exatamente o
 * domínio oficial (ver src/lib/site.ts). Em qualquer outro endereço ele pede
 * para não ser indexado — blindagem deliberada, para que o endereço temporário
 * da Hostinger não vire conteúdo duplicado competindo no Google com o site que
 * está vendendo hoje.
 *
 * Efeito colateral: o Lighthouse reprova "Page is blocked from indexing" e o
 * SEO cai para 0,69, em toda página, sempre. O gate ficaria vermelho por uma
 * decisão correta — o pior tipo de alarme falso, porque ensina a ignorar o
 * gate.
 *
 * NEXT_PUBLIC_* é gravada no bundle em tempo de BUILD, não de execução: por
 * isso a variável entra aqui e não no startServerCommand do lighthouserc.
 * Assim o Gate 4 mede o site como ele vai ser no domínio real.
 *
 * Este build é de aferição. Não é o que vai para o deploy.
 */
import { execSync } from "node:child_process";

execSync("npx next build", {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SITE_URL: "https://somoskambada.com.br" },
});
