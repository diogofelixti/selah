# Selah · Leitura bíblica / Bible reading

Especificação do produto e do design técnico. Data: 2026-09-27. Andamento atualizado em 2026-10-02 (ver seção 12).

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

Publicado em 2026-09-29. Passo a passo em `deploy/README.md`.

- **Onde fica:** tudo do Selah fica em `/srv/selah` no frodo:
  - `app/`: o `dist/` estático;
  - `server/` e `docker-compose.yml`: a API e o Postgres exclusivo;
  - `.env`: os segredos, gerados no próprio frodo;
  - `backups/`.
- **nginx:** fica atrás da Cloudflare (proxy ligado) e usa o Origin Certificate curinga `*.selatech.com.br` (`/etc/ssl/cloudflare/`).
  - O site `selah` serve o app e repassa `/api` para a API, que só escuta em `127.0.0.1:8787`.
  - Manda os cabeçalhos de segurança, inclusive a CSP.
  - `/api/health` só responde de dentro do servidor.
- **DNS:** registro `selah` na Cloudflare, com proxy ligado.
- **Cache:** `index.html`, `sw.js` e o manifesto sem cache longo; os arquivos com hash no nome com cache longo e imutável.
- **Publicar:** `SELAH_DEPLOY_TARGET=frodo npm run deploy`. O comando roda os testes, gera o build, copia o app e a API com `rsync` via SSH e sobe os containers.
- **Mudanças no nginx:** exigem sudo do dono.
- **Backup:** `pg_dump` diário às 03:30 em `/srv/selah/backups`, guardando os 14 mais recentes.

## 9. Testes

- **Vitest** para a lógica pura: cálculo de progresso, dia atual do plano, versículo e dica do dia, detecção de idioma, validação da importação, geração dos planos (todos os capítulos aparecem exatamente uma vez no plano de 1 ano).
- **Testes de conteúdo:** paridade de chaves entre `pt.json` e `en.json`; nenhum travessão nos textos do app; toda referência em temas, planos e versículo do dia existe nas duas traduções.
- **Playwright** para os fluxos principais no tamanho de celular: abrir, ler um capítulo, marcar como lido, ver o progresso atualizado, iniciar um plano, trocar o idioma, e recarregar sem rede e continuar lendo.
- **Lighthouse** no build final: PWA instalável, com Performance e Acessibilidade acima de 90.

## 10. Fora do MVP (próximas versões)

Em ordem aproximada de prioridade. Situação em 2026-09-29:

| # | Item | Situação |
|---|---|---|
| 1 | Temas "Noite", "Pergaminho" e "Oliveira" | Feito (Noite depois da v2; Pergaminho e Oliveira na v5) |
| 2 | Destaques de versículos e anotações curtas | Feito (v3) |
| 3 | Compartilhar um versículo como imagem no estilo do tema ativo | Feito (v4) |
| 4 | Leitura em voz alta (Web Speech API) | Feito (v3) |
| 5 | Busca por palavra no texto bíblico | Feito (v3) |
| 6 | Tradução licenciada em português e seletor de versão | **Pendente:** depende da licença, que será pedida com o app pronto |
| 7 | Lembrete diário por notificação | Feito (v8, com servidor no frodo) |
| 8 | Botão de doação | Feito (v7: Pix e WhatsApp) |
| 9 | Sincronização opcional entre aparelhos | Feito (v9: conta Google) |
| 10 | Mais planos e temas | Feito (v6, v7 e v10: 36 planos, 16 temas, personagens da Bíblia, um livro para cada momento) |

## 11. Pendências fora do código

- [ ] **Por último:** enviar o pedido de licença para a Biblica (NVI) ou para a SBB (NAA/ARA). O dono decidiu pedir com o app pronto.
- [x] Criar o registro DNS `selah.selatech.com.br` na Cloudflare, com proxy ligado.
- [x] Criar o ícone e a identidade visual do Selah (logo da lamparina, ícones gerados por `npm run icons`).
- [x] Revisar a curadoria de temas, dicas, versículos do dia e planos. Feito na v10 (2026-10-02); detalhes na spec da v10:
  - [x] Provérbios 3:6 tem erro de concordância na Bíblia Livre ("todas os teus caminhos"). Trocado.
  - [x] Josué 24:15, primeiro versículo de Família, só fala de família na última frase. Foi para o fim.
  - [x] Mateus 28:20 e Efésios 4:2 começam no meio da frase. Trocados.
  - [x] Salmos em 30 dias: o dia 24 inclui o Salmo 119 (176 versículos). Agora divide por versículos.
  - [x] Bíblia em 2 anos faz 2 capítulos por dia até o dia 459 e depois 1 por dia. Agora divide por versículos.
  - [x] Revisar as frases do grupo "Um livro para cada momento". Efésios confirmada; Eclesiastes e 1 Coríntios suavizadas.
  - [x] Revisão geral dos temas, versículos do dia e dicas. Trocas aprovadas pelo dono, e os espaços soltos da Bíblia Livre foram limpos.
- [x] Página sobre o Selah no site selatech.com.br: pronta em https://selatech.com.br/pt/selah (confirmado pelo dono em 2026-10-02). O README aponta para ela.
- [x] Ajustar o README do projeto para uso público (2026-10-02).
- [x] Escolher a licença do código: MIT, decidido pelo dono em 2026-10-02. O arquivo `LICENSE` está em nome da Selatech.
- [ ] Tornar o repositório público (github.com/diogofelixti/selah). **Só com aprovação do dono**, depois de ele validar o README. O dono quer enviar tudo ao GitHub de uma vez, já pronto. O print do celular que entrou por engano (`tests/Screenshot_...jpg`) já saiu do histórico local em 2026-10-02 (`feat/mvp` e a tag `v0.1.0-beta`; backup em bundle antes da limpeza). O envio ao GitHub precisa de push forçado do `feat/mvp` e da tag. Ele vai uma vez só, depois de o dono validar o README.
- [ ] Decidir quando juntar `feat/mvp` no `master` (hoje o GitHub mostra `feat/mvp` como padrão; `master` só tem os documentos iniciais). Pode ser por pull request ou direto.
- [x] Ajuste visual: no leitor, os botões "Capítulo anterior" e "Próximo capítulo" quebravam em duas linhas em telas de 390px. Agora mostram "Anterior" e "Próximo"; o nome completo continua para leitores de tela (2026-10-02).
- [ ] **Por último:** rodar o Lighthouse no site publicado (critério da seção 9: PWA instalável, Performance e Acessibilidade acima de 90). No build local, sem gzip, em 2026-10-02: Performance 96, Acessibilidade 100, Boas práticas 100 e SEO 100.
- [ ] Guardar uma cópia dos backups fora do frodo. Hoje eles ficam só no próprio servidor. Falta decidir o destino: cópia diária para o bilbo ou um armazenamento como o Cloudflare R2.
- [ ] **Por último:** publicar a v10, a revisão da curadoria, os botões do leitor, o `robots.txt` e o README. Os dois primeiros já estão commitados (`fe8ca84` e `bfe7d2a`). Os outros três estão prontos, mas ainda sem commit. A publicação de 2026-10-02 falhou porque a chave SSH do frodo (`~/.ssh/contabo_bilbo`) tem senha e não estava no agente. Antes de publicar, rodar `ssh-add ~/.ssh/contabo_bilbo`.
- [x] Versículo do dia sem esperar o livro (2026-10-02): o texto dos 40 versículos vem embutido no app (`src/content/daily-verse-texts.json`, gerado por `npm run daily-texts`). No Lighthouse local, a Performance foi de 90 para 96.

## 12. Andamento

**Situação em 2026-09-29:**
- Publicado em https://selah.selatech.com.br, versão beta `v0.1.0-beta`.
- Código privado em github.com/diogofelixti/selah.
- Todos os critérios de sucesso do MVP (seção 1) estão atendidos no app publicado.
- O dono confirmou a instalação no celular (Android, Xiaomi com Chrome).

| Versão | O que entrou | Spec |
|---|---|---|
| MVP | Leitor, progresso por livro e testamento, planos, temas de versículos, dicas, pt/en, offline, backup em arquivo | `2026-09-27-selah-design.md` |
| v2 | Visual novo (estrutura B), aba Controle de leitura, planos com marcação | `2026-09-28-selah-v2-visual-controle-design.md` |
| v2.1 | Fontes Lora e Source Sans 3, cópia de versículos | `2026-09-28-selah-v2-1-fonte-e-copia.md` |
| Tema Noite | Tema escuro, com opção automática que segue o aparelho | (sem spec própria) |
| v3 | Leitura em voz alta, busca, destaques e anotações | `2026-09-28-selah-v3-voz-busca-marcacoes.md` |
| v4 | Versículo como imagem | `2026-09-28-selah-v4-imagem.md` |
| v5 | Temas ilustrados Pergaminho e Oliveira | `2026-09-28-selah-v5-temas-ilustrados.md` |
| v6 | Mais planos, em grupos, e 6 temas novos | `2026-09-28-selah-v6-planos-e-temas.md` |
| v7 | Planos de personagens da Bíblia e doação (Pix e WhatsApp) | `2026-09-29-selah-v7-personagens-e-doacao.md` |
| v8 | Servidor no frodo (API e Postgres) e lembrete diário por notificação | `2026-09-29-selah-v8-servidor-e-lembrete.md` |
| v9 | Conta Google e sincronização entre aparelhos | `2026-09-29-selah-v9-conta-e-sincronizacao.md` |
| Publicação | CSP no nginx, logo como ícone, cartão Instalar o app | (seção 8) |
| v10 | Grupo de planos Um livro para cada momento, planos divididos por versículos e revisão da curadoria | `2026-10-02-selah-v10-livros-e-curadoria.md` |

**Como foi feito:** cada versão passou por spec, plano, TDD e revisão independente no fim. Os testes eram 451 unitários do app, 71 do servidor (com Postgres de verdade) e 135 no navegador, incluindo sincronização de ponta a ponta e o nginx de produção.
