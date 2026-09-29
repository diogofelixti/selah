# Selah: proposta de servidor para sincronização e lembrete diário

Data: 2026-09-29.

**Estado:** proposta para discussão. Nada foi implementado. O dono decide as perguntas do fim antes do plano de implementação.

## Resumo

- **O que roda no frodo:** um único container, `selah-api`, e nenhum container de banco.
  - É uma API pequena em Node 20.
  - Os dados ficam num arquivo SQLite, num volume do container.
  - O próprio container faz as duas coisas: a sincronização e o envio dos lembretes.
- **O app continua funcionando sem internet e sem conta.** O servidor é um extra:
  - guarda uma cópia para outros aparelhos;
  - dispara o lembrete na hora escolhida.

## Por que um container só (sem banco separado)

- **Volume de dados:** por pessoa são algumas centenas de KB no máximo (leituras, marcações, ajustes). Mesmo com dezenas de milhares de pessoas, um arquivo SQLite dá conta, com folga.
- **Menos peças para manter:**
  - Não há senha de banco nem porta de banco.
  - O backup é copiar um arquivo: `sqlite3 selah.db ".backup ..."` num cron diário.
- **Consumo:** cerca de 60 MB de RAM e CPU quase parada.
- **Quando usar Postgres:** se o frodo já tem um Postgres rodando para outras coisas, ou se um dia houver mais de uma instância da API. A troca depois é simples, porque o acesso ao banco fica isolado num módulo.

## Como fica no frodo

```
Cloudflare (proxy) -> frodo :443 (servidor web atual)
                        ├── /          arquivos estáticos do app (dist/)
                        └── /api/*  -> 127.0.0.1:8787 (container selah-api)
```

- **Mesmo endereço:** o app e a API ficam no mesmo endereço (`selah.selatech.com.br/api`). Assim não há CORS e não há cookies.
- **Container:**
  - Porta só em `127.0.0.1`, sem acesso direto de fora.
  - Volume `/srv/selah/data` para o `selah.db`.
  - Variáveis de ambiente para as chaves do Web Push (VAPID).
- **Precisa no frodo:**
  - Docker com compose.
  - Uma regra no servidor web (nginx, Caddy ou Traefik, o que já estiver lá).
  - Um cron de backup.

## 1. Sincronização entre aparelhos

### Identidade: código de sincronização (recomendado)

1. Em Ajustes > Sincronizar, a pessoa toca em "Ativar sincronização".
2. O app cria um código aleatório (16 caracteres, 80 bits, por exemplo `K7QM-2XPA-9RTD-HW4C`) e mostra também um QR code.
3. No outro aparelho, a pessoa digita o código ou escaneia o QR.
4. O servidor guarda só o hash do código. Se o banco vazar, os códigos não vazam.

**Vantagens:**
- Não pede e-mail nem senha.
- Não guarda dado pessoal, o que deixa a LGPD bem mais simples.
- Não precisa de serviço de e-mail.

**Custo:**
- Quem perder o código e todos os aparelhos perde a cópia do servidor. O backup em arquivo continua existindo.

**Alternativa: login por e-mail com link mágico.**
- Permite recuperar o acesso.
- Exige um serviço de envio de e-mail e guarda o e-mail, que é dado pessoal: pede política de privacidade.
- Dá para acrescentar depois sem refazer o resto.

### Como os dados se juntam

- O app continua gravando tudo no aparelho primeiro.
- Cada mudança vira uma operação com id único, que o app envia ao servidor:
  - ao abrir;
  - alguns segundos depois de cada mudança;
  - quando a internet volta.
- Na mesma hora, o app baixa as operações dos outros aparelhos.
- **Regras de junção:**

| Dado | Regra |
|---|---|
| Leituras | Marcar soma. Desmarcar vira uma "remoção com data", que vence as marcações anteriores do mesmo capítulo. |
| Destaques e notas | Vale a versão com `updatedAt` mais recente. |
| Ajustes e plano ativo | Vale a mudança mais recente, campo a campo. |

- **Primeira sincronização:**
  - O app envia tudo o que já tem.
  - Ao entrar num segundo aparelho, as leituras dos dois se somam, sem perder nada.
- **Limites contra abuso:**
  - Tamanho máximo por envio.
  - Limite de pedidos por IP.
  - De tempos em tempos, o servidor compacta as operações de uma conta num retrato único.

## 2. Lembrete diário (Web Push)

- **Ativação:** em Ajustes > Lembrete diário, a pessoa liga o lembrete e escolhe a hora (por exemplo, 07:30).
  - O app pede permissão de notificação e registra o aparelho no servidor.
  - O servidor recebe: a inscrição do navegador, a hora, o fuso horário e o idioma.
- **Não depende da sincronização:** funciona sem código e sem conta.
- **Envio:** a cada minuto, o servidor envia os lembretes que chegaram na hora local de cada pessoa.
- **Aparelhos que desinstalaram:** o navegador responde que a inscrição não existe mais, e o servidor apaga o registro.
- **O texto sai do próprio aparelho:**
  - O service worker lê o plano ativo no IndexedDB e mostra, por exemplo, "Hoje: Mateus 1 a 3".
  - Assim, o servidor não sabe o que a pessoa lê.
- **Tocar na notificação:** abre o app no plano ou no último capítulo.
- **iPhone:** só funciona com o app instalado na tela inicial (iOS 16.4 ou mais novo). O app mostra essa orientação.
- **Limite dos navegadores:** eles exigem que todo push mostre uma notificação. Por isso, não dá para pular o lembrete no aparelho quando a pessoa já leu no dia.
  - **Opção:** o app avisa o servidor "li hoje" (só a data) e o servidor pula o envio daquele dia.

## Código

- **Pasta nova `server/`** no mesmo repositório:
  - Node 20, Hono, better-sqlite3 e web-push.
  - Os tipos são compartilhados com o app.
  - Testes em Vitest.
- **Rotas:**
  - `POST /api/sync/push`
  - `GET /api/sync/pull?since=`
  - `POST /api/reminders`
  - `DELETE /api/reminders/:id`
  - `POST /api/reminders/:id/done`
- **Ordem sugerida:**
  1. Primeiro o lembrete, que é menor e testa toda a estrutura no frodo.
  2. Depois a sincronização.

## Perguntas para o dono

1. **Banco:** SQLite dentro do container (recomendado) ou Postgres (novo container ou um que já exista no frodo)?
2. **Identidade:** código de sincronização (recomendado) ou login por e-mail?
3. **frodo:** qual servidor web está na frente hoje (nginx, Caddy, Traefik)? O Docker com compose já está instalado?
4. **Lembrete:** pular o envio quando a pessoa já leu no dia? Para isso, o app manda só a data da leitura ao servidor.
