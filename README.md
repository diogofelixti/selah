# Selah · Leitura bíblica

PWA gratuito de leitura bíblica em português e inglês. Spec em `docs/superpowers/specs/2026-09-27-selah-design.md`.

## Desenvolvimento

```bash
npm install
npm run dev        # servidor local
npm test           # testes unitários
npm run e2e        # testes no navegador (Playwright)
npm run check      # tipos
```

## Textos bíblicos

`npm run bibles` baixa a Bíblia Livre (eBible.org) e a BSB (BereanBible.com) e grava `public/bibles/`. Os arquivos gerados ficam no repositório. Ao regenerar com textos novos, troque o sufixo em `src/lib/bible/cache-name.ts` para os aparelhos baixarem de novo.

## Publicação

O app roda no frodo (nginx atrás da Cloudflare) em `/var/www/selah`. A configuração do nginx está em `deploy/nginx/selah.conf`.

```bash
SELAH_DEPLOY_TARGET=usuario@frodo npm run deploy
```
