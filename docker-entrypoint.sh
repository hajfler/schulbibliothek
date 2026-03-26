#!/bin/sh
set -e

# Create and fix permissions on the upload directory (runs as root)
UPLOAD_DIR="${COVER_UPLOAD_DIR:-/tmp/covers}"
mkdir -p "$UPLOAD_DIR"
chown nextjs:nodejs "$UPLOAD_DIR"

echo "Pushing database schema..."
su-exec nextjs ./node_modules/.bin/prisma db push --skip-generate

echo "Starting application..."
exec su-exec nextjs "$@"
