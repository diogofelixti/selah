# Selah v10: um livro para cada momento e revisão da curadoria

Complemento das specs anteriores. Data: 2026-10-02.

**Estado:** o dono pediu a seção e aprovou três decisões em 2026-10-02: ela é um grupo dentro de Planos; Salmos, Números e Êxodo usam seleções; as frases de tom mais duro foram suavizadas. Os demais detalhes foram decididos pelo implementador e estão marcados para revisão.

## Planos: Um livro para cada momento

É um grupo novo na tela Planos, **Um livro para cada momento** / **A book for every season**. Ele fica logo depois de "Para começar", porque também serve a quem não sabe por onde começar.

- **Ritmo:** um capítulo por dia.
- **Cartão:** o nome do plano aparece pequeno, em cima ("Efésios em 6 dias"), e a frase de propósito é o título do cartão. O botão diz "Começar: <frase>".
- **João e Provérbios** já tinham plano. Eles aparecem também neste grupo, com a frase nova, e continuam em "Para começar". É o mesmo plano, com o mesmo progresso.
- **Ordem:** uma trilha para quem está começando. Primeiro os Evangelhos e Atos, depois as cartas, os livros de sabedoria, a história do Antigo Testamento e por fim o Apocalipse.

| Id | Frase | Capítulos | Dias |
|---|---|---|---|
| `mark` | Conhecer o que Jesus fez | Marcos | 16 |
| `john-21` | Conhecer quem Jesus é | João | 21 |
| `luke` | Conhecer o coração de Jesus | Lucas | 24 |
| `matthew` | Conhecer os ensinamentos de Jesus | Mateus | 28 |
| `acts` | Conhecer o nascimento da igreja e o poder do Espírito Santo | Atos | 28 |
| `romans` | Clareza sobre o Evangelho | Romanos | 16 |
| `galatians` | Viver livre, sem amarras religiosas | Gálatas | 6 |
| `ephesians` | Conhecer sua identidade em Cristo | Efésios | 6 |
| `philippians` | Encontrar alegria nas provações | Filipenses | 4 |
| `james` | Uma fé que aparece nas atitudes | Tiago | 5 |
| `1-corinthians` | Como viver uma vida santa no mundo de hoje | 1 Coríntios | 16 |
| `hebrews` | Por que Jesus é melhor que qualquer coisa deste mundo | Hebreus | 13 |
| `psalms-lament` | Aprender a orar com honestidade e em meio à dor | Salmos 3, 4, 6, 13, 22, 23, 25, 27, 31, 32, 34, 38, 39, 40, 42, 43, 46, 51, 55, 56, 62, 69, 73, 77, 86, 88, 90, 121, 130 e 142 | 30 |
| `proverbs-31` | Como ter sabedoria no dia a dia | Provérbios | 31 |
| `ecclesiastes` | Encontrar sentido para a vida em Deus | Eclesiastes | 12 |
| `genesis` | Conhecer a origem do mundo e por que ele está quebrado | Gênesis | 50 |
| `exodus` | Como Deus liberta os que creem | Êxodo 1 a 20 | 20 |
| `numbers` | Confiar em Deus no deserto | Números 9 a 14, 16, 17, 20 e 21 | 10 |
| `revelation` | A vitória final de Jesus | Apocalipse | 22 |

- **Salmos:** salmos de lamento e de confiança, em que o autor fala com Deus sobre a dor sem esconder nada.
- **Êxodo:** da escravidão à aliança no Sinai. Do capítulo 21 em diante vêm as leis e a construção do tabernáculo.
- **Números:** a nuvem que guia, as reclamações, os espias, Corá, a água da rocha e a serpente de bronze. O censo e as leis ficam de fora.
- **Efésios:** o pedido dizia "a identidade de Cristo". A frase virou "sua identidade em Cristo", que é o tema da carta (capítulos 1 a 3). O dono confirmou em 2026-10-02.
- **Tom:** "Entender por que a vida sem Deus não tem significado" e "Como ter uma vida santa em um mundo corrupto" soavam mais duras que as outras. O dono escolheu suavizar as duas em 2026-10-02.
- **As outras frases** são as do dono, com a ortografia corrigida ("por que", "mundo", "origem", "liberta", "Espírito") e "ele é quebrado" trocado por "ele está quebrado".
- **Frases ajustadas com aprovação do dono:** "Confiar em Deus no deserto" (era sobre a reclamação atrasar as promessas), "Uma fé que aparece nas atitudes" e "A vitória final de Jesus".

## Planos divididos por versículos

"Salmos em 30 dias" e "Bíblia em 2 anos" passam a dividir o texto pelo **número de versículos**, e não mais pelo número de capítulos.

- **Antes:**
  - Salmos em 30 dias tinha 5 salmos por dia, e o dia 24 trazia o Salmo 119 inteiro (176 versículos).
  - Bíblia em 2 anos fazia 2 capítulos por dia até o dia 459 e 1 por dia depois disso.
- **Agora:** cada dia fica perto da média de versículos. O Salmo 119 ganha um dia só para ele.
- **Regra:** cada dia leva capítulos seguidos, na ordem, até chegar o mais perto possível da média do que falta. Todo dia tem pelo menos um capítulo.
- **Quem já tem um desses planos ativo** não perde nada, porque o progresso vem dos capítulos lidos. Muda só qual dia aparece como o próximo.
- **Dados:** a contagem de versículos de cada capítulo fica em `src/lib/bible/verse-counts.json`, gerado por `npm run bibles`. Um teste confere a contagem com as duas traduções.

## Curadoria

- **Provérbios 3:6** tem erro de concordância na Bíblia Livre ("todas os teus caminhos").
  - Sai do versículo do dia. Entra Provérbios 16:3 ("Confia tuas obras ao SENHOR").
  - Sai do tema Sabedoria para decidir. Entra Salmos 143:8 ("faze-me saber o caminho que devo seguir").
  - Salmos 32:8 foi considerado, mas também tem erro na Bíblia Livre ("e de ensinarei").
- **Josué 24:15** só fala de família na última frase. Passa para o fim do tema Família, que agora começa por Rute 1:16.
- **Mateus 28:20** começa no meio da frase. No tema Solidão, dá lugar a Salmos 27:10 ("meu pai e minha mãe me abandonaram, mas o Senhor me recolherá").
- **Efésios 4:2** começa no meio da frase. No tema Família, dá lugar a Salmos 127:1 ("Se o SENHOR não estiver edificando a casa"). Efésios 4:32 já está no tema Perdão, e um versículo não se repete entre temas.

## Revisão geral da curadoria (2026-10-02)

Todos os versículos dos temas e do versículo do dia foram lidos nas duas traduções. O dono aprovou as trocas.

- **Erros na Bíblia Livre:**
  - Dor: sai Salmos 34:18 ("sava os aflitos") e Isaías 43:2 ("nem a chamas arderão"). Entram Salmos 31:7 e 2 Coríntios 1:3 e 1:4. Salmos 147:3 passa a abrir o tema.
  - Família: sai Josué 24:15 ("aos deuses a os quais").
  - Perdão: Isaías 1:18 ("as contas,diz") dá lugar a Miqueias 7:18.
- **Títulos de salmo pesados:**
  - Gratidão: Salmos 9:1 ("em Mute-Laben") dá lugar a Salmos 103:2.
  - Medo: Salmos 46:1 ("Cântico sobre Alamote") dá lugar a Salmos 91:2.
- **Versículos cortados:**
  - Ansiedade: 1 Pedro 5:6 entra antes do 5:7.
  - O amor de Deus: Efésios 2:4 dá lugar a 1 João 3:1. Juntar com o 2:5 não resolvia, porque o 2:5 também termina em vírgula.
  - Fé: Hebreus 6:19 dá lugar a João 20:29.
- **Versículo do dia:** Salmos 46:1, Salmos 119:105 ("[Nun]:") e 1 Pedro 5:7 dão lugar a Salmos 16:8, Salmos 118:24 e Salmos 55:22.
- **Regra nova, com teste:**
  - Nos temas, um versículo que começa no meio da frase só entra logo depois do anterior.
  - Um versículo que termina em vírgula só entra logo antes do seguinte.
  - O versículo do dia precisa ser uma frase inteira.
- **Espaços da Bíblia Livre:**
  - A fonte deixa espaços soltos, como em "criatura [é] ;", "agradar [a Deus] ." e "dá- [la]".
  - A conversão (`npm run bibles`) agora tira o espaço antes da pontuação e depois do hífen.
  - Foram 812 versículos, e um teste confirmou que nenhuma palavra mudou.
  - O cache dos livros passou para `bibles-v2`, para os aparelhos baixarem o texto novo.
- **Dicas:** revisadas, sem mudança.
- **Fica como está:**
  - Na BSB, aspas que abrem num versículo e fecham em outro.
  - Títulos curtos como "Salmo de Davi:" em Salmos 23:1 e 27:1.

## Testes

- **Unitários:**
  - As referências trocadas na curadoria.
  - Os capítulos exatos de cada plano novo e a ordem do grupo.
  - João e Provérbios aparecem nos dois grupos; os outros planos, em um só.
  - A divisão por versículos: dias seguidos, todo capítulo uma vez, nenhum dia vazio, o Salmo 119 sozinho.
  - A contagem de versículos bate com as duas traduções.
  - Os textos novos existem nos dois idiomas.
- **No navegador:** o grupo aparece em segundo lugar, com a frase como título, e começar um plano por ele funciona.
