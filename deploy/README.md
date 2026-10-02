# Publicar o Selah no frodo

Tudo do Selah fica em `/srv/selah`:

```
/srv/selah/
├── docker-compose.yml   (cópia de deploy/docker-compose.yml)
├── .env                 (segredos; nunca no git)
├── backup.sh
├── server/              (código da API, cópia de server/ sem node_modules)
├── app/                 (o app: conteúdo de dist/)
└── backups/             (pg_dump diário)
```

## Primeira vez (no frodo)

1. **Pasta:** `sudo mkdir -p /srv/selah && sudo chown bilbo:bilbo /srv/selah`
2. **Arquivos:** copiar a partir do bilbo com o passo "Atualizar" abaixo.
3. **Segredos:**
   - `cp deploy/.env.example /srv/selah/.env`
   - Preencher o `.env`: a senha com `openssl rand -base64 24 | tr -d '/+='` e as chaves com `npx web-push generate-vapid-keys`.
   - `chmod 600 /srv/selah/.env`
4. **Subir a API e o banco:** `cd /srv/selah && docker compose up -d --build`
5. **nginx:**
   - `sudo cp selah.conf /etc/nginx/sites-available/selah`
   - `sudo ln -s /etc/nginx/sites-available/selah /etc/nginx/sites-enabled/`
   - `sudo nginx -t && sudo systemctl reload nginx`
6. **Cloudflare:** criar o registro `selah` (proxy ligado) apontando para o frodo. O certificado de origem precisa cobrir `*.selatech.com.br`.
7. **Backup:** adicionar `30 3 * * * /srv/selah/backup.sh` com `crontab -e`.

## Atualizar (no bilbo)

```sh
SELAH_DEPLOY_TARGET=bilbo@frodo npm run deploy
```

O script (`scripts/deploy.sh`) roda os testes, gera o `dist/`, copia o app, a API e os arquivos de deploy, e sobe os containers.

## Conferir

- `curl -s https://selah.selatech.com.br/api/health` deve responder `{"ok":true}`.
- Logs: `cd /srv/selah && docker compose logs -f api`.

## Cópia dos backups fora do frodo

O frodo grava um `pg_dump` por dia em `/srv/selah/backups` e guarda 14 dias. O bilbo copia esses arquivos para `/mnt/dados2/selah-backups` e guarda 90 dias.

- **Script:** `deploy/pull-backups.sh`.
- **Agendamento:** um timer do systemd do usuário, em `deploy/systemd/`. Ele roda às 10:00, e se o computador estiver desligado nesse horário, roda quando ligar.
- **Chave:** `~/.ssh/selah_backup`, sem senha.
  - No `~/.ssh/authorized_keys` do frodo, ela fica presa a leitura da pasta de backups:
    `command="/usr/bin/rrsync -ro /srv/selah/backups/",restrict ssh-ed25519 ... selah-backup@bilbo`
  - Ela não abre terminal, não grava e não sai da pasta.

Para instalar em outro computador:

```sh
ssh-keygen -t ed25519 -N "" -C selah-backup@bilbo -f ~/.ssh/selah_backup
# no frodo, acrescentar a linha acima ao ~/.ssh/authorized_keys, com a chave pública nova
cp deploy/systemd/selah-pull-backups.* ~/.config/systemd/user/
systemctl --user daemon-reload && systemctl --user enable --now selah-pull-backups.timer
loginctl enable-linger "$USER"   # para rodar mesmo sem sessão aberta
```

- **Conferir:** `journalctl --user -u selah-pull-backups.service -n 5`.
- **Restaurar um backup:** `zcat selah-AAAA-MM-DD.sql.gz | docker compose exec -T db psql -U selah selah`.
