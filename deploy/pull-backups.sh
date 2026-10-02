#!/usr/bin/env bash
# Copia os backups do Postgres do frodo para este computador e guarda 90 dias.
# Usa uma chave só para isso, presa no frodo a leitura de /srv/selah/backups (ver deploy/README.md).
set -euo pipefail

DEST="${SELAH_BACKUP_DEST:-/mnt/dados2/selah-backups}"
KEY="${SELAH_BACKUP_KEY:-$HOME/.ssh/selah_backup}"
HOST="${SELAH_BACKUP_HOST:-bilbo@207.244.230.11}"

mkdir -p "$DEST"
# -F /dev/null: ignora o ~/.ssh/config, cuja chave do frodo tem senha e travaria sem ninguém para digitar.
rsync -a -e "ssh -F /dev/null -i $KEY -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile=$HOME/.ssh/known_hosts" \
  --include 'selah-*.sql.gz' --exclude '*' "$HOST:/" "$DEST/"
find "$DEST" -name 'selah-*.sql.gz' -mtime +90 -delete
echo "$(date '+%F %T') backups em $DEST: $(find "$DEST" -name 'selah-*.sql.gz' | wc -l) arquivos"
