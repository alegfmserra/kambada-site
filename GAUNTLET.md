# GAUNTLET.md — histórico do loop de qualidade

> Memória do processo. Uma entrada por rodada completa dos 5 gates.
> Regra: gate vermelho → corrige e roda o gauntlet **inteiro** de novo desde o Gate 1.
> Fase só é marcada como concluída com todos os gates verdes na mesma rodada.

## Como rodar

```bash
npx tsc --noEmit && npx eslint . && npm run build   # Gate 1
npm test                                            # Gate 2
QA_DATE=AAAA-MM-DD npm run qa:visual                # Gate 3
npm run qa:lighthouse                               # Gate 4
```

Gate 5 é revisão humana/assistida dos screenshots do Gate 3 contra
`docs/identidade-visual.md` §7.

---

## Rodada 1 — 2026-08-30 — Fases 0 e 1

**Escopo:** fundação do projeto (Next.js 16.3.3, React 19.2.8, TypeScript strict, Tailwind v4, tokens da marca, logos, documentação) e páginas institucionais (Home, Sobre, Cultura, Contato, cabeçalho, rodapé, sitemap, robots).

### Tentativa 1 — ❌ falhou no Gate 2

| Gate | Resultado |
|---|---|
| 1 — Build, lint, type-check | ✅ `tsc=0`, `eslint=0`, `build=0` |
| 2 — Testes | ❌ 1 de 8 falhou |
| 3–5 | não executados (loop interrompido na primeira falha) |

**Falha:** `linkWhatsApp > escapa acento, espaço e pontuação da mensagem`.

**Causa:** defeito no teste, não no código. A asserção `expect(link).not.toMatch(/[ ç?]/)` era aplicada à URL inteira, e o `?` de `?text=` faz parte da URL base — a regex casava sempre, independentemente do que a função fizesse.

**Correção:** a asserção passou a recair só sobre a query string, e o conjunto proibido ganhou `&` e `#`, que também quebrariam a URL. De quebra, `vitest.config.ts` foi renomeado para `.mts`, eliminando o aviso de ESM-carregado-como-CommonJS do Vite.

### Tentativa 2 — ✅ todos os gates verdes

| Gate | Resultado | Evidência |
|---|---|---|
| **1 — Build, lint, type-check** | ✅ | `tsc --noEmit` = 0 · `eslint .` = 0 · `next build` = 0, 7 rotas pré-renderizadas estáticas |
| **2 — Testes** | ✅ | Vitest: **8/8 passaram**. Cobre `linkWhatsApp` (escape de acento, espaço, pontuação e emoji; saudação padrão), integridade da navegação (sem rota inexistente, sem duplicata) e dados institucionais (domínio sem barra final, redes em https) |
| **3 — QA visual** | ✅ | Playwright: **13 passaram, 2 puladas** (as puladas são o teste de menu mobile fora do breakpoint 375 — `test.skip` intencional). 12 screenshots em `qa/screenshots/2026-08-30/` (4 páginas × 3 breakpoints) |
| **4 — Performance e acessibilidade** | ✅ | Lighthouse CI, 4 páginas: **100 / 100 / 100 / 100** em performance, acessibilidade, boas práticas e SEO. Todas as metas (≥85/95/90/90) superadas |
| **5 — Identidade visual** | ✅ | Checklist de `docs/identidade-visual.md` §7 cumprido em todas as páginas e breakpoints |

### Checagens automatizadas embutidas no Gate 3

Cada página, em cada breakpoint, é verificada quanto a: logo visível e efetivamente carregado (`naturalWidth > 0`), exatamente um `<h1>`, presença do amarelo `#FFCC29` em elemento visível, e ausência de rolagem horizontal.

### Observação — falso positivo de captura

O screenshot `desktop-1440/home.png` mostra um rastro do texto do rodapé logo abaixo do cabeçalho. **Não é defeito do site:** é artefato conhecido da captura `fullPage` do Playwright em páginas com elemento `position: sticky`. Verificado no navegador real em `http://localhost:3000` — o rastro não existe. Aparece só na home desktop, a página mais alta do conjunto.

### Divergências do Gate 5

Todas **intencionais** e documentadas em `docs/identidade-visual.md` §8: remoção da fonte Inter (três famílias → duas), navegação sem link para "Loja" (entra na Fase 2, com catálogo real), rodapé reorganizado em colunas, "All rights reserved" traduzido e com ano dinâmico, e Contato promovido a página própria. **Nenhuma divergência não intencional.**

---

## Rodada 2 — 2026-08-30 — Fases 0 e 1 (ícones da marca)

**Motivo:** o favicon ainda era o do template do Next — marca errada no navegador. Mudança relevante depois de um gauntlet verde exige rodar o loop inteiro de novo.

**O que mudou:** `scripts/gerar-icones.mjs` recorta o **caranguejo** do logo horizontal detectando o vão transparente que o separa do lettering, e gera `src/app/icon.png` (512×512, símbolo amarelo sobre grafite) e `src/app/opengraph-image.png` (1200×630). Nada foi redesenhado — o traço é o original. A referência manual de OG image saiu do `layout.tsx`, já que o Next associa o arquivo convencional sozinho.

| Gate | Resultado | Evidência |
|---|---|---|
| **1** | ✅ | `tsc`=0 · `eslint`=0 · `build`=0, agora com 9 rotas (entram `/icon.png` e `/opengraph-image.png`) |
| **2** | ✅ | Vitest 8/8 |
| **3** | ✅ | Playwright 13 passaram, 2 puladas · screenshots regravados em `qa/screenshots/2026-08-30/` |
| **4** | ✅ | Lighthouse 4 páginas: **100/100/100/100** |
| **5** | ✅ | Símbolo conferido visualmente: caranguejo recortado corretamente, amarelo `#FFCC29` sobre grafite `#1D1E20` |

**Ressalva do Gate 5:** o símbolo é ampliado de 157px de largura para 358px, então tem leve suavização de borda. É o teto do que o raster permite — resolve de vez quando chegar o logo vetorial (pendência 1).

---

## Rodada 3 — 2026-08-31 — Loja de demonstração, temas, blog e blindagem de SEO

**Escopo:** vitrine de demonstração em `/loja`, tema claro/escuro, WhatsApp em evidência sem expor o número, três artigos de blog com página própria, e proteção contra indexação do endereço temporário.

### A correção mais importante desta rodada

Ao publicar no endereço temporário da Hostinger, percebi um risco que ninguém havia levantado: **o endereço de teste estava aberto ao Google**. Indexado, viraria conteúdo duplicado competindo com o `somoskambada.com.br` que hoje vende de verdade.

A proteção é `EH_PRODUCAO` (`src/lib/site.ts`): o site só se declara produção quando `NEXT_PUBLIC_SITE_URL` for definida **exatamente** com o domínio oficial. Em qualquer outro lugar, o `robots.txt` bloqueia tudo e as páginas pedem `noindex`. **O padrão é fechado de propósito** — esquecer de configurar deixa o site invisível, o que é reversível; o contrário, não.

### Tentativa 1 — ❌ falhou no Gate 1 (duas causas)

| Gate | Resultado |
|---|---|
| 1 | ❌ `tsc` e `eslint` |
| 2–5 | não executados |

**Falha A — ESLint (`react-hooks/set-state-in-effect`).** O alternador de tema chamava `setState` dentro de um `useEffect`, o que provoca renderização em cascata. Não era estilo: era antipadrão real.

**Correção:** o componente deixou de ter estado. O tema vive no atributo `data-tema` do `<html>` e o **CSS** decide qual ícone e qual rótulo aparecem (`.so-claro` / `.so-escuro`). Some a cascata e some qualquer divergência de hidratação — servidor e cliente passam a gerar HTML idêntico.

**Falha B — TypeScript.** A página de artigo usava `PageProps<"/cultura/[slug]">`, tipo **gerado durante o build**. Rota nova quebra o `tsc --noEmit` até o primeiro build passar — ordem de execução vira armadilha.

**Correção:** o tipo passou a ser declarado à mão (`{ params: Promise<{ slug: string }> }`), sem depender de artefato de build.

### Tentativa 2 — ✅ todos os gates verdes

| Gate | Resultado | Evidência |
|---|---|---|
| **1** | ✅ | `tsc`=0 · `eslint`=0 · `build`=0, com os 3 artigos pré-renderizados por `generateStaticParams` |
| **2** | ✅ | Vitest **17/17** — cobre artigos (slug único, formato de data à prova de fuso), catálogo de demonstração (preço, categoria válida, item esgotado), navegação e a lógica de `EH_PRODUCAO` |
| **3** | ✅ | Playwright **26 passaram, 4 puladas** (pulos intencionais por breakpoint) · 18 screenshots + capturas do tema claro |
| **4** | ✅ | Lighthouse nas **6 páginas**: **100/100/100/100** |
| **5** | ✅ | Identidade preservada nos dois temas |

### Verificações novas no Gate 3

- **O número do WhatsApp não aparece escrito em lugar nenhum.** O teste varre o texto da página com expressão regular de telefone e falha se encontrar algo. Os links continuam levando direto à conversa.
- **O tema alterna, persiste e não pisca.** Confirma o fundo antes e depois da troca, recarrega a página e verifica que a escolha sobreviveu.
- **A loja avisa que é ilustrativa.** Falha se o aviso "Nada aqui é real" sumir da página.

### Nota sobre a medição do Gate 4

Com `noindex` ativo, a auditoria *is-crawlable* do Lighthouse reprova a categoria SEO — corretamente, porque é o que pedimos. Por isso o Gate 4 é medido com `NEXT_PUBLIC_SITE_URL` apontando para o domínio oficial: mede-se **a configuração que irá ao ar**, não a do ambiente de teste.

### Divergências do Gate 5

Uma nova, intencional e documentada em `docs/identidade-visual.md` §3.1: no tema claro o amarelo da marca deixa de ser cor de letra e vira marca-texto. **Não foi criada nenhuma cor nova** — a alternativa seria inventar um dourado escuro, o que descaracterizaria a paleta. Nenhuma divergência não intencional.

### Ressalva honesta sobre o conteúdo

O catálogo de `/loja` e os três artigos **foram inventados por mim** para esta demonstração. O catálogo está marcado na própria página como ilustrativo. Os artigos tratam de temas culturais amplamente conhecidos e evitam de propósito datas, números e nomes de pessoas — mas **não foram revisados pelo Alexandre** e não devem ser divulgados antes disso.

---

### Pendências abertas ao fim da rodada

Nenhuma bloqueia as Fases 0 e 1. Todas afetam fases seguintes:

1. **Logo vetorial ausente** — só há raster (JPG/PNG). Impede favicon nítido e OG image de qualidade. Pedido aberto com o Alexandre.
2. **Credenciais do Bling** — necessárias para a Fase 2. Só o Alexandre pode gerar, no painel do Bling.
3. **Hospedagem** — decidido Hostinger Web Apps hosting (Node.js); o plano atual é Website Builder e não executa Next.js. Contratação pendente.
4. **Regras de negócio** — frete, cupom, política de troca e tratamento de produto sem estoque continuam indefinidos. Nada será implementado por suposição.
