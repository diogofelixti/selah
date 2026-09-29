# Selah v8: servidor no frodo e lembrete diário

Complemento das specs anteriores. Data: 2026-09-29. Parte da proposta `2026-09-29-selah-servidor-proposta.md`, já com as decisões do dono.

## Decisões do dono (2026-09-29)

1. **Banco:** Postgres, num container exclusivo do Selah.
2. **Conta:** login com a conta Google. A pessoa não cria senha e o Selah não guarda senha. Fica para a v9, junto com a sincronização.
3. **Lembrete:** não é enviado no dia em que a pessoa já leu.
4. **Firewall:** o frodo tem firewall na frente. O Postgres de outro projeto exposto não é problema.

## Fases

- **v8 (esta spec):**
  - A infraestrutura do servidor: API, Postgres, deploy e nginx.
  - O lembrete diário por Web Push.
- **v9 (spec própria, depois):**
  - Login com Google e sincronização entre aparelhos, no mesmo servidor.
  - Precisa de um "ID do cliente OAuth" criado pelo dono no Google Cloud Console.

## Infraestrutura

### Frodo, seguindo o padrão dos outros sites

- **nginx:**
  - Um arquivo de site novo, `selah`, para `selah.selatech.com.br`.
  - Certificado de origem da Cloudflare em `/etc/ssl/cloudflare/`.
  - Falta confirmar se o certificado atual cobre `*.selatech.com.br`. Se não cobrir, o dono gera outro no painel da Cloudflare.
- **Arquivos do app:** ficam em `/srv/selah/app` (o conteúdo de `dist/`).
- **Rotas:** `/api/` vai para `http://127.0.0.1:8787`.
- **Docker compose, em `/srv/selah/`:**
  - `api` escuta só em `127.0.0.1:8787`.
  - `db` usa `postgres:16-alpine` sem porta publicada, com o volume `selah-db`.
- **`.env` no frodo (nunca no git):**
  - A senha do banco.
  - As chaves VAPID do Web Push.
  - O e-mail de contato do VAPID.
- **Backup:** um cron diário roda `pg_dump` para `/srv/selah/backups` e mantém os 14 últimos.

### Código

- **Pasta `server/`** no repositório, com `package.json` próprio:
  - Node 20, Hono, `postgres` (driver) e `web-push`.
  - TypeScript compilado para `dist/`.
- **Migrações:** arquivos SQL em `server/migrations/`, aplicados na partida da API (tabela `migrations`).
- **Arquivos de deploy em `deploy/`:**
  - `docker-compose.yml`.
  - `nginx/selah.conf`.
  - `.env.example`.
  - `README.md` com os passos no frodo.
- **Testes do servidor:** Vitest contra um Postgres de verdade, num container Docker iniciado pelos testes.
- **Desenvolvimento local:**
  - O Vite (dev e preview) repassa `/api` para `localhost:8787`.
  - `npm run server:up` sobe o banco e a API (e `server:down` derruba).

## Lembrete diário

### Na tela (Ajustes > Lembrete diário)

- **Controles:**
  - Um interruptor.
  - A hora (padrão 07:00, em intervalos de 5 minutos).
- **Ao ligar:**
  1. O app pede permissão de notificação.
  2. Cria a inscrição de push.
  3. Envia ao servidor.
- **Situações com texto próprio:**
  - Navegador sem suporte a notificações.
  - iPhone com o app aberto no navegador. A orientação é adicionar à tela de início e abrir por lá (iOS 16.4 ou mais novo).
  - Permissão negada. A orientação é liberar nas configurações do navegador.
  - Sem internet ou servidor fora do ar. A mensagem diz "Não foi possível ativar agora. Tente de novo." e o interruptor volta a desligado.
- **Onde fica a escolha:** em `settings.reminder = { enabled, time }`.
  - O backup guarda a escolha.
  - Ao importar, o app não inscreve sozinho, porque precisa da permissão.
  - Backup sem esse campo recebe o padrão (desligado).
- **Mudanças:** mudar a hora reenvia a inscrição. Desligar apaga no servidor e cancela a inscrição.
- **Fuso horário:** o do aparelho (`Intl.DateTimeFormat().resolvedOptions().timeZone`). Se mudar, vai junto na próxima vez que o app abrir.

### No servidor

- **Tabela `reminders`:**

| Coluna | Tipo e regra |
|---|---|
| `endpoint` | texto, único |
| `p256dh` | texto |
| `auth` | texto |
| `minutes` | inteiro, de 0 a 1439 |
| `tz` | texto |
| `lang` | `pt` ou `en` |
| `last_sent_on` | data |
| `done_on` | data |
| `created_at` | data e hora |
| `updated_at` | data e hora |

- **Rotas:**
  - `GET /api/push/key`: devolve a chave pública VAPID.
  - `PUT /api/reminders`: recebe `{ subscription, time: "HH:MM", tz, lang }` e grava (upsert pelo `endpoint`).
  - `DELETE /api/reminders`: recebe `{ endpoint }`.
  - `POST /api/reminders/done`: recebe `{ endpoint, date: "AAAA-MM-DD" }` e marca "já leu hoje".
  - O `endpoint` da inscrição identifica o aparelho. Só o navegador dele conhece esse endereço.
- **Validação:**
  - O `endpoint` precisa ser https e de um serviço de push conhecido: `fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.push.apple.com` ou `*.notify.windows.com`. Assim, o servidor não vira ferramenta para chamar endereços quaisquer.
  - O `tz` precisa ser um fuso válido.
  - A hora tem o formato `HH:MM`.
  - A data de `done` fica a no máximo 1 dia de "hoje" no fuso do registro.
  - Corpo de no máximo 4 KB.
  - Limite de 30 pedidos por minuto por IP. O IP vem de `CF-Connecting-IP`, repassado pelo nginx.
- **Agendador (a cada minuto):**
  - Envia para quem, no próprio fuso:
    - está entre a hora escolhida e 30 minutos depois (tolerância para reinícios);
    - ainda não recebeu hoje (`last_sent_on`);
    - ainda não leu hoje (`done_on`).
  - A mensagem de push é mínima: `{ "type": "reminder" }`.
  - Resposta 404 ou 410 do serviço de push apaga o registro.
  - Outras falhas ficam para o minuto seguinte, dentro da janela de 30 minutos.
- **"Já leu hoje":**
  - Ao marcar um capítulo como lido, o app envia `done` com a data local, uma vez por dia e só com o lembrete ligado.
  - O servidor não recebe qual capítulo.

### No aparelho (service worker)

- O service worker passa a ser um arquivo do app (`src/sw.ts`, estratégia `injectManifest`), com o mesmo comportamento de hoje:
  - pré-cache;
  - Bíblias em cache;
  - navegação offline;
  - atualização só quando a pessoa aceita.
- **Ao receber o push,** o service worker lê o IndexedDB e monta o texto no idioma da pessoa:
  - com plano ativo: "Hoje: Mateus 1 a 3" (os capítulos de hoje do plano);
  - sem plano, com última posição: "Continue em João 3";
  - sem nada: "Um momento com a Palavra hoje."
- **Título:** "Hora da leitura", com o ícone do app.
- **Tocar na notificação** foca o app aberto ou abre um novo:
  - na tela de Planos, se há plano ativo;
  - senão, no último capítulo lido.

## Privacidade

- O servidor guarda só a inscrição de push, a hora, o fuso, o idioma e datas.
- Não guarda nome, e-mail nem o que a pessoa lê.
- A página Sobre ganha um parágrafo explicando isso.

## Testes

- **Servidor:**
  - Validação de cada rota.
  - Upsert.
  - Agendador com relógio falso: fusos diferentes, janela de 30 minutos, `done_on` e `last_sent_on`.
  - Limpeza em 410.
  - Limite por IP.
- **App (unitário):**
  - Texto da notificação (plano, última posição, nada; pt e en).
  - Validação e migração dos ajustes (`reminder`).
  - Envio de `done` só uma vez por dia.
- **No navegador,** com `PushManager` e `/api` simulados:
  - Ligar, mudar a hora e desligar.
  - Permissão negada.
  - Falha do servidor.
  - iPhone fora da tela de início.
  - O modo offline continua funcionando com o novo service worker (os testes atuais).
