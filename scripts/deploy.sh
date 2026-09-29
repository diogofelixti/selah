#!/usr/bin/env bash
# Publica o app e a API no frodo (layout em deploy/README.md). Só rodar quando o dono pedir.
set -euo pipefail

: "${SELAH_DEPLOY_TARGET:?Defina SELAH_DEPLOY_TARGET, por exemplo bilbo@frodo}"

cd "$(dirname "$0")/.."
npm test
npm --prefix server test
npm run build
rsync -az --delete dist/ "$SELAH_DEPLOY_TARGET:/srv/selah/app/"
rsync -az --delete --exclude node_modules --exclude dist server/ "$SELAH_DEPLOY_TARGET:/srv/selah/server/"
rsync -az deploy/docker-compose.yml deploy/backup.sh deploy/nginx/selah.conf "$SELAH_DEPLOY_TARGET:/srv/selah/"
ssh "$SELAH_DEPLOY_TARGET" 'cd /srv/selah && docker compose up -d --build'
echo "Publicado em https://selah.selatech.com.br"
