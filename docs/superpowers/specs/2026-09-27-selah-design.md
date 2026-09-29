# Selah · Leitura bíblica / Bible reading

Especificação do produto e do design técnico. Data: 2026-09-27.

## 1. Visão

Selah é um app gratuito de leitura bíblica, instalável no celular como PWA, que ajuda a pessoa a ler a Bíblia com constância e a acompanhar o que já leu. A palavra "Selah" aparece nos Salmos como um convite à pausa e à meditação, e essa é a sensação que o app deve passar: calma, clareza e nada de poluição visual.

- **Público:** qualquer pessoa, gratuito, sem anúncios. Doações podem entrar no futuro.
- **Idiomas:** português (Brasil) e inglês.
- **Endereço:** `https://selah.selatech.com.br`
- **Página de apresentação:** no site selatech.com.br, com link para o app. Fora do escopo desta spec.
- **Hospedagem:** servidor "frodo" (Ubuntu, Contabo), que já roda outros serviços.

### Critérios de sucesso do lançamento (MVP)

1. A pessoa instala o app no celular (Android e iOS) e consegue ler a Bíblia inteira sem internet depois da primeira carga completa.
2. Em até 3 toques a partir da tela inicial ela volta para onde parou.
3. Ela vê claramente quanto já leu: por livro, por testamento e da Bíblia toda.
4. O app abre no idioma do aparelho, e ela pode trocar o idioma a qualquer momento.
5. Nenhum texto escrito para o app contém travessão.

## 2. Regras de conteúdo

- **Sem travessão.** Nenhum texto escrito pela equipe (interface, dicas, planos, temas, página "Sobre") pode conter travessão (`—`) nem meia risca (`–`). Uma verificação automática no build falha se encontrar esses caracteres nos arquivos de texto e conteúdo do app.
- **O texto bíblico é mantido fiel à fonte.** A regra do travessão não altera o texto das traduções, porque mudar a pontuação da Escritura muda a tradução publicada. Se a fonte tiver travessões, eles continuam lá.
- **Tom:** acolhedor, simples, sem jargão e sem culpa. Por exemplo: "Que bom te ver de volta" e não "Você perdeu 5 dias".
- **Paridade de idiomas:** todo texto existe em `pt` e `en`. Um teste falha se faltar uma chave em qualquer um dos idiomas.

## 3. Traduções da Bíblia

Uma tradução por idioma no lançamento, todas livres para distribuição:

| Idioma | Tradução | Sigla | Licença |
|---|---|---|---|
| Português | Bíblia Livre | BLIVRE | Creative Commons Atribuição 4.0 Brasil (uso livre com menção de fonte, autores e data da versão) |
| Inglês | Berean Standard Bible | BSB | Domínio público |

**Fontes (confirmadas em 2026-09-27):**

- BLIVRE: `https://ebible.org/Scriptures/porbr2018_vpl.zip` (formato VPL, uma linha por versículo, códigos de livro no padrão BibleWorks).
- BSB: `https://bereanbible.com/bsb.txt` (uma linha por versículo, separada por tabulação).
- As duas têm 66 livros, 1.189 capítulos e o mesmo número de versículos em cada capítulo.
- A BSB deixa 17 versículos vazios (variantes textuais, como Mateus 17:21). O leitor simplesmente pula versículos vazios.
- A BLIVRE marca palavras implícitas entre colchetes, como `[que eu saiba]`. O leitor mostra essas palavras em itálico e sem os colchetes, como fazem as Bíblias impressas. O texto em si não muda.

- A tela "Sobre" mostra a atribuição de cada tradução.
- A tradução acompanha o idioma escolhido: português lê BLIVRE, inglês lê BSB. A estrutura de dados já aceita várias traduções por idioma, mas o seletor de versão não existe no MVP.
- **Em paralelo, fora do código:** pedir licença de uma tradução popular em português (NVI à Biblica, ou NAA/ARA à SBB), explicando que o app é gratuito e sem fins lucrativos. Se a licença sair, a tradução entra como segunda opção no português.

### Formato dos dados

- Os livros são identificados pelos códigos USFM (`GEN`, `EXO`, ..., `REV`). O script de conversão atribui esses códigos pela ordem canônica e confere o número de capítulos de cada livro. São 66 livros e 1.189 capítulos (cânon protestante).
- Um script de build converte o arquivo de origem de cada tradução em um JSON por livro: `bibles/<sigla>/<LIVRO>.json`, no formato `{ "book": "JHN", "chapters": [[ "versículo 1", "versículo 2", ... ], ...] }`.
- Uma referência é sempre escrita como `LIVRO.capítulo` (capítulo) ou `LIVRO.capítulo.versículo` (versículo). Exemplo: `JHN.3.16`.
- Os nomes dos livros em cada idioma ficam nos arquivos de tradução da interface, não no JSON da Bíblia.

## 4. Funcionalidades do MVP

### 4.1 Tela inicial ("Início")

- Saudação curta e o **versículo do dia**, escolhido de forma determinística pela data a partir de uma lista curada de referências. Todos veem o mesmo versículo no mesmo dia.
- Botão **"Continuar leitura"**, que abre o último capítulo aberto.
- **Resumo do progresso:** porcentagem da Bíblia lida e dias com leitura nos últimos 7 dias.
- **Plano ativo** (se houver): a leitura de hoje, com um atalho para ela.
- Um card de **dica** que muda de tempos em tempos (ver 4.6).

### 4.2 Bíblia e progresso ("Bíblia")

- Duas abas: **Antigo Testamento** e **Novo Testamento**, cada uma com a porcentagem lida.
- Lista de livros em ordem canônica, agrupada por seção (Pentateuco, Históricos, Poéticos, Profetas Maiores, Profetas Menores, Evangelhos, Atos, Cartas de Paulo, Cartas Gerais, Apocalipse). Cada livro mostra uma barra fina de progresso.
- Ao tocar em um livro: **grade de capítulos**. Capítulos lidos aparecem preenchidos. Tocar abre o leitor; tocar e segurar marca ou desmarca como lido sem abrir.
- No topo da aba: a porcentagem geral da Bíblia.

### 4.3 Leitor

- Texto com fonte serifada, espaçamento confortável e números de versículo discretos.
- Tamanho da fonte ajustável (4 níveis), com a escolha salva.
- Navegação para o capítulo anterior e o próximo.
- No fim do capítulo, o botão **"Marcar como lido"**. Depois de marcar, ele vira "Lido ✓", que pode ser desfeito, e aparece o atalho "Próximo capítulo".
- A barra superior se esconde ao rolar para baixo e volta ao rolar para cima (modo foco).
- O app guarda a posição (livro e capítulo) para o "Continuar leitura".

### 4.4 Planos de leitura ("Planos")

Planos prontos no MVP:

| Plano | Duração | Conteúdo |
|---|---|---|
| Bíblia em 1 ano | 365 dias | Todos os 1.189 capítulos, em ordem canônica, distribuídos por dia |
| Novo Testamento em 90 dias | 90 dias | 260 capítulos do NT |
| Evangelhos em 30 dias | 30 dias | Mateus, Marcos, Lucas e João (89 capítulos) |
| Salmos e Provérbios em 31 dias | 31 dias | Provérbios 1 a 31, um por dia, mais cerca de 5 salmos por dia |

- Cada plano é uma lista de dias, e cada dia é uma lista de referências de capítulo. Os planos são definidos em código a partir da lista de livros, com os capítulos distribuídos de forma uniforme entre os dias (os primeiros dias recebem um capítulo a mais quando a divisão não é exata).
- Só um plano fica ativo por vez. Iniciar outro pede confirmação.
- **O plano não pune.** O plano mostra "Dia X de Y", sempre com base no próximo dia não concluído, e não na data. Se a pessoa ficar uma semana sem ler, ela continua de onde parou. Uma linha discreta informa quanto tempo falta no ritmo atual.
- Um dia do plano está concluído quando todos os capítulos dele foram marcados como lidos **depois da data de início do plano**. Assim, marcar um capítulo no leitor já conta para o plano, e reler a Bíblia com um plano novo funciona.

### 4.5 Versículos por tema ("Temas")

- Grade de temas com ícone e nome. Temas do MVP: **Ansiedade, Dor e sofrimento, Saudade e luto, Medo, Amor, O amor de Deus, Esperança, Gratidão, Perdão, Força.**
- Cada tema tem uma frase curta de acolhimento, escrita nos dois idiomas, e de 6 a 10 referências de versículos.
- O conteúdo do tema guarda **só as referências**. O texto do versículo vem da tradução do idioma ativo, e isso garante coerência e respeita a licença.
- Tocar em um versículo abre o capítulo no leitor, já rolado até ele e com o versículo destacado por alguns segundos.
- A curadoria dos versículos e das frases é feita durante a implementação e revisada por você antes do lançamento.

### 4.6 Dicas

- De 10 a 15 dicas curtas nos dois idiomas. Exemplos: "Por onde começar? Experimente o Evangelho de João", "Leia devagar, uma leitura curta e atenta vale mais que uma longa e distraída", "O que é Selah?".
- Aparecem no card da tela inicial, em rotação diária determinística.

### 4.7 Ajustes

Acessados por um ícone de engrenagem no topo da tela inicial:

- **Idioma:** Automático (idioma do aparelho), Português ou English.
- **Tema visual:** no MVP só há um, mas o seletor já existe e mostra "Mais temas em breve".
- **Tamanho da fonte** do leitor.
- **Exportar progresso:** baixa um arquivo `.json` com todos os dados locais.
- **Importar progresso:** lê esse arquivo e substitui os dados atuais, depois de confirmar.
- **Apagar dados:** zera tudo, com confirmação dupla.
- **Sobre:** o que é Selah, versão do app, atribuições das traduções e contato da Selatech.

### 4.8 Navegação

Barra inferior com 4 abas: **Início, Bíblia, Planos, Temas**. O leitor abre por cima, em tela cheia, com um botão de voltar.

## 5. Idioma

- Na primeira abertura: se `navigator.language` começa com `pt`, o idioma é português; em qualquer outro caso é inglês.
- A escolha manual nos Ajustes vale mais que a detecção e fica salva.
- Todos os textos ficam em `src/i18n/pt.json` e `src/i18n/en.json`, com as mesmas chaves.
- O atributo `lang` do documento acompanha o idioma ativo.

## 6. Temas visuais

- Todos os estilos usam **variáveis de CSS (design tokens)**: cores de fundo, superfície, texto, texto secundário, destaque, progresso, borda, fontes, raios e sombras.
- Um tema é só um conjunto de valores para esses tokens, aplicado com `data-theme` no `<html>`. Nenhum componente usa cor fixa.
- **MVP:** 1 tema, **"Aurora"**, claro e limpo, com fundo quente off-white, texto quase preto e um único tom de destaque (dourado suave).
- **Depois do MVP**, pelo menos mais 3:
  - **"Noite":** escuro, com contraste confortável para ler à noite.
  - **"Pergaminho":** claro, com textura de papel e ilustrações bíblicas em traço fino nas telas vazias e nos cabeçalhos.
  - **"Oliveira":** escuro ou médio, com ilustrações e paleta verde-oliva.
- Os temas ilustrados usam as ilustrações como decoração (ícones de tema, cabeçalhos, estados vazios), nunca atrás do texto bíblico.
- **Fontes:** serifada para leitura (Literata) e sem serifa para a interface (Inter), ambas hospedadas junto com o app para funcionar offline.
- **Acessibilidade:** contraste mínimo AA em todos os temas, toques de pelo menos 44px e respeito a `prefers-reduced-motion`.

## 7. Arquitetura técnica

### 7.1 Stack

- **Svelte 5 + Vite + TypeScript**, gerando um site estático (SPA). O bundle fica pequeno, carrega rápido em celular fraco e não precisa de servidor de aplicação.
- **vite-plugin-pwa (Workbox)** para service worker e manifesto.
- **IndexedDB** através da biblioteca `idb` para os dados da pessoa.
- **Roteamento por hash** (`#/biblia/JHN/3`), que funciona em qualquer servidor estático e mantém o PWA simples.
- **Sem backend, sem login e sem analytics** no MVP.

### 7.2 Estrutura de pastas (resumo)

```
src/
  lib/
    bible/        carregar livros, metadados dos livros (ordem, seções, nº de capítulos)
    progress/     registrar leituras, calcular porcentagens
    plans/        estado do plano ativo, cálculo do dia atual
    topics/       carregar temas
    daily/        versículo e dica do dia (determinístico pela data)
    i18n/         detecção de idioma e tradução de textos
    storage/      acesso ao IndexedDB, exportar e importar
    theme/        aplicar tema
  routes/         telas: Inicio, Biblia, Livro, Leitor, Planos, Temas, Tema, Ajustes, Sobre
  components/     peças reutilizáveis (barra de progresso, grade de capítulos, card, etc.)
  i18n/           pt.json, en.json
  styles/         tokens.css, themes/aurora.css
content/
  plans/          *.json (gerados por script)
  topics/         *.json (referências e frases em pt/en)
  tips/           tips.json
  daily/          verses.json (lista curada do versículo do dia)
public/bibles/    BLIVRE/*.json, BSB/*.json (gerados por script)
scripts/          conversão das Bíblias, geração dos planos, verificação de travessão
```

Cada módulo em `lib/` tem uma responsabilidade só e expõe funções puras sempre que possível, para ser testado sem interface.

### 7.3 Dados da pessoa (IndexedDB)

| Store | Chave | Conteúdo |
|---|---|---|
| `readings` | auto | `{ ref: "JHN.3", readAt: timestamp }`, um evento por vez que um capítulo é marcado |
| `settings` | nome | `language`, `theme`, `fontSize` |
| `state` | nome | `lastPosition` (`{ book, chapter }`), `activePlan` (`{ id, startedAt }`) |

- **Progresso geral** = capítulos distintos que têm pelo menos um evento de leitura.
- **Desmarcar** um capítulo apaga todos os eventos dele.
- **Progresso do plano** = capítulos com evento de leitura em data igual ou posterior a `activePlan.startedAt`.
- **Dias com leitura** = datas locais distintas com pelo menos um evento.
- **Exportação:** `{ app: "selah", version: 1, exportedAt, readings, settings, state }`. A importação valida `app` e `version` antes de substituir os dados.
- Na primeira abertura, o app pede ao navegador armazenamento persistente (`navigator.storage.persist()`) para reduzir o risco de o sistema apagar os dados.

### 7.4 Offline e cache

- O app (HTML, JS, CSS, fontes, ícones, planos, temas e dicas) entra no precache do service worker.
- Os livros da Bíblia do idioma ativo (cerca de 4 a 5 MB sem compressão por tradução, bem menos com gzip) são baixados **em segundo plano** depois da primeira carga e ficam em cache. Um livro aberto antes do fim do download é buscado na hora e também vai para o cache.
- Ao trocar de idioma, a outra tradução é baixada da mesma forma.
- Nos Ajustes, uma linha mostra "Disponível offline ✓" quando todos os livros do idioma ativo estão em cache.
- Quando sai uma versão nova do app, aparece um aviso discreto: "Nova versão disponível. Atualizar".

### 7.5 Erros

- **Livro não carrega (offline e sem cache):** mensagem amigável no leitor, com o botão "Tentar de novo".
- **IndexedDB indisponível** (navegação privada, por exemplo): o app funciona só com memória e mostra um aviso de que o progresso não será salvo.
- **Arquivo de importação inválido:** mensagem clara, e nada é alterado.
- Nenhum erro some em silêncio. Todo erro de carregamento aparece para a pessoa com uma ação possível.

## 8. Deploy

- O build gera a pasta `dist/` estática.
- No frodo, os arquivos ficam em `/srv/selah/app` (atualizado na v8; ver `deploy/README.md`) e são servidos pelo servidor web que já roda lá (nginx, Caddy ou outro, verificado na tarefa de deploy do plano), com o host `selah.selatech.com.br`.
- HTTPS obrigatório (o PWA exige). O frodo usa nginx atrás da Cloudflare (proxy ligado) com um Origin Certificate curinga `*.selatech.com.br` em `/etc/ssl/cloudflare/`, que já cobre `selah.selatech.com.br`.
- O registro DNS `selah` é criado na Cloudflare com o proxy ligado.
- Cabeçalhos de cache: `index.html` e `sw.js` sem cache longo; arquivos com hash no nome com cache longo e imutável.
- Deploy por um script `scripts/deploy.sh` que roda o build e envia o `dist/` com `rsync` via SSH.

## 9. Testes

- **Vitest** para a lógica pura: cálculo de progresso, dia atual do plano, versículo e dica do dia, detecção de idioma, validação da importação, geração dos planos (todos os capítulos aparecem exatamente uma vez no plano de 1 ano).
- **Testes de conteúdo:** paridade de chaves entre `pt.json` e `en.json`; nenhum travessão nos textos do app; toda referência em temas, planos e versículo do dia existe nas duas traduções.
- **Playwright** para os fluxos principais no tamanho de celular: abrir, ler um capítulo, marcar como lido, ver o progresso atualizado, iniciar um plano, trocar o idioma, e recarregar sem rede e continuar lendo.
- **Lighthouse** no build final: PWA instalável, com Performance e Acessibilidade acima de 90.

## 10. Fora do MVP (próximas versões)

Em ordem aproximada de prioridade:

1. Temas "Noite", "Pergaminho" e "Oliveira"
2. Destaques de versículos e anotações curtas
3. Compartilhar um versículo como imagem no estilo do tema ativo
4. Leitura em voz alta (Web Speech API)
5. Busca por palavra no texto bíblico
6. Tradução licenciada em português (se a licença for aprovada) e seletor de versão
7. Lembrete diário por notificação
8. Botão de doação
9. Sincronização opcional entre aparelhos (exige backend e conta)
10. Mais planos e temas

## 11. Pendências fora do código

- Enviar o pedido de licença para a Biblica (NVI) ou para a SBB (NAA/ARA).
- Criar o registro DNS `selah.selatech.com.br` na Cloudflare, com proxy ligado.
- Criar o ícone e a identidade visual do Selah (ícone do app em 192px, 512px e versão maskable).
- Revisar a curadoria de temas, dicas e versículos do dia antes do lançamento.
