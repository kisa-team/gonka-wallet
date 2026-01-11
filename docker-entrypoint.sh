#!/bin/sh
set -e

if [ "$1" = "node" ] && [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  
  if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "📦 Found migrations, applying..."
    npx prisma migrate deploy
  else
    echo "⚠️  No migrations found"
    echo "💡 Consider creating migrations: npx prisma migrate dev --name init"
    echo "💡 Or use db push manually if needed for development"
  fi
  
  echo "✅ Database migrations completed"
fi

exec "$@"

