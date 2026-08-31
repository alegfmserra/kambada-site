# Integração com o Bling

Como o site conversa com o ERP, o que fazer para ligar, e o que acontece quando dá errado.

---

## O princípio que governa tudo

**A loja nunca sai do ar por causa do Bling.**

Se o aplicativo não estiver autorizado, se a API cair, se o limite de requisições estourar ou se nenhum produto casar com as categorias, o site serve o **catálogo local** — o mesmo extraído da planilha de estoque. É melhor mostrar preço de ontem do que mostrar página de erro a quem quer comprar.

Toda resposta de `buscarCatalogo()` vem marcada com `origem: "bling" | "local"` e, quando cai para o local, com o `motivo`.

---

## Ligar pela primeira vez

**1. Confira o endereço de redirecionamento.** No aplicativo do Bling (Preferências → Integrações → API → "Site Kambada"), o "Link de redirecionamento" precisa ser **idêntico** ao do `.env.local`:

| Ambiente | Valor |
|---|---|
| Desenvolvimento | `http://localhost:3000/api/bling/callback` |
| Produção | `https://somoskambada.com.br/api/bling/callback` |

Um caractere de diferença e o Bling recusa a autorização.

**2. Abra no navegador:**

```
/api/bling/autorizar
```

Você é levado ao Bling, aprova o aplicativo, e volta para `/api/bling/callback`, que mostra "Conectado".

**3. Pronto.** Os tokens ficam gravados e se renovam sozinhos. Só é preciso repetir se o arquivo de tokens for perdido ou se a autorização for revogada no Bling.

---

## O que cada peça faz

| Arquivo | Responsabilidade |
|---|---|
| `tokens.ts` | Guarda, renova e entrega o access_token. Renovação concorrente é compartilhada. |
| `limitador.ts` | Fila que respeita os 3 req/s do Bling. |
| `cliente.ts` | HTTP com retry em 429 e 5xx, espera crescente, e paginação. |
| `produtos.ts` | Converte o catálogo do Bling para o formato do site, com queda para o local. |
| `api/bling/autorizar` | Inicia o OAuth, com `state` em cookie contra CSRF. |
| `api/bling/callback` | Troca o `code` por tokens. O code **vale 1 minuto**. |
| `api/webhooks/bling` | Recebe aviso de mudança e invalida o cache das páginas de loja. |

---

## Decisões que valem explicação

**As categorias NÃO vêm do Bling.** O Bling tem só `descricao`; a chamada de cada vitrine e a foto foram escolhidas à mão. Se as categorias viessem de lá, renomear uma no ERP apagaria esse trabalho e deixaria a seção sem texto e sem imagem. A lista local manda; o que vem do Bling são os **produtos**, encaixados pelo slug da descrição.

**Produto de categoria desconhecida fica de fora.** Ele não teria página onde aparecer. Para incluir, crie a categoria em `src/lib/catalogo.ts` com nome, chamada e foto.

**O endpoint de token é `www.bling.com.br`, não `api.bling.com.br`.** A API fica em `api.`, mas o OAuth fica em `www.`. Trocar isso quebra a autorização inteira, e o erro não é óbvio. Há teste travando esse endereço.

**Renovação de token é compartilhada.** Se várias requisições encontrarem o token vencido ao mesmo tempo, todas esperam a mesma renovação. Sem isso, o Bling rotacionaria o refresh_token e o segundo pedido chegaria com credencial já invalidada — a conexão cairia e exigiria autorização manual.

**O webhook falha fechado.** Sem `BLING_WEBHOOK_SECRET` configurado, ele recusa tudo. A comparação do segredo é de tempo constante — comparar com `===` vaza o segredo aos poucos, por diferença de tempo de resposta.

**O webhook responde 200 a corpo inválido.** Devolver erro faria o Bling reenviar por 3 dias algo que nunca vai funcionar. Só segredo errado responde 401.

---

## Cadastrar o webhook no Bling

No aplicativo, aba **Webhooks**, aponte para:

```
https://somoskambada.com.br/api/webhooks/bling?token=SEU_BLING_WEBHOOK_SECRET
```

Assine os eventos de **produto** e **estoque**. Para conferir se a rota está de pé, abra a mesma URL sem o token no navegador: ela responde `{"ok":true,"configurado":true}`.

---

## Limites do Bling

- **3 requisições por segundo** e **120 mil por dia**, para a conta inteira — não por aplicativo.
- Estourar devolve **HTTP 429**; o cliente espera e tenta de novo (1s, 2s, 4s).
- Por isso o catálogo é cacheado por 10 minutos (ISR) e o webhook é quem força a atualização. Consultar o Bling a cada visita seria inviável.

---

## Ainda não implementado

- **Fotos dos produtos.** O `imagemURL` e `midia.imagens` já estão tipados, mas só valem se as imagens estiverem cadastradas no Bling. Hoje a loja usa fotos por categoria.
- **Criação de pedido de venda.** É da Fase 3, junto com o pagamento. O escopo já foi concedido.
