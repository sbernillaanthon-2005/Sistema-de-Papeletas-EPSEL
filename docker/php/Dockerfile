# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — PHP 8.3 FPM para EPSEL Papeletas
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS base

LABEL maintainer="EPSEL Dev Team"

# Instalar dependencias del sistema
# linux-headers es necesario para la extensión sockets (requerida por Laravel Reverb)
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    zip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    postgresql-client \
    postgresql-dev \
    oniguruma-dev \
    libxml2-dev \
    linux-headers \
    shadow \
    supervisor

# Extensiones PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        ctype \
        fileinfo \
        gd \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo \
        pdo_pgsql \
        pgsql \
        xml \
        zip \
        sockets

# Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Crear usuario www con mismo UID que el host (evita problemas de permisos)
RUN groupmod -g 1000 www-data && usermod -u 1000 -g www-data www-data

WORKDIR /var/www/html

# ─────────────────────────────────────────────────────────────────────────────
# Stage de producción (se puede extender)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS production
COPY ./src /var/www/html
RUN composer install --optimize-autoloader --no-dev \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

EXPOSE 9000
CMD ["php-fpm"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage de desarrollo (default en docker-compose)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS development
EXPOSE 9000
CMD ["php-fpm"]
