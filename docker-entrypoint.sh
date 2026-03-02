#!/bin/bash
set -e

# Setup config directory
mkdir -p /app/config
chown -R ihms:ihms /app/config
chmod 755 /app/config

# Change to app directory
cd /app

# Run Gunicorn as the non-root 'ihms' user
# app:app refers to app.py and the 'app' Flask object inside it
exec su ihms -c "gunicorn app:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -"
