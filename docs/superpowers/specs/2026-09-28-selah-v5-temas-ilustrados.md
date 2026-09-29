# Selah v5: temas ilustrados Pergaminho e Oliveira

Complemento das specs anteriores. Data: 2026-09-28.

**Estado:** decisões tomadas pelo implementador, a quem o dono do projeto delegou os detalhes. Estão marcadas para revisão.

## Objetivo

Fechar o item 1 do roteiro (§10 da spec original): além de Aurora e Noite, dois temas com ilustrações em traço fino.

## Os temas

- **Pergaminho (claro):**
  - Papel envelhecido (`--bg` #f1e7d0) com textura de papel bem leve.
  - Tinta sépia no texto.
  - Destaque em vermelho de rubrica, como nos manuscritos.
  - Ilustrações: lamparina a óleo e rolo de pergaminho.
- **Oliveira (escuro):**
  - Verde-oliva profundo.
  - Texto creme e destaque em verde de azeitona.
  - Ilustrações: ramo de oliveira e oliveira.
- **Contraste:** os dois passam nas mesmas regras de contraste que já valem para Aurora e Noite (testes em `src/styles/contrast.test.ts`).
- **Automático:** continua alternando entre Aurora e Noite. Pergaminho e Oliveira são escolhas fixas.

## Ilustrações

- **Onde aparecem:**
  - No cabeçalho da tela inicial.
  - No cabeçalho das páginas (`.page-head`).
  - Nos estados vazios (`.empty`).
- **Onde não aparecem:** nunca atrás do texto bíblico, e o leitor não tem ilustração.
- **Arquivos:** um SVG de traço único por ilustração, em `src/assets/illustrations/`.
- **Cor:** o SVG é aplicado como máscara CSS (`mask-image`) e pintado com `--illus-color`. Assim a cor vem do tema e nenhum SVG tem cor fixa.
- **Tokens de cada tema:**
  - `--illus-display` (`none` ou `block`).
  - `--illus-head`, `--illus-home` e `--illus-empty` (as imagens).
  - `--illus-color`.
- **Acessibilidade:**
  - São decoração: pseudo-elementos, fora da árvore de acessibilidade.
  - Não recebem toque (`pointer-events: none`).
- **Textura do Pergaminho:** ruído SVG (`feTurbulence`) de opacidade muito baixa no fundo da página. O contraste do texto é calculado sobre `--bg` e a textura não muda esse cálculo de forma perceptível.

## Escolha do tema nos Ajustes

- Cada opção mostra uma amostra com três cores do próprio tema: fundo, destaque e texto.
- A amostra usa os tokens do tema: o elemento recebe `data-theme` e os seletores dos temas passam de `:root[data-theme=…]` para `[data-theme=…]`.
- Some a frase "Mais temas em breve".

## Sem piscar ao abrir

- Hoje o `index.html` só olha o modo escuro do aparelho antes de o app carregar. Quem escolheu outro tema vê o tema errado por um instante.
- O app passa a guardar a escolha em `localStorage` (`selah-theme`).
- O script do `index.html` aplica essa escolha antes de desenhar a tela.
- Sem `localStorage` (bloqueado ou vazio), vale o comportamento atual.

## Testes

- **Contraste:** Pergaminho e Oliveira entram nos testes de contraste.
- **Unitário:** `resolveTheme` com os temas novos.
- **No navegador:**
  - Escolher Pergaminho aplica o tema e mostra a ilustração no cabeçalho das páginas.
  - O leitor não mostra ilustração.
  - Estado vazio das Marcações ilustrado no Oliveira.
  - Recarregar sem o JavaScript do app mantém o tema escolhido (script do `index.html`).
  - Aurora e Noite continuam sem ilustração.
