#!/bin/sh
# Backup diário do banco do Selah. Mantém os 14 mais recentes.
# cron (crontab do usuário bilbo): 30 3 * * * /srv/selah/backup.sh
set -eu
DIR=/srv/selah/backups
mkdir -p "$DIR"
cd /srv/selah
docker compose exec -T db pg_dump -U selah selah | gzip > "$DIR/selah-$(date +%F).sql.gz"
ls -1t "$DIR"/selah-*.sql.gz | tail -n +15 | xargs -r rm --
