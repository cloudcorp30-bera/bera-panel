#!/usr/bin/env bash
PANEL_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PANEL_DIR"
echo "=== Starting Pterodactyl Panel ==="
php artisan serve --host=0.0.0.0 --port=8000
