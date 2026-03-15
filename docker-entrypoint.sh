#!/bin/sh
set -e

echo "Pushing database schema..."
./node_modules/.bin/prisma db push --skip-generate

echo "Starting application..."
exec "$@"
