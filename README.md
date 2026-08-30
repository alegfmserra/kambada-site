# Kambada — site

Site institucional e loja da **Kambada**, marca maranhense que veste a cultura do Maranhão. Substitui o site atual, hoje no Hostinger Website Builder.

- Produção: https://somoskambada.com.br
- Stack: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4
- ERP e fonte da verdade de catálogo, estoque e pedidos: **Bling** (API v3)
- Pagamento: **Mercado Pago**
- Marketplaces: Mercado Livre e Shopee **via Bling** — o site não fala com eles

## Rodando

```bash
npm install
cp .env.example .env.local   # e preencha
npm run dev
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unitários) |
| `npm run qa:visual` | Playwright — screenshots e checklist visual em 3 breakpoints |
| `npm run qa:lighthouse` | Lighthouse CI com as metas do Gate 4 |

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [`docs/identidade-visual.md`](docs/identidade-visual.md) | Paleta, tipografia, tom de voz, checklist do Gate 5 |
| [`GAUNTLET.md`](GAUNTLET.md) | Histórico das rodadas do loop de qualidade |
| [`.env.example`](.env.example) | Todas as variáveis de ambiente, documentadas |

## Regras do projeto

1. **Nunca commitar segredo.** Chaves do Bling e do Mercado Pago só em `.env.local`.
2. **O site não é fonte de verdade de estoque** — é espelho cacheado do Bling.
3. **Pedido só nasce no Bling depois do pagamento aprovado.**
4. **Webhooks são idempotentes** — o Bling não garante ordem de entrega e retenta por até 3 dias.
5. **Nada de regra de negócio inventada.** Frete, cupom, troca: sem definição do Alexandre, não se implementa.
6. **Toda mudança relevante passa pelo Gauntlet** antes de ser dada como pronta.
