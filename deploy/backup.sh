#!/usr/bin/env bash
# Backup diário do banco do Selah. Mantém os 14 mais recentes.
# cron (crontab do usuário bilbo): 30 3 * * * /srv/selah/backup.sh
set -euo pipefail
# Os dumps têm as chaves das inscrições de push: só o dono lê.
umask 077
DIR=/srv/selah/backups
mkdir -p "$DIR"
cd /srv/selah
TMP="$DIR/.selah-$(date +%F).sql.gz.tmp"
# Com pipefail, se o pg_dump falhar o script para aqui e nenhum backup bom é apagado.
docker compose exec -T db pg_dump -U selah selah | gzip > "$TMP"
mv "$TMP" "$DIR/selah-$(date +%F).sql.gz"
ls -1t "$DIR"/selah-*.sql.gz | tail -n +15 | xargs -r rm --
