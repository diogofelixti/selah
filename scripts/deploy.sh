#!/usr/bin/env bash
set -euo pipefail

: "${SELAH_DEPLOY_TARGET:?Defina SELAH_DEPLOY_TARGET, por exemplo usuario@ip-do-frodo}"

cd "$(dirname "$0")/.."
npm test
npm run build
rsync -az --delete dist/ "$SELAH_DEPLOY_TARGET:/var/www/selah/"
echo "Publicado em https://selah.selatech.com.br"
