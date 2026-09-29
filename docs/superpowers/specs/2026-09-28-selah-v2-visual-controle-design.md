# Selah v2: novo visual, Controle de leitura e planos com marcação

Complemento da spec `2026-09-27-selah-design.md`. Onde este documento não fala nada, vale a spec original. Data: 2026-09-28.

Referência visual aprovada: canvas "Selah · Telas" (https://claude.ai/artifact/VVMoEP4utsmXm7moVQ1Nw5), linha **"Estrutura B: cores claras e plano"** (telas *B claro · Início*, *B claro · Controle* e *B claro · Plano*).

## 1. O que muda e por quê

- **Visual:** a primeira versão estava funcional, mas sem personalidade. O novo visual usa a estrutura da direção B (números grandes, cartões arredondados, barra de navegação flutuante, pílulas) com a paleta clara e dourada da direção A.
- **Controle de leitura:** muita gente lê em outra Bíblia (papel, outro app, na igreja) e quer o Selah só para registrar o que leu. Hoje isso só é possível tocando e segurando um capítulo, um gesto escondido. A v2 ganha uma aba própria para isso.
- **Planos com marcação:** o plano passa a funcionar como checklist. Cada capítulo do dia pode ser marcado sem abrir o texto, e o plano mostra a porcentagem concluída.

## 2. Navegação

Barra inferior flutuante com **5 abas**: **Início, Ler, Controle, Planos, Temas**.

- **Ler** é a antiga aba "Bíblia": testamentos, livros e grade de capítulos que abre o leitor. Continua aceitando tocar e segurar para marcar.
- **Controle** é nova (seção 4).
- As rotas `#/biblia` e `#/livro/<ID>` continuam funcionando, e a nova rota é `#/controle`.

## 3. Tela inicial

De cima para baixo:

1. **Cabeçalho:** saudação pequena ("Boa tarde") acima do nome **Selah** em serifa, e um botão redondo que abre os Ajustes.
2. **Cartão de progresso:**
   - "Bíblia lida" e a porcentagem em número grande (ex.: `23%`), com "274 de 1.189 capítulos" ao lado.
   - Uma barra dividida em duas partes proporcionais ao tamanho de cada testamento (929 e 260 capítulos). A parte do AT é dourada e a do NT é azul, cada uma preenchida com o progresso daquele testamento.
   - Legenda: "Antigo 18%" e "Novo 40%".
   - **Esta semana:** 7 bolinhas, uma para cada um dos últimos 7 dias locais, com a inicial do dia. Dia com leitura fica preenchido, e hoje tem um anel em volta.
3. **Dois atalhos lado a lado:**
   - **Continuar** (cartão escuro): leva ao último capítulo aberto. Sem histórico, mostra "Começar" e leva a João 1.
   - **Controle** (cartão claro): abre a aba Controle.
4. **Versículo do dia:** mantém o comportamento atual, inclusive a mensagem de erro com "Tentar de novo".
5. **Plano atual** (só com plano ativo):
   - Nome do plano e porcentagem.
   - Linha "Hoje: Lucas 10 a 12 · 1 de 3 lidos" e barra de progresso.
   - Tocar abre a tela do plano.
6. **Dica do dia:** cartão discreto no fim.

## 4. Controle de leitura (nova aba)

**Objetivo:** marcar capítulos lidos sem abrir o texto.

- **Cabeçalho:** rótulo "Controle", título "O que já li", porcentagem geral grande e a frase "X de 1.189 capítulos. Toque num livro e marque os capítulos lidos, mesmo que tenha lido em outra Bíblia."
- **Filtro:** duas pílulas, "Antigo N%" e "Novo N%", uma selecionada por vez. Começa no Antigo.
- **Lista de livros:** todos os livros do testamento, em ordem canônica. Cada linha mostra um anel com a porcentagem, o nome do livro e "X de Y capítulos".
- **Livro aberto:**
  - Tocar numa linha abre o livro ali mesmo. Só um livro fica aberto por vez, e tocar de novo fecha.
  - Aparece a grade de capítulos (6 por linha, alvos de 46px). Capítulo lido é uma pílula dourada preenchida; não lido é só o contorno.
  - Tocar num capítulo marca ou desmarca na hora, e as porcentagens do livro, do testamento e da Bíblia atualizam na tela.
  - **Marcar livro inteiro:** registra leitura só para os capítulos que ainda não estavam marcados.
  - **Limpar:** desmarca o livro todo, com confirmação ("Desmarcar todos os capítulos de Êxodo?").
- **Regra de dados:** o Controle mostra o progresso geral (capítulo com qualquer leitura registrada). Marcar cria um evento de leitura, e desmarcar apaga todos os eventos do capítulo, como na spec original (7.3).

## 5. Planos com marcação

A tela do plano ativo passa a ser um checklist.

- **Cartão de topo:**
  - Rótulo "Plano atual", nome do plano e porcentagem grande.
  - Barra de progresso e a linha "X de Y capítulos · Dia N de T".
  - Faixa com 7 bolinhas numeradas: os 3 dias antes do dia atual, o dia atual e os 3 seguintes, dentro dos limites do plano. Dia concluído fica preenchido, e o dia atual tem um anel em volta.
- **Frase de apoio:** "Leu em outra Bíblia? Marque aqui. Tudo que você marca no plano também conta no Controle."
- **Cartões de dia:** o dia atual (com a etiqueta **Hoje** e borda dourada) e os 2 seguintes.
  - Cada capítulo é uma pílula que marca ou desmarca ao toque, com um botão redondo ao lado para abrir o capítulo no leitor.
  - "Marcar o dia todo" aparece enquanto o dia tiver capítulos não lidos.
- **Porcentagem do plano:** capítulos do plano lidos desde o início do plano, divididos pelo total de capítulos do plano. Os dias concluídos continuam contados como antes.
- **Regra de dados:** marcar no plano cria um evento de leitura, e ele conta também no Controle. Desmarcar no plano segue a regra do leitor (spec original 4.4 e `isChapterDone`).
- **Lista de planos:** continua abaixo, com os planos disponíveis e o botão "Começar". O cartão de cada plano passa a mostrar a porcentagem quando ele é o plano ativo.

## 6. Visual

### Tipografia

- **Fraunces** para títulos, números grandes e o versículo do dia.
- **Manrope** para a interface.
- **Literata** continua no texto bíblico do leitor, porque foi feita para leitura longa.
- Todas hospedadas junto com o app (Fontsource), sem Google Fonts em tempo de execução.

### Paleta do tema Aurora (claro)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F7F2EA` | fundo |
| `--surface` | `#FFFDF9` | cartões, barra de navegação |
| `--surface-2` | `#F2EADC` | botões secundários, fundos sutis |
| `--track` | `#EFE4D1` | trilho de barras e anéis, dias sem leitura |
| `--border` | `#E6DCCB` | bordas de cartões |
| `--border-strong` | `#E0D3BC` | contorno de pílulas não marcadas |
| `--text` | `#221C15` | texto principal, cartão "Continuar" |
| `--text-2` | `#6E6254` | texto secundário |
| `--accent` | `#9A6B1F` | preenchimentos: barras, anéis, pílulas marcadas |
| `--accent-text` | `#8A5F17` | rótulos e links em dourado |
| `--on-accent` | `#FFFDF9` | texto sobre `--accent` |
| `--nt` | `#4F7A94` | parte do Novo Testamento na barra dividida |
| `--flash` | `#F6E7C4` | destaque do versículo aberto |

Contraste AA: `--text-2` sobre `--bg` dá 5,3:1; `--accent-text` sobre `--surface` dá 5,5:1 (5,0:1 sobre `--bg`); `--on-accent` sobre `--accent` dá 4,6:1. Números grandes (a partir de 24px) seguem a regra de 3:1.

### Formas

- Cartões com raio de 24px.
- Pílulas e botões totalmente arredondados.
- Barra de navegação flutuante: 14px das bordas, raio de 24px, sombra suave.
- Alvos de toque de pelo menos 44px, como na spec original.

### Outras telas

Leitor, Ler (livros e grade), Temas, Ajustes e Sobre passam a usar os mesmos tokens, fontes e formas. A estrutura dessas telas não muda.

### Tema escuro

Implementado em 2026-09-28 como tema **Noite** (`src/styles/themes/noite.css`), com as cores da direção B do canvas.
- **Ajuste "Tema visual":** Automático (padrão, segue o modo claro ou escuro do aparelho), Aurora (claro) ou Noite (escuro).
- **Contraste:** um teste confere o contraste AA dos dois temas.
- **Barra do navegador:** a cor do topo do navegador acompanha o fundo do tema.
- **Carregamento:** uma linha no `index.html` evita o clarão de tela clara antes de o app carregar.

## 7. Fora deste escopo

- O ícone definitivo: você está gerando com os prompts, e ele entra quando estiver pronto.
- O tema escuro.
- Qualquer mudança nas traduções, no armazenamento ou no formato do backup. A v2 não cria dados novos, só novas formas de marcar os mesmos eventos de leitura.

## 8. Testes

- **Unitários:**
  - Porcentagem do plano por capítulos.
  - Janela de 7 dias da faixa do plano, respeitando início e fim.
  - Os 7 dias da semana na tela inicial (lidos, hoje, iniciais no fuso local).
  - "Marcar livro inteiro" só cria eventos para capítulos não marcados.
- **No navegador (Playwright):**
  - Controle: abrir um livro, marcar e desmarcar um capítulo, ver as porcentagens mudarem, "Marcar livro inteiro", e "Limpar" com confirmação.
  - Plano: marcar pelas pílulas sem abrir o leitor, "Marcar o dia todo", avanço do dia e da porcentagem.
  - Tela inicial: bolinhas da semana e os atalhos "Continuar" e "Controle".
  - Navegação pelas 5 abas.
- Os testes atuais que mudarem de texto ou de estrutura são atualizados, sem perder o comportamento que cada um verifica.
