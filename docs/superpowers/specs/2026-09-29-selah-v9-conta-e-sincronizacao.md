# Selah v9: conta Google e sincronização entre aparelhos

Complemento das specs anteriores. Data: 2026-09-29.

**Estado:** o dono decidiu usar login com Google (sem senha), num Postgres exclusivo, e mandou seguir. Os detalhes abaixo foram decididos pelo implementador e estão marcados para revisão.

## Objetivo

Quem quiser entra com a conta Google. Leituras, planos, destaques e notas passam a ser os mesmos no celular, no tablet e no computador. Quem não entra continua usando o app como hoje, só no aparelho.

## O que sincroniza

| Dado | Sincroniza? | Regra quando dois aparelhos mudam |
|---|---|---|
| Leituras (capítulo e data) | sim | Marcar soma. Desmarcar grava "desmarcado em T", que apaga as leituras do capítulo feitas antes de T em todos os aparelhos. |
| Destaques e notas | sim | Vale a versão com `updatedAt` mais recente, inclusive a remoção (fica uma marca vazia com data). |
| Plano ativo | sim | Vale a mudança mais recente. |
| Última posição de leitura | sim | Vale a mudança mais recente. |
| Ajustes (idioma, tema, letra, lembrete) | não | Cada aparelho mantém os seus. É comum querer letra maior no celular, e o lembrete depende da permissão de cada aparelho. |

**Como juntar:** a junção é uma função pura (`mergeSync`), a mesma no app e no servidor. Ela é comutativa e idempotente: juntar A com B dá o mesmo que B com A, e juntar duas vezes não muda nada.

## Como funciona

- **Documento de sincronização:** cada aparelho monta, a partir dos dados locais, um "documento de sincronização" com:
  - as leituras;
  - as datas de "desmarcado";
  - as marcas, inclusive as removidas;
  - o plano ativo e a última posição, cada um com a data da mudança.
- **Troca:** o app envia o documento inteiro para `POST /api/sync`. O servidor junta com o que tem, grava e devolve o documento juntado.
  - O tamanho é pequeno: um ano de leitura dá dezenas de KB.
  - O app aplica o resultado juntado mais uma vez com o que mudou no aparelho durante o pedido, e grava tudo de uma vez.
- **Quando sincroniza:**
  - ao abrir o app;
  - 3 segundos depois de cada mudança;
  - ao voltar ao app;
  - quando a internet volta.
- **Sem internet:** tudo continua funcionando no aparelho e sincroniza depois.

## Conta

- **Entrar:**
  - O botão "Entrar com Google" usa o Google Identity Services, o botão oficial.
  - O Google entrega ao app um token de identidade (JWT), que o app envia para `POST /api/auth/google`.
  - O servidor confere o token com a biblioteca oficial (`google-auth-library`): audiência igual ao client ID, emissor Google e e-mail verificado.
  - Depois cria uma sessão e devolve um token aleatório de 32 bytes.
- **Sessão:**
  - O servidor guarda só o hash (SHA-256) do token.
  - O token expira depois de 180 dias sem uso.
  - O app guarda o token no `localStorage` e o envia como `Authorization: Bearer`.
- **Client ID:**
  - Fica no `.env` do servidor (`GOOGLE_CLIENT_ID`) e o app o busca em `GET /api/auth/config`.
  - Sem client ID configurado, a área de conta mostra "Em breve" e o resto do app segue normal.
- **Na tela (Ajustes > Conta e sincronização):**
  - **Sem conta:**
    - a explicação;
    - o botão do Google;
    - a frase "Seus dados continuam neste aparelho. Entrar só acrescenta uma cópia na sua conta."
  - **Com conta:**
    - o e-mail;
    - "Sincronizado agora" ou "Sincronizado há N min" / "Ainda não sincronizado";
    - os botões "Sincronizar agora", "Sair" e "Excluir conta".
- **Sair:**
  - Apaga a sessão no servidor e o token no aparelho.
  - Os dados continuam no aparelho.
- **Excluir conta:**
  - Pede confirmação dupla.
  - Apaga no servidor o usuário, as sessões e todos os dados sincronizados.
  - Os dados continuam no aparelho.
- **Apagar dados** (já existe), com conta:
  - Primeiro sai da conta. Sem isso, a próxima sincronização traria tudo de volta.
  - O texto de confirmação avisa que a cópia na conta continua.
- **Importar backup** com conta: os dados importados se juntam aos da conta na próxima sincronização.

## Servidor

- **Tabelas novas:**
  - `users`: `id`, `google_sub` (único), `email`, `created_at`, `last_seen_at`.
  - `sessions`: `token_hash`, `user_id`, `created_at`, `last_used_at`.
  - `sync_docs`: `user_id`, `doc jsonb`, `updated_at`. Um documento por usuário, juntado com `mergeSync` dentro de uma transação com `select ... for update`.
- **Rotas:**
  - `GET /api/auth/config`
  - `POST /api/auth/google`
  - `POST /api/auth/logout`
  - `GET /api/account` (e-mail)
  - `DELETE /api/account`
  - `POST /api/sync`
- **Validação do documento:**
  - Referências no formato `LIVRO.cap` ou `LIVRO.cap.vers`.
  - Até 50 mil leituras e 10 mil marcas.
  - Nota com até 1000 caracteres.
  - Datas entre 2020 e agora mais 1 dia.
  - Corpo de até 2 MB, que é um limite próprio desta rota.
- **Limite de uso:** o limite por IP continua. A sincronização também tem limite por usuário: 60 por minuto.

## Privacidade (texto no Sobre)

- **Com conta, o servidor guarda:**
  - o e-mail e o identificador da conta Google;
  - as leituras, os planos, os destaques e as notas, para levar aos outros aparelhos.
- **O servidor não guarda:** nome, foto nem senha.
- **Excluir conta** apaga tudo isso.

## Testes

- **`mergeSync` (unitário):**
  - comutativa, idempotente e associativa em exemplos;
  - desmarcar vence leitura antiga e perde para leitura nova;
  - remoção de marca;
  - plano e posição mais recentes.
- **Servidor:**
  - login com verificador falso (token válido, audiência errada, e-mail não verificado);
  - sessão (válida, expirada, depois de sair);
  - sincronização (juntar, dois aparelhos, validação, tamanho);
  - excluir conta.
- **App:**
  - montar o documento a partir dos dados locais;
  - aplicar o resultado;
  - registrar "desmarcado" e marcas removidas.
- **No navegador, com o script do Google e `/api` simulados:**
  - entrar, sincronizar, sair e excluir conta;
  - "Em breve" sem client ID.
- **Integração com a API real (local):** dois contextos de navegador na mesma conta falsa. O que um marca aparece no outro.
