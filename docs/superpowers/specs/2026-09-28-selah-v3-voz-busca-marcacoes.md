# Selah v3: voz alta, busca e marcações

Complemento das specs anteriores (`2026-09-27-selah-design.md`, v2 e v2.1). Data: 2026-09-28.

**Estado:** a ordem (voz alta, busca, marcações) foi aprovada pelo dono do projeto, que delegou os detalhes. As decisões abaixo foram tomadas na implementação e estão marcadas para revisão.

---

## 1. Leitura em voz alta

**Objetivo:** ouvir o capítulo com a voz do próprio aparelho, sem internet e sem custo.

**No leitor:**
- A barra do topo ganha o botão **Ouvir capítulo** (ícone de fone). Ele só aparece se o navegador tiver síntese de voz (`speechSynthesis`).
- Tocar começa a ler do primeiro versículo. Se houver versículos selecionados, começa pelo menor deles.
- Enquanto lê, uma barra no rodapé mostra "Lendo versículo N" e três controles:
  - **Pausar / Continuar.**
  - **Velocidade:** alterna 0,8×, 1× e 1,25×.
  - **Parar.**
- O versículo lido fica destacado e a tela rola até ele.
- No fim do capítulo a leitura para. A barra some, e o botão "Próximo capítulo" continua onde sempre esteve.
- Trocar de capítulo, sair do leitor ou trocar o idioma para a leitura.
- Enquanto há versículos selecionados, a barra de cópia tem prioridade e a barra de voz fica escondida. A leitura continua.

**Detalhes:**
- **Uma fala por versículo.** Isso permite destacar o versículo atual e retomar do ponto certo, e evita o corte que o Chrome faz em falas longas.
- **Pausar cancela a fala e guarda o versículo atual**, e continuar recomeça desse versículo. O `pause()` nativo não é confiável no Android.
- **O que é falado:** o texto sem colchetes e sem o número do versículo.
- **Voz:** a do idioma da tradução, `pt-BR` para BLIVRE e `en-US` para BSB. Prefere uma voz com o código exato do idioma e aceita qualquer voz do mesmo idioma. Sem voz do idioma, deixa o aparelho escolher.
- **Velocidade:** vale só para a sessão, sem gravar nos ajustes. Isso evita mudar o formato do backup.
- **Código:** a lógica fica em `src/lib/speech.ts`, com um controlador testável (`createChapterSpeaker`) que recebe um "motor" de fala. No navegador o motor usa `speechSynthesis`; nos testes, um motor falso.

## 2. Busca por palavra

**Objetivo:** achar versículos pelo texto, offline.

**Onde:**
- No topo da aba **Ler**, um campo "Buscar na Bíblia" leva à tela de busca (`#/busca`, ou `#/busca/<termo>` para abrir já com o termo).

**Como funciona:**
- A busca é feita na tradução do idioma ativo.
- **Todas as palavras** digitadas precisam aparecer no versículo, em qualquer ordem.
- Maiúsculas e acentos são ignorados: "misericordia" acha "misericórdia".
- Colchetes de palavras implícitas são ignorados.
- Cada palavra precisa ter pelo menos 2 letras. Com menos, aparece a dica "Digite pelo menos 2 letras".
- **Filtro:** Toda a Bíblia, Antigo Testamento ou Novo Testamento.
- **Resultados:** em ordem canônica, até 200 na tela, com "Mostrando 200 de N resultados" quando passa disso. Cada resultado mostra a referência e o texto, com as palavras encontradas destacadas.
- Tocar num resultado abre o leitor no versículo, com o destaque de versículo aberto por link.
- **Primeira busca:** o app carrega os 66 livros (do cache, quando o download offline terminou) e mostra "Preparando a busca: N de 66 livros". O índice fica na memória enquanto o app está aberto.
- **Sem internet e livros fora do cache:** a busca mostra os resultados dos livros disponíveis e avisa "Alguns livros não estão disponíveis offline", com "Tentar de novo".

**Código:**
- `src/lib/search.ts` com funções puras: `normalize`, `buildIndex`, `searchVerses` e `highlightParts`, testadas com Vitest.
- A digitação espera 250 ms antes de buscar.

## 3. Destaques e anotações

**Objetivo:** marcar versículos com cor e escrever notas curtas, guardados no aparelho e incluídos no backup.

**No leitor:**
- A barra de cópia (que aparece com versículos selecionados) ganha dois botões:
  - **Destacar:** abre três cores (dourado, verde e azul) e a opção **Tirar destaque**. A cor vale para todos os versículos selecionados.
  - **Anotar:** só aparece com exatamente um versículo selecionado. Abre uma janela com um campo de texto (até 1.000 caracteres), **Salvar**, **Apagar nota** (quando já existe) e **Cancelar**.
- Versículo destacado ganha fundo na cor escolhida, com tons que respeitam o contraste de cada tema.
- Versículo com nota ganha um ícone pequeno de nota logo depois do texto. Tocar no ícone abre a nota.

**Minhas marcações:**
- Uma nova tela, `#/marcacoes`, com entrada na aba **Ler** (ao lado da busca) e nos **Ajustes**.
- Lista todos os versículos marcados em ordem canônica, com a cor, a referência, o texto do versículo e a nota.
- **Filtros:** Todos, Com nota, e cada cor.
- Tocar abre o leitor no versículo.
- Sem marcações, a tela explica como marcar.

**Dados:**
- Novo store no IndexedDB, `marks` (banco na versão 2, com migração que mantém os dados existentes).
- Registro por versículo: `{ ref: "JHN.3.16", color: "gold" | "green" | "blue" | null, note: string, updatedAt }`.
- Um registro sem cor e sem nota é apagado.
- **Backup versão 2:** inclui `marks`. Continua aceitando backups da versão 1, que entram sem marcações. Uma marcação inválida (referência inexistente, cor desconhecida, nota com mais de 1.000 caracteres) recusa o arquivo inteiro, como já acontece com as leituras.
- "Apagar dados" também apaga as marcações.

## 4. Testes

- **Unitários:**
  - Controlador de voz: sequência, pausa e retomada, velocidade, parada, fim do capítulo.
  - Busca: normalização, todas as palavras, filtro de testamento, limite, destaque.
  - Repositório de marcações nos dois repositórios (memória e IndexedDB), incluindo a migração do banco da versão 1.
  - Backup versões 1 e 2.
- **No navegador:**
  - Voz com um `speechSynthesis` falso.
  - Busca por termo com e sem acento, e abertura do leitor no versículo.
  - Destacar, anotar, editar, apagar e a tela Minhas marcações.
  - Backup de ida e volta com marcações.
