# Prompt: página do Selah no site selatech.com.br

Copie o bloco abaixo e use no projeto do site selatech.com.br no Claude Code.

---

Quero uma nova aba/página no site selatech.com.br apresentando o **Selah**, um app gratuito de leitura bíblica feito pela Selatech. A página deve explicar o que é, como usar e ter o link para o app.

**Antes de começar:**
- Leia a estrutura do site: stack, rotas, menu, componentes, estilos e idioma dos textos. Siga os mesmos padrões.
- Não publique nada sem eu aprovar. Primeiro me mostre a página rodando localmente, com prints no celular e no computador.

**Onde:**
- Um item "Selah" no menu principal.
- Uma rota própria, por exemplo `/selah`, seguindo o padrão de rotas do site.
- Layout responsivo, bom no celular (a maioria vai chegar pelo celular).

**Regras de texto:**
- Português do Brasil, tom acolhedor e simples.
- **Não usar travessão (—) nem meia-risca (–) em nenhum texto.** Use vírgula, dois-pontos, ponto ou parênteses.

**Link do app:** https://selah.selatech.com.br (abrir na mesma aba ou em nova aba, conforme o padrão do site para links de produtos).

**Imagens** (estão em `/home/bilbo/app-leitura-biblica`; copie para a pasta de imagens do site e otimize, por exemplo WebP com largura máxima de 780px):
- Logo: `design/logo/logo.png` (1254×1254, fundo marrom dourado #815b1b, lamparina com um livro aberto em luz).
- Prints do app no celular (390×844 em 3x):
  - `docs/divulgacao/selah-inicio.png`: tela inicial com o progresso;
  - `docs/divulgacao/selah-leitor.png`: leitor, no Salmo 23;
  - `docs/divulgacao/selah-planos.png`: planos de leitura;
  - `docs/divulgacao/selah-temas.png`: versículos por tema;
  - `docs/divulgacao/selah-controle.png`: controle de leitura.
- Mostre os prints dentro de uma moldura de celular simples, ou só com cantos arredondados e sombra leve. Escreva textos alternativos descritivos.

**Conteúdo da página (pode reescrever para ficar no tom do site, sem inventar funções que não estão aqui):**

1. **Topo**
   - Título: "Selah · Leitura bíblica".
   - Subtítulo: "Leia a Bíblia com calma e acompanhe o que você já leu."
   - Botão principal "Abrir o Selah", com o link do app.
   - Uma frase curta: "Gratuito, sem anúncios, em português e inglês."
   - Explique em uma linha o nome: Selah é uma palavra que aparece nos Salmos, um convite à pausa e à meditação.

2. **O que o Selah faz** (cartões ou lista com ícones)
   - Bíblia completa em português (Bíblia Livre) e em inglês (Berean Standard Bible).
   - Funciona sem internet depois de instalado.
   - Progresso da leitura por livro, por testamento e da Bíblia toda, com os dias da semana em que você leu.
   - Controle de leitura: marque capítulos lidos, até os que você leu em outra Bíblia.
   - 19 planos de leitura, entre eles:
     - Evangelhos em 30 dias;
     - Novo Testamento em 90 dias;
     - Bíblia em 1 ano;
     - Bíblia em 2 anos;
     - Salmos, Provérbios e cartas de Paulo;
     - a história de personagens da Bíblia (Abraão, José, Moisés, Rute, Samuel, Davi, Elias, Ester, Daniel e Paulo).
   - Versículos por tema, para momentos da vida: ansiedade, dor, saudade e luto, medo, amor, o amor de Deus, esperança, gratidão, perdão, força, paz, fé, solidão, família, sabedoria para decidir e cansaço.
   - Versículo do dia e dicas de leitura.
   - Destaques coloridos e anotações nos versículos.
   - Busca por palavras em toda a Bíblia.
   - Leitura em voz alta.
   - Compartilhar versículos como texto ou como imagem bonita, no estilo do app.
   - Temas visuais: claro, escuro e dois ilustrados (Pergaminho e Oliveira).
   - Lembrete diário por notificação, na hora que você escolher. Ele não chega nos dias em que você já leu.
   - Conta Google opcional, para ter o mesmo progresso no celular, no tablet e no computador.

3. **Como começar** (passos numerados)
   1. Abra https://selah.selatech.com.br no celular.
   2. Instale o app:
      - no Android (Chrome), vá em Ajustes > "Instalar o app", ou no menu ⋮ > "Instalar app";
      - no iPhone (Safari), toque em Compartilhar > "Adicionar à Tela de Início".
   3. Toque em "Começar a ler" ou escolha um plano na aba Planos.
   4. Opcional: em Ajustes, ligue o lembrete diário e entre com sua conta Google para sincronizar entre aparelhos.
   - Dica para celulares Xiaomi, Redmi ou Poco: se o ícone não aparecer, libere a permissão "Atalhos na tela inicial" do Chrome (Configurações > Apps > Gerenciar apps > Chrome > Outras permissões).

4. **Privacidade** (curto e claro)
   - Sem conta, tudo fica só no seu aparelho.
   - Com a conta Google, o servidor guarda seu e-mail e sua leitura (capítulos lidos, planos, destaques e notas), só para levar aos seus outros aparelhos. Não guarda nome, foto nem senha, e você pode excluir a conta quando quiser.
   - O lembrete guarda só o endereço de notificação do aparelho, a hora e o fuso.

5. **Apoie o Selah**
   - "O Selah é gratuito e sem anúncios. Se ele ajuda você, considere apoiar com uma doação via Pix."
   - Chave Pix (CNPJ): 41.123.299/0001-59.
   - Contato pelo WhatsApp (51) 99640-9363: https://wa.me/5551996409363

6. **Rodapé da seção:** repita o botão "Abrir o Selah".

**SEO e compartilhamento:**
- `<title>`: "Selah · Leitura bíblica | Selatech".
- Meta description: "App gratuito para ler a Bíblia com calma e acompanhar seu progresso. Planos de leitura, versículos por tema, lembrete diário e funciona sem internet."
- Open Graph e Twitter Card com o logo, o título e a descrição.

**Qualidade:**
- Contraste acessível (WCAG AA) e botões com pelo menos 44px de altura.
- Imagens com `loading="lazy"` (menos a do topo).
- Teste em 360px, 768px e 1280px de largura.
