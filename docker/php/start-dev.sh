#!/bin/sh
set -eu
cd /var/www/html

# Linux-backed dependencies avoid thousands of Windows bind-mount metadata reads
# per HTTP request. Application source and uploads remain in the existing mounts.
# Seed only once; do not overwrite packages installed in this volume later.
if [ ! -f vendor/.epsel-ready ]; then
    if [ -f /opt/host-vendor/autoload.php ]; then
        echo 'Preparing PHP dependencies in the Docker volume (first start only)...'
        cp -a /opt/host-vendor/. vendor/
        composer dump-autoload --optimize --no-interaction --no-scripts
    else
        composer install --prefer-dist --optimize-autoloader --no-interaction --no-scripts
    fi
    touch vendor/.epsel-ready
fi

# After changing composer.lock, update this shared volume with:
# docker compose exec app composer install --prefer-dist --optimize-autoloader
# Restart queue-worker and reverb after updating their PHP dependencies.
exec php-fpm
