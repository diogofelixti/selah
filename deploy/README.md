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
