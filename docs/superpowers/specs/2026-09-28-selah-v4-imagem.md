# Selah v4: versículo como imagem

Complemento das specs anteriores. Data: 2026-09-28.

**Estado:** decisões tomadas pelo implementador, a quem o dono do projeto delegou os detalhes. Estão marcadas para revisão.

## Objetivo

Compartilhar versículos como uma imagem bonita, no estilo do app, para redes sociais e mensagens.

## Onde

- No leitor, o botão **Compartilhar** da barra de seleção abre duas opções: **Texto** (o comportamento atual) e **Imagem**.
- Sem compartilhamento nativo (`navigator.share`), o botão aparece do mesmo jeito. Nesse caso "Texto" copia, e "Imagem" baixa o arquivo.
- O versículo do dia, na tela inicial, ganha um botão **Compartilhar imagem** ao lado do botão de copiar.

## A imagem

- **Formato:** PNG de 1080 × 1350 (4:5, bom para Instagram e WhatsApp).
- **Cores do tema ativo:** fundo `--bg`, texto `--text` e detalhes em `--accent-text`, no Aurora ou no Noite.
- **Texto do versículo:** em Lora, centralizado. O tamanho começa em 64 px e diminui até 36 px para caber. Vários versículos levam o número antes de cada um.
- **Rodapé da imagem:**
  - A referência com a sigla da tradução ("João 3:16 · BLIVRE").
  - A palavra "Selah" pequena, em dourado.
- **Palavras implícitas:** saem sem colchetes, como na cópia.
- **Trecho longo demais:** se não couber nem em 36 px, a opção Imagem fica desativada e aparece a dica "Trecho longo demais para imagem. Selecione menos versículos."

## Compartilhar

- **Com compartilhamento de arquivos** (`navigator.canShare({ files })`): usa `navigator.share({ files: [imagem] })`.
- **Sem isso:** baixa `selah-joao-3-16.png`.
- **Mensagens:**
  - Cancelar não mostra nada.
  - Um erro mostra "Não foi possível compartilhar".
  - Depois de baixar, aparece "Imagem salva".

## Código

- **`src/lib/verse-image.ts`:**
  - `layoutVerseImage(text, measure, opts)`: função pura que quebra linhas e escolhe o tamanho da fonte, testada com uma medida falsa.
  - `renderVerseImage(...)`: desenha no `<canvas>` e devolve um `Blob`. Espera a fonte Lora carregar antes de desenhar.
- **`src/lib/share-image.ts`:** `shareOrDownload(blob, filename)` escolhe entre compartilhar e baixar.
- **O texto da imagem:** vem da mesma seleção da cópia, só que sem aspas e sem a referência no corpo. A referência vai no rodapé.

## Testes

- **Unitários:**
  - Quebra de linhas.
  - Redução da fonte.
  - Trecho longo demais.
  - Nome do arquivo.
  - Escolha entre compartilhar e baixar.
- **No navegador:**
  - Abrir as opções de Compartilhar.
  - Baixar a imagem sem `navigator.share` e conferir que é um PNG de 1080 × 1350.
  - Com um `navigator.share` falso que aceita arquivos, o arquivo compartilhado é um PNG.
  - Trecho longo demais desativa a opção.
  - O botão da tela inicial funciona.
