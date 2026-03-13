#!/usr/bin/env bash
PANEL_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PANEL_DIR"

echo "=== Starting Pterodactyl Panel ==="
php artisan serve --host=0.0.0.0 --port=8000 &
PHP_PID=$!

echo "Waiting for PHP server to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/ -o /dev/null 2>/dev/null; then
    echo "PHP server is up!"
    break
  fi
  sleep 1
done

echo "Starting Node.js proxy on port 19519..."
node "$PANEL_DIR/../artifacts/pterodactyl/proxy.mjs" &
PROXY_PID=$!

echo "Panel running — PHP PID=$PHP_PID, Proxy PID=$PROXY_PID"
wait $PHP_PID
