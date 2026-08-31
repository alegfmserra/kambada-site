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

## Rodada 4 — 2026-08-31 — Catálogo real e navegação por categoria

**Escopo:** substituição do catálogo inventado pelos **produtos reais** da Kambada, páginas próprias por categoria, submenu de categorias no cabeçalho e barra de atalhos dentro da loja.

### O catálogo deixou de ser fictício

O Alexandre autorizou usar as planilhas. Os dados vieram de `Estoque_Kambada (1).xlsx`, aba "Estoque" — contagem de 2026-08-29, 101 modelos e 1.378 peças. São reais: nome do produto, preço, variações (tamanhos e cores) e saldo.

**O que continua não existindo, e por isso não foi inventado:** descrição de produto e foto. A planilha não tem esses campos, e escrever texto comercial que ninguém aprovou seria criar informação. No lugar da descrição, o cartão mostra **as variações reais** contadas no estoque.

**Divergência de preço encontrada entre as fontes** — registrada em `src/lib/catalogo.ts` e pendente de confirmação: o catálogo do Mercado Pago (2026-06-13) traz "Camisa" a **R$ 80,00**; o estoque e a listagem do Bling (2026-08-29) trazem camisa adulta a **R$ 89,90**. Prevaleceu o estoque, por ser a fonte mais recente.

O saldo exato **não vai para a vitrine**: aparece "Disponível", "Últimas unidades" (5 ou menos) ou "Esgotado". Há teste garantindo que nenhum número de estoque vaze para a tela.

### Tentativa 1 — ❌ falhou no Gate 3

| Gate | Resultado |
|---|---|
| 1 | ✅ |
| 2 | ✅ 21/21 |
| 3 | ❌ 1 de 28 falhou |

**Falha:** `o menu superior leva a cada categoria da loja` — `#submenu-loja` não aparecia após o clique.

**Causa: defeito real de usabilidade, não do teste.** O submenu abria por passagem do mouse (`onMouseEnter`) e o botão alternava. O Playwright — como qualquer pessoa usando mouse — passa o cursor antes de clicar: o hover abria, o clique fechava, e **o botão parecia quebrado**.

**Correção na raiz:** o submenu passou a abrir **só por clique**. Menu que abre no hover não existe em tela de toque, atrapalha quem navega por teclado e cria justamente essa ambiguidade. Fecha com **Escape** ou clique fora — dois caminhos que antes não existiam.

### Tentativa 2 — ✅ todos os gates verdes

| Gate | Resultado | Evidência |
|---|---|---|
| **1** | ✅ | `tsc`=0 · `eslint`=0 · `build`=0, com as 6 categorias pré-renderizadas |
| **2** | ✅ | Vitest **21/21** |
| **3** | ✅ | Playwright **28 passaram** |
| **4** | ✅ | Lighthouse nas 6 páginas: **100/100/100/100** |
| **5** | ✅ | Identidade preservada nos dois temas |

### Verificações novas no Gate 2

- Nenhuma categoria fica vazia — vitrine sem produto é link quebrado no menu.
- Faixa de preço nunca invertida (mínimo maior que máximo).
- Todo produto pertence a uma categoria que existe.
- O rótulo de disponibilidade não contém dígito — o saldo não vaza.

### Verificações novas no Gate 3

- O submenu do cabeçalho abre e navega até a categoria certa.
- As seis páginas de categoria abrem e listam produtos.

---

## Rodada 5 — 2026-08-31 — Fotos da marca

**Escopo:** 14 fotos do acervo (de 87 entregues) integradas à home, ao Sobre e à loja. Seleção feita por folhas de contato; processamento em `scripts/preparar-fotos.mjs` (rotação, redimensionamento por uso real, WebP a 80%). Total de 2,5 MB.

| Gate | Resultado |
|---|---|
| 1 | ✅ |
| 2 | ✅ 24/24 — inclui teste que reprova texto alternativo genérico ou curto demais |
| 3 | ✅ 28 verificações |
| 4 | ✅ **99**/100/100/100 na home (as fotos custam 1 ponto), 100 nas outras cinco |
| 5 | ✅ |

**Pareôs ficaram sem foto de propósito:** não há nenhuma no acervo, e usar imagem de outro produto seria enganoso. O layout trata a ausência.

---

## Rodada 6 — 2026-08-31 — Fase 2: integração com o Bling

**Escopo:** cliente completo da API v3, OAuth com renovação automática, limitador de requisições, webhook de estoque, e catálogo com queda para o local. Cinco ciclos de revisão, conforme pedido.

### Antes de escrever: conferir a documentação

Os endpoints foram confirmados na documentação e numa implementação de referência, não deduzidos. Um achado que teria custado caro: **o endpoint de OAuth fica em `www.bling.com.br`, enquanto a API fica em `api.bling.com.br`.** Supor o mesmo host quebraria a autorização com erro nada óbvio. Há teste travando esse endereço.

### Ciclo 1 — construção ✅

Cliente, tokens, limitador, rotas e 38 testes. Todos os gates verdes.

### Ciclo 2 — revisão do próprio código: **3 defeitos encontrados** ✅

1. **🔴 Os tokens do Bling iriam para o GitHub.** O arquivo `.dados/bling-tokens.json` não estava no `.gitignore`. O refresh_token dá acesso ao ERP inteiro — seria um vazamento sério. Corrigido, e verificado com `git check-ignore`.
2. **🔴 Renovação de token concorrente.** Várias requisições encontrando o token vencido ao mesmo tempo disparariam vários refresh. Como o Bling pode rotacionar o refresh_token a cada uso, o segundo chegaria com credencial invalidada e a conexão cairia. Agora todas compartilham a mesma renovação — com três testes cobrindo o caso, inclusive o de falha não deixar a promessa presa.
3. **🟡 Ternário sem efeito** no webhook (`? "page" : "page"`). Simplificado.

### Ciclo 3 — revisão de arquitetura: **uma decisão minha revertida** ✅

Eu havia feito as categorias virem do Bling. Errado: o Bling só tem `descricao`, enquanto a chamada de cada vitrine e a foto são curadoria feita à mão. Uma renomeação no ERP apagaria esse trabalho e deixaria seções sem texto e sem imagem.

Invertido: **a lista local de categorias manda; do Bling vêm os produtos**, encaixados pelo slug. Somaram-se duas defesas: produto de categoria desconhecida fica de fora (ficaria órfão, sem página), e se nenhum produto casar, cai para o catálogo local em vez de servir uma loja vazia.

As páginas de loja passaram a consumir `buscarCatalogo()` com ISR de 10 minutos. Como a queda para o local é automática, o site hoje serve exatamente o que servia antes — e passa a servir do Bling no instante em que a autorização for feita, sem mais nenhuma alteração de código.

### Ciclo 4 — verificação funcional ✅

Servidor real, rotas exercitadas:

| Verificação | Resultado |
|---|---|
| Webhook sem segredo | **401** — falha fechada |
| Webhook com segredo errado | **401** |
| Webhook GET (diagnóstico) | 200, informa se está configurado |
| Loja sem o Bling autorizado | **200, com os produtos reais** — a queda funciona |
| URL de autorização | testada por unidade: host correto, `state` presente, **sem client_secret** |

Gauntlet completo: 45 testes, 28 verificações visuais, Lighthouse **100/100/100/100 nas seis páginas**.

### Ciclo 5 — auditoria de segredos ✅

| Verificação | Resultado |
|---|---|
| Segredo no código versionado | nenhum |
| Segredo no JS/HTML entregue ao navegador | nenhum |
| `.env.local` e `.dados/` fora do git | confirmado |
| Variáveis `NEXT_PUBLIC_` | só a URL do site e a chave **pública** do Mercado Pago |

Documentação em `docs/bling.md`, com o passo a passo da autorização e as decisões justificadas.

### O que falta para a Fase 2 ficar completa

Só o que depende do Alexandre: **abrir `/api/bling/autorizar` e aprovar**. Antes disso, conferir se o "Link de redirecionamento" no aplicativo do Bling bate exatamente com o ambiente. E cadastrar o webhook, com o segredo já gerado no `.env.local`.

**Fotos dos produtos continuam pendentes** — o Bling só devolve imagem se ela estiver cadastrada lá.

---

### Pendências abertas ao fim da rodada

Nenhuma bloqueia as Fases 0 e 1. Todas afetam fases seguintes:

1. **Logo vetorial ausente** — só há raster (JPG/PNG). Impede favicon nítido e OG image de qualidade. Pedido aberto com o Alexandre.
2. **Credenciais do Bling** — necessárias para a Fase 2. Só o Alexandre pode gerar, no painel do Bling.
3. **Hospedagem** — decidido Hostinger Web Apps hosting (Node.js); o plano atual é Website Builder e não executa Next.js. Contratação pendente.
4. **Regras de negócio** — frete, cupom, política de troca e tratamento de produto sem estoque continuam indefinidos. Nada será implementado por suposição.
