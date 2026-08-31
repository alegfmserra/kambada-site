import { expect, test } from "@playwright/test";

/**
 * Gate 3 — QA visual.
 * Captura cada página nos três breakpoints e a checa contra o checklist do
 * Gauntlet: logo carregado, um único H1, cor de marca presente e nenhuma
 * rolagem horizontal. Os dois temas são cobertos.
 *
 * A data da pasta vem de QA_DATE, para a captura ficar rastreável.
 * Ex.: QA_DATE=2026-08-31 npx playwright test
 */

const DATA = process.env.QA_DATE ?? "sem-data";

const PAGINAS = [
  { rota: "/", nome: "home" },
  { rota: "/loja", nome: "loja" },
  { rota: "/sobre", nome: "sobre" },
  { rota: "/cultura", nome: "cultura" },
  { rota: "/cultura/matraca-o-instrumento-que-dita-o-ritmo", nome: "artigo" },
  { rota: "/contato", nome: "contato" },
] as const;

const AMARELO = "rgb(255, 204, 41)";

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

    const logo = page.locator('header img[alt="Kambada"]');
    await expect(logo).toBeVisible();
    expect(
      await logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);

    await expect(page.locator("h1")).toHaveCount(1);

    const temAmarelo = await page.evaluate((alvo) => {
      return [...document.querySelectorAll("body *")].some((el) => {
        const cs = getComputedStyle(el);
        return (
          cs.color === alvo ||
          cs.backgroundColor === alvo ||
          cs.borderTopColor === alvo
        );
      });
    }, AMARELO);
    expect(temAmarelo, "cor da marca ausente na página").toBe(true);

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

test("o tema alterna, persiste e é capturado no claro", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "basta um breakpoint");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const fundoInicial = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(fundoInicial).toBe("rgb(29, 30, 32)");

  await page.getByRole("button", { name: /Mudar para o tema claro/i }).click();

  const fundoClaro = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // Off-white #FAF8F3 — branco puro cansa a vista em leitura longa.
  expect(fundoClaro).toBe("rgb(250, 248, 243)");

  await page.screenshot({
    path: `qa/screenshots/${DATA}/tema-claro/home.png`,
    fullPage: true,
  });

  // A escolha tem de sobreviver ao recarregamento — e sem piscar.
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBe(
    "claro",
  );

  await page.goto("/loja");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `qa/screenshots/${DATA}/tema-claro/loja.png`,
    fullPage: true,
  });
});

test("o WhatsApp está acessível sem expor o número", async ({ page }) => {
  await page.goto("/contato");
  await page.waitForLoadState("networkidle");

  // O botão fixo aparece em qualquer página.
  const fixo = page.getByRole("link", { name: /Falar no WhatsApp/i }).first();
  await expect(fixo).toBeVisible();
  expect(await fixo.getAttribute("href")).toContain("wa.me/");

  // E o número não pode estar escrito em lugar nenhum do site.
  const texto = await page.evaluate(() => document.body.innerText);
  expect(texto).not.toContain("98443");
  expect(texto).not.toMatch(/\(?\d{2}\)?\s?9\d{4}[-\s]?\d{4}/);
});

test("a loja avisa que o pedido é pelo WhatsApp", async ({ page }) => {
  await page.goto("/loja");
  await page.waitForLoadState("networkidle");

  const aviso = page.getByRole("note").first();
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText(/pedido é\s+fechado no WhatsApp/i);
});

test("o menu superior leva a cada categoria da loja", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "submenu é do desktop");

  await page.goto("/");
  await page.getByRole("button", { name: /Abrir categorias da loja/i }).click();

  const submenu = page.locator("#submenu-loja");
  await expect(submenu).toBeVisible();

  const links = submenu.locator("a");
  // "Toda a loja" + as categorias.
  expect(await links.count()).toBeGreaterThanOrEqual(4);

  await submenu.getByRole("link", { name: "Matracas" }).click();
  await expect(page).toHaveURL(/\/loja\/matracas$/);
  await expect(page.locator("h1")).toHaveText("Matracas");
});

test("cada página de categoria abre e lista produtos", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "basta um breakpoint");

  for (const slug of [
    "camisas",
    "matracas",
    "ecobags",
    "bones",
    "pareos",
    "necessaires",
  ]) {
    await page.goto(`/loja/${slug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveCount(1);
    expect(
      await page.locator("li:has(h3)").count(),
      `categoria ${slug} sem produtos`,
    ).toBeGreaterThan(0);
  }
});
