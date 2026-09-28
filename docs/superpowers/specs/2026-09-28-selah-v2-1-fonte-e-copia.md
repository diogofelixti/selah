# Selah v2.1: nova fonte e cópia de versículos

Complemento das specs `2026-09-27-selah-design.md` e `2026-09-28-selah-v2-visual-controle-design.md`. Data: 2026-09-28.

**Estado:** aprovada. Fonte escolhida: opção A (Lora e Source Sans 3). Cópia de versículos aprovada como está.

## 1. Nova fonte

**Problema:** a combinação atual (Fraunces nos títulos, Manrope na interface, Literata no texto bíblico) não agradou.

**Regras que continuam valendo:**
- No máximo 3 famílias.
- Todas livres e disponíveis no Fontsource, para funcionar offline.
- Boa acentuação em português.
- O texto bíblico precisa de uma fonte feita para leitura longa.

**Opções para comparar:**

| Opção | Títulos e números | Interface | Texto bíblico | Sensação |
|---|---|---|---|---|
| A. Clássica | Lora | Source Sans 3 | Lora | Livro impresso, sóbria e familiar |
| B. Elegante | Cormorant Garamond | Nunito Sans | EB Garamond | Bíblia tradicional, mais refinada |
| C. Moderna limpa | DM Serif Display | DM Sans | Source Serif 4 | Contemporânea, com contraste nos títulos |
| D. Só sem serifa | Plus Jakarta Sans | Plus Jakarta Sans | Literata | App moderno; a serifa fica só na leitura |

**Decisão (2026-09-28):** opção A. Lora nos títulos, nos números grandes e no texto bíblico; Source Sans 3 na interface. Fraunces, Manrope e Literata saem do projeto.

**Implementação depois da escolha:** trocar os pacotes Fontsource e os tokens `--font-display`, `--font-ui` e `--font-read`, e só isso. Nenhum componente muda, porque todos já usam os tokens.

## 2. Copiar versículos

**Objetivo:** facilitar copiar e compartilhar trechos da Bíblia.

### No leitor

- **Selecionar:** tocar num versículo o seleciona e o destaca com fundo dourado claro. Tocar em outros versículos soma à seleção, e tocar num já selecionado o tira.
- **Barra de ações:** com pelo menos um versículo selecionado, aparece uma barra fixa no rodapé com **Copiar**, **Compartilhar** (só onde o aparelho oferece compartilhamento nativo) e **Cancelar**. A barra mostra quantos versículos estão selecionados ("3 versículos").
- **Depois de copiar ou compartilhar:** a seleção é limpa e aparece um aviso curto, "Copiado".
- **O que muda no leitor:** tocar num versículo passa a selecionar. Nenhum outro gesto do leitor muda.

### Formato do texto copiado

- **Um versículo:** o texto entre aspas, depois a referência e a tradução.
  `“Porque Deus amou ao mundo de tal maneira...” João 3:16 (BLIVRE)`
- **Vários versículos seguidos:** o texto com os números dos versículos, e a referência como intervalo com hífen simples.
  `16 Porque Deus amou... 17 Porque Deus enviou... João 3:16-17 (BLIVRE)`
- **Versículos não seguidos:** os números separados por vírgula na referência, e o texto de cada um com seu número.
  `João 3:16, 18`
- **Palavras implícitas:** as palavras entre colchetes da Bíblia Livre são copiadas sem os colchetes, como texto normal.
- **Tradução:** a sigla da tradução vai sempre no fim (BLIVRE ou BSB). Isso também atende a atribuição que a licença CC BY da Bíblia Livre pede.
- **Hífen:** o intervalo usa hífen comum (`-`). A regra do app proíbe travessão e meia risca, não o hífen.

### Outros lugares

- **Tela inicial:** o cartão do versículo do dia ganha um botão pequeno de copiar.
- **Temas:** cada versículo da lista ganha um botão pequeno de copiar, que copia no formato de um versículo.

### Detalhes técnicos

- **Cópia:** usa `navigator.clipboard.writeText` quando disponível. Sem ele, o que acontece no teste pela rede local sem HTTPS, usa um `textarea` temporário com `document.execCommand('copy')`. Se as duas falharem, aparece "Não foi possível copiar".
- **Compartilhar:** usa `navigator.share({ text })` e só aparece quando `navigator.share` existe.
- **Código:** a montagem do texto fica numa função pura, `formatSelection(book, chapter, verses, texts, bookName, translation)`, testada com Vitest.

### Testes

- **Unitários:** um versículo; vários seguidos; não seguidos; palavras implícitas sem colchetes; tradução no fim; nenhum travessão no resultado.
- **No navegador:**
  - Selecionar e desmarcar versículos.
  - Copiar e conferir o texto na área de transferência (Playwright com permissão de clipboard).
  - Cópia pelo caminho de fallback (sem `navigator.clipboard`).
  - Botões de copiar no versículo do dia e nos temas.
