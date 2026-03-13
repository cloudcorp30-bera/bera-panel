#!/bin/ash
cd /app

## Fix 1: Only create /var/log/panel/ (not /var/log/panel/logs/ as a directory)
## so the symlink can be created at that path
mkdir -p /var/log/supervisord/ /var/log/nginx/ /var/log/php7/ /var/log/panel/

## Create symlink only if it doesn't already exist
if [ ! -e /var/log/panel/logs ]; then
  ln -s /app/storage/logs/ /var/log/panel/logs
fi

chmod 777 /var/log/panel/

## check for .env file and generate app keys if missing
if [ -f /app/var/.env ]; then
  echo "external vars exist."
  rm -rf /app/.env
  ln -s /app/var/.env /app/
else
  echo "external vars don't exist — building .env from container environment."
  rm -rf /app/.env
  mkdir -p /app/var

  ## Generate APP_KEY if not supplied
  if [ -z "$APP_KEY" ]; then
     echo "Generating APP_KEY."
     APP_KEY="base64:$(openssl rand -base64 32)"
     echo "Generated app key: $APP_KEY"
  fi

  ## Write .env from environment variables (Railway sets these as container env vars)
  cat > /app/var/.env <<EOF
APP_NAME=${APP_NAME:-Pterodactyl}
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}
APP_THEME=${APP_THEME:-pterodactyl}

LOG_CHANNEL=${LOG_CHANNEL:-stack}
LOG_LEVEL=${LOG_LEVEL:-error}

DB_CONNECTION=${DB_CONNECTION:-pgsql}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-pterodactyl}
DB_USERNAME=${DB_USERNAME:-pterodactyl}
DB_PASSWORD=${DB_PASSWORD}
DB_SSLMODE=${DB_SSLMODE:-prefer}

CACHE_DRIVER=${CACHE_DRIVER:-file}
SESSION_DRIVER=${SESSION_DRIVER:-file}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-sync}

REDIS_HOST=${REDIS_HOST:-127.0.0.1}
REDIS_PASSWORD=${REDIS_PASSWORD:-null}
REDIS_PORT=${REDIS_PORT:-6379}

MAIL_MAILER=${MAIL_MAILER:-smtp}
MAIL_HOST=${MAIL_HOST:-localhost}
MAIL_PORT=${MAIL_PORT:-1025}
MAIL_USERNAME=${MAIL_USERNAME}
MAIL_PASSWORD=${MAIL_PASSWORD}
MAIL_ENCRYPTION=${MAIL_ENCRYPTION}
MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-no-reply@example.com}
MAIL_FROM_NAME=${APP_NAME:-Pterodactyl}

HASHIDS_SALT=${HASHIDS_SALT}
HASHIDS_LENGTH=${HASHIDS_LENGTH:-8}

RECAPTCHA_ENABLED=${RECAPTCHA_ENABLED:-false}
EOF

  ln -s /app/var/.env /app/
fi

## nginx is pre-configured to listen on ports 80 and 8080 (covers most Railway/Docker scenarios).
## If Railway assigns a different $PORT, it is added as a third listener below.
echo "Railway PORT env var: ${PORT:-not set}"

echo "Checking if https is required."
if [ -f /etc/nginx/http.d/panel.conf ]; then
  echo "Using nginx config already in place."
  if [ "$LE_EMAIL" ]; then
    echo "Checking for cert update"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  else
    echo "No letsencrypt email is set"
  fi
else
  echo "Checking if letsencrypt email is set."
  if [ -z "$LE_EMAIL" ]; then
    echo "No letsencrypt email is set using http config."
    cp .github/docker/default.conf /etc/nginx/http.d/panel.conf
  else
    echo "writing ssl config"
    cp .github/docker/default_ssl.conf /etc/nginx/http.d/panel.conf
    echo "updating ssl config for domain"
    sed -i "s|<domain>|$(echo $APP_URL | sed 's~http[s]*://~~g')|g" /etc/nginx/http.d/panel.conf
    echo "generating certs"
    certbot certonly -d $(echo $APP_URL | sed 's~http[s]*://~~g')  --standalone -m $LE_EMAIL --agree-tos -n
  fi
  echo "Removing the default nginx config"
  rm -rf /etc/nginx/http.d/default.conf
fi

## If Railway assigns a port other than 80 or 8080, add it as an extra listen directive.
if [ -n "$PORT" ] && [ "$PORT" != "80" ] && [ "$PORT" != "8080" ]; then
  echo "Adding extra nginx listener for Railway PORT=$PORT..."
  sed -i "s/listen 8080;/listen 8080; listen $PORT;/g" /etc/nginx/http.d/panel.conf
fi
echo "Nginx listening on: port 80, port 8080${PORT:+, port $PORT}."

if [ -z "$DB_PORT" ]; then
  echo "DB_PORT not specified, defaulting to 5432 (PostgreSQL)"
  DB_PORT=5432
fi

## check for DB up before starting the panel
echo "Checking database status ($DB_HOST:$DB_PORT)..."
until nc -z -v -w30 $DB_HOST $DB_PORT
do
  echo "Waiting for database connection..."
  sleep 1
done

## Run migrations (idempotent — safe to run on every start)
echo "Migrating database..."
php artisan migrate --force

## Fix 2: Seed only if this is a fresh database (nests table is empty).
## The EggSeeder fails with PostgreSQL 25P02 when run against existing data,
## so we skip seeding if the database already has nest records.
echo "Checking if initial seeding is needed..."
NEEDS_SEED=$(php artisan tinker --no-interaction --execute="echo (\App\Models\Nest::count() == 0 ? 'yes' : 'no');" 2>/dev/null | tail -1)
if [ "$NEEDS_SEED" = "yes" ]; then
  echo "Fresh database — running seeders..."
  php artisan db:seed --force || echo "WARNING: Some seeders failed. Panel may start with limited egg configurations."
else
  echo "Database already seeded — skipping."
fi

## Validate PHP-FPM config before handing off to supervisord.
## Any error here is printed to the Railway/Docker log.
echo "Testing PHP-FPM configuration..."
/usr/local/sbin/php-fpm --test 2>&1 && echo "PHP-FPM config OK." || echo "WARNING: PHP-FPM config test FAILED — supervisord will still attempt to start it."

## start cronjobs for the queue
echo "Starting cron jobs."
crond -L /var/log/crond -l 5

echo "Starting supervisord."
exec "$@"
