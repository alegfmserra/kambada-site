import { expect, test } from "@playwright/test";

/**
 * Gate 3 — QA visual.
 * Além de capturar a tela, cada página é checada contra o checklist do Gauntlet:
 * logo presente, cor de marca aplicada, um único H1, e nenhum vazamento
 * horizontal de layout.
 *
 * A data da pasta vem de QA_DATE para a captura ficar rastreável.
 * Ex.: QA_DATE=2026-08-30 npx playwright test
 */

const DATA = process.env.QA_DATE ?? "sem-data";

const PAGINAS = [
  { rota: "/", nome: "home" },
  { rota: "/sobre", nome: "sobre" },
  { rota: "/cultura", nome: "cultura" },
  { rota: "/contato", nome: "contato" },
] as const;

const AMARELO_KAMBADA = "rgb(255, 204, 41)";

for (const pagina of PAGINAS) {
  test(`${pagina.nome} — captura e checklist visual`, async ({
    page,
  }, testInfo) => {
    await page.goto(pagina.rota);
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: `qa/screenshots/${DATA}/${testInfo.project.name}/${pagina.nome}.png`,
      fullPage: true,
    });

    // Logo presente e carregado de verdade (não é img quebrada).
    const logo = page.locator('header img[alt="Kambada"]');
    await expect(logo).toBeVisible();
    expect(
      await logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);

    // Um H1, e só um.
    await expect(page.locator("h1")).toHaveCount(1);

    // Paleta da marca aplicada em algum elemento visível da página.
    const temAmarelo = await page.evaluate((alvo) => {
      return [...document.querySelectorAll("body *")].some((el) => {
        const cs = getComputedStyle(el);
        return cs.color === alvo || cs.backgroundColor === alvo;
      });
    }, AMARELO_KAMBADA);
    expect(temAmarelo, "amarelo #FFCC29 ausente na página").toBe(true);

    // Nenhum vazamento horizontal — o pior defeito de layout no mobile.
    const vazamento = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(vazamento, "a página rola na horizontal").toBeLessThanOrEqual(0);
  });
}

test("o menu mobile abre e fecha", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-375", "só no breakpoint mobile");

  await page.goto("/");
  const botao = page.getByRole("button", { name: "Abrir menu" });
  await expect(botao).toBeVisible();

  await botao.click();
  await expect(page.locator("#menu-mobile")).toBeVisible();

  await page.getByRole("button", { name: "Fechar menu" }).click();
  await expect(page.locator("#menu-mobile")).toBeHidden();
});
