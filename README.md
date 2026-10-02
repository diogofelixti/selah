# Selah · Leitura bíblica

**Selah** é um app gratuito de leitura bíblica, sem anúncios, em português e inglês. Ele funciona no navegador e pode ser instalado no celular como app (PWA). Depois da primeira carga, a leitura funciona sem internet.

Acesse em **https://selah.selatech.com.br**. Saiba mais em [selatech.com.br/pt/selah](https://selatech.com.br/pt/selah).

A palavra "Selah" aparece nos Salmos como um convite à pausa e à meditação. O app quer passar essa sensação: calma, clareza e nada de poluição visual.

## O que o app faz

- **Leitura:**
  - Leitor confortável, com tamanho de letra ajustável.
  - Leitura em voz alta e busca por palavra.
  - Destaques e anotações nos versículos.
- **Progresso:** quanto você já leu da Bíblia, de cada testamento e de cada livro, além dos dias em que leu na semana.
- **Planos de leitura:**
  - João em 21 dias, Bíblia em 1 ano e em 2 anos.
  - Histórias de personagens da Bíblia.
  - "Um livro para cada momento", com um livro escolhido para cada necessidade.
  - Se você parar alguns dias, o plano continua de onde você parou.
- **Versículos por tema:** Ansiedade, Esperança, Perdão, Família e outros, com uma frase de acolhimento em cada tema.
- **Versículo do dia** e dicas de leitura.
- **Compartilhar:** o versículo vira uma imagem no estilo do tema escolhido.
- **Temas visuais:** Aurora, Noite, Pergaminho e Oliveira.
- **Lembrete diário** por notificação.
- **Conta Google (opcional):** sincroniza o progresso entre aparelhos.
- **Sem conta:** o progresso fica no aparelho, e você pode exportar ou importar um arquivo de backup.

## Traduções

| Idioma | Tradução | Licença |
|---|---|---|
| Português | Bíblia Livre (BLIVRE), de [eBible.org](https://ebible.org/) | Creative Commons Atribuição 4.0 Brasil |
| Inglês | Berean Standard Bible (BSB), de [BereanBible.com](https://bereanbible.com/) | Domínio público |

O texto bíblico é mantido como na fonte. A única exceção são espaços soltos antes da pontuação, removidos na conversão. Na Bíblia Livre, as palavras acrescentadas pelos tradutores aparecem em itálico.

## Como funciona

- **App:** Svelte 5, Vite e TypeScript. É um site estático com service worker (Workbox) e guarda os dados no IndexedDB do aparelho.
- **Servidor (`server/`):** API em Hono com Postgres. Ela cuida só do que precisa de servidor: o lembrete por notificação e a sincronização da conta Google. O app funciona sem ela.
- **Textos (`public/bibles/`):** um JSON por livro, gerados por `npm run bibles`.

A especificação do produto e do design técnico está em [`docs/superpowers/specs/2026-09-27-selah-design.md`](docs/superpowers/specs/2026-09-27-selah-design.md). Cada versão tem a própria spec na mesma pasta.

## Desenvolvimento

Precisa de Node.js 20 ou mais novo.

```bash
npm install
npm run dev          # servidor local do app
npm test             # testes unitários
npm run e2e          # testes no navegador (Playwright)
npm run check        # tipos
npm run server:test  # testes da API (usa um Postgres de verdade)
```

### Textos bíblicos

`npm run bibles` baixa a Bíblia Livre e a BSB e converte os textos. Ele grava três coisas, que ficam no repositório:

- os livros, em `public/bibles/`;
- a contagem de versículos, em `src/lib/bible/verse-counts.json`;
- o texto do versículo do dia, em `src/content/daily-verse-texts.json`.

Depois de mudar a lista do versículo do dia (`src/content/daily-verses.json`), rode `npm run daily-texts`.

Se o texto mudar, troque o sufixo em `src/lib/bible/cache-name.ts`. Assim os aparelhos baixam os livros de novo.

### Regras de conteúdo

- Os textos escritos para o app não usam travessão. O build falha se encontrar um (`npm run check:dashes`).
- Todo texto existe em `src/i18n/pt.json` e `src/i18n/en.json`, com as mesmas chaves.
- O tom é acolhedor e sem culpa.

## Publicação

O app e a API rodam num servidor próprio, atrás da Cloudflare. O passo a passo está em [`deploy/README.md`](deploy/README.md).

```bash
SELAH_DEPLOY_TARGET=usuario@servidor npm run deploy
```

O comando roda os testes, gera o build, copia o app e a API e sobe os containers.

## Licença

O código está sob a [licença MIT](LICENSE). Os textos bíblicos seguem as licenças de cada tradução (veja [Traduções](#traduções)).

## Contato

O Selah é feito pela [Selatech](https://selatech.com.br).
