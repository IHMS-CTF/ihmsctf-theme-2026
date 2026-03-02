#!/bin/bash
set -e

mkdir -p /app/config
chown -R ihms:ihms /app/config
chmod 755 /app/config

cd /app

# Run gunicorn as vanguard user
exec su ihms -c 'gunicorn app:app --bind 0.0.0.0:8000 --workers 4'