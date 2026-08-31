# Identidade visual — Kambada

> Guia de referência do novo site e checklist do **Gate 5** do Gauntlet.
> Base: leitura do site em produção (somoskambada.com.br) e dos ativos de marca, em 2026-08-30.
> Atualizar sempre que a implementação mudar.

---

## 1. A marca em uma frase

A Kambada nasceu de uma brincadeira em família — o *Arraial da Cambada na Roça* — e virou marca vendendo matraquinhas de brinde. Veste o São João maranhense: Bumba Meu Boi, reggae, matraca, a Ilha do Amor. **O site é festa, não vitrine neutra.**

## 2. Símbolo

O logotipo tem duas partes: o **caranguejo** (sorriso com pernas e antenas, traço à mão) e o **lettering "Kambada"** manuscrito. O caranguejo não é ornamento — é o símbolo da marca, e a página Sobre conta "100+ caranguejos felizes" para falar de clientes.

Arquivos em `public/marca/`:

| Arquivo | Uso |
|---|---|
| `kambada-logo-horizontal-amarelo.png` | Cabeçalho e rodapé. Fundo transparente. |
| `kambada-logo-empilhado-amarelo.jpg` | Compartilhamento social (OG image). Fundo grafite. |
| `kambada-logo-empilhado-preto.jpg` | Aplicação sobre fundo claro. |

> **Pendência:** não existe versão vetorial. Os arquivos atuais são raster e não escalam para favicon nítido nem para impressão. Pedido de SVG/AI aberto com o Alexandre.

## 3. Paleta

Valores computados diretamente do site em produção. Tokens em `src/app/globals.css`.

| Token | Hex | Papel |
|---|---|---|
| `kambada-amarelo` | `#FFCC29` | Cor da marca. Logo, títulos de destaque, botões primários, bloco de chamada. |
| `kambada-amarelo-escuro` | `#E0AF14` | Estado hover do amarelo. Derivado — não aparece no site atual. |
| `kambada-grafite` | `#1D1E20` | Fundo padrão de todo o site. |
| `kambada-preto` | `#000000` | Fundo do rodapé. |
| `kambada-branco` | `#FFFFFF` | Texto sobre fundo escuro. |
| `kambada-neblina` | `#F1F1F1` | Fundo claro, quando houver. |
| `kambada-cinza` | `#5E6266` | Texto de apoio sobre fundo claro. |

**Regra de contraste:** amarelo `#FFCC29` sobre grafite dá ~10:1 e passa folgado em AAA. O inverso — texto grafite sobre amarelo — também passa. O que **não** pode é amarelo sobre branco (~1.7:1): reprova em qualquer nível.

## 3.1 Os dois temas

O site tem tema claro e escuro. A escolha fica salva no navegador; sem escolha, segue a preferência do sistema.

**O escuro é o tema da marca** — é o que o site em produção usa, e nele o amarelo é cor de letra.

**No claro há uma restrição dura:** `#FFCC29` sobre branco dá ~1,7:1 de contraste e reprova em qualquer nível de acessibilidade. A solução foi **não inventar outra cor de marca**: no tema claro o amarelo deixa de ser cor de letra e vira **marca-texto** — fundo amarelo com letra grafite, ~11:1. A classe `.destaque` faz essa troca sozinha.

| Papel | Escuro | Claro |
|---|---|---|
| Fundo | `#1D1E20` | `#FAF8F3` (off-white quente) |
| Texto | branco | `#1D1E20` |
| Superfície (cartões) | branco a 3% | `#F2EFE7` |
| Trecho em destaque | letra `#FFCC29` | fundo `#FFCC29`, letra grafite |
| Botão primário | `#FFCC29` com letra grafite | igual |
| Rodapé | preto | preto |

O rodapé permanece escuro nos dois temas: é a assinatura visual da marca.

## 4. Tipografia

O site atual carrega três famílias — DM Sans, Poppins e Inter — fazendo o trabalho de duas.

| Papel | Fonte | Onde |
|---|---|---|
| Display | **Poppins** (600/700/800) | Títulos, botões, rótulos de seção |
| Texto | **DM Sans** | Parágrafos, navegação, listas |

**Divergência intencional:** Inter foi eliminada. Poppins é geométrica e festiva, combina com o traço redondo do lettering; DM Sans segura o texto longo. Duas famílias em vez de três, sem perda de caráter.

## 5. Tom de voz

Primeira pessoa do plural, oralidade maranhense, afeto. Vocabulário da casa: *"maranhense que só"*, *"se achega"*, *"vem sem medo de dançar"*, *"cadê a graça?"*, *"moleira"*.

**Regra:** o texto institucional publicado hoje foi transposto para o novo site **sem reescrita**. Essa voz é patrimônio da marca — só o Alexandre a altera.

## 6. Elementos gráficos

- Cantos generosamente arredondados (`rounded-2xl`, `rounded-3xl`) e botões em pílula — ecoam o traço manuscrito do logo.
- Fundo escuro como padrão; o amarelo entra como **acento**, nunca como fundo de página inteira.
- Um bloco amarelo sólido por página, no máximo, para a chamada principal.
- Divisores em `white/10` — separam sem endurecer.

## 7. Checklist do Gate 5

A cada rodada do Gauntlet, conferir em cada screenshot:

- [ ] Logo presente, nítido, e carregado de verdade (`naturalWidth > 0`)
- [ ] Amarelo `#FFCC29` aplicado em pelo menos um elemento visível
- [ ] Fundo grafite `#1D1E20`; rodapé preto
- [ ] Poppins nos títulos, DM Sans no texto
- [ ] Nenhum texto em amarelo sobre fundo claro
- [ ] Tom de voz preservado — nada de linguagem genérica de e-commerce
- [ ] Referência cultural visível (matraca, Boi, reggae, Ilha do Amor, caranguejo)
- [ ] Um único H1 por página
- [ ] Nenhuma rolagem horizontal em 375px

## 8. Divergências intencionais em relação ao site atual

Registradas para não serem confundidas com defeito:

1. **Inter removida** — três famílias reduzidas a duas (§4).
2. **Navegação enxuta** — "Loja" entra na Fase 2, com o catálogo real; não há link para página inexistente.
3. **Rodapé reorganizado** — navegação e canais de contato em colunas; o rodapé atual só tem newsletter e direitos.
4. **"All rights reserved" traduzido** para "Todos os direitos reservados", e o ano passa a ser dinâmico (o site atual está congelado em 2025).
5. **Contato virou página própria** — hoje é só um botão para o WhatsApp.

Nenhuma delas mexe em paleta, logo, motivos culturais ou tom de voz.
