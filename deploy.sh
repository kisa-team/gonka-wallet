#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

ENV="${1:-dev}"

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  if [ "$1" = "rollback" ]; then
    ENV="dev"
  else
    echo "❌ Error: Environment must be 'dev' or 'prod'"
    echo "Usage: $0 [dev|prod] [rollback]"
    exit 1
  fi
fi

ROLLBACK_MODE=false
if [ "$1" = "rollback" ] || [ "$2" = "rollback" ]; then
  ROLLBACK_MODE=true
fi

if [ "$ENV" = "dev" ]; then
  declare -a SERVICES=(
    "wallet-1-dev"
    "wallet-2-dev"
  )
  
  declare -a CONTAINERS=(
    "gonka_wallet_dev_1"
    "gonka_wallet_dev_2"
  )
  
  ENV_FILE=".env.docker.dev"
  COMPOSE_PROFILES="--profile dev"
  IMAGE_NAME="${IMAGE_NAME}"
  DEPLOY_HISTORY_FILE=".deploy_history.dev"
else
  declare -a SERVICES=(
    "wallet-1-prod"
    "wallet-2-prod"
  )
  
  declare -a CONTAINERS=(
    "gonka_wallet_prod_1"
    "gonka_wallet_prod_2"
  )
  
  ENV_FILE=".env.docker.prod"
  COMPOSE_PROFILES="--profile prod"
  IMAGE_NAME="${IMAGE_NAME}"
  DEPLOY_HISTORY_FILE=".deploy_history.prod"
fi

COMPOSE_FILES="-f compose.yml"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

declare -a PORTS=(
  "${SERVICE1_EXTERNAL_PORT}"
  "${SERVICE2_EXTERNAL_PORT}"
)
HEALTH_CHECK_PATH="/"
HEALTH_CHECK_TIMEOUT=60
NGINX_WAIT_TIME=5
KEEP_IMAGES=3

if [ -z "${IMAGE_TAG}" ]; then
  IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
fi

if [ ${#SERVICES[@]} -lt 2 ]; then
  echo "❌ Error: At least 2 services must be configured"
  exit 1
fi

if [ ${#SERVICES[@]} -ne ${#CONTAINERS[@]} ] || [ ${#SERVICES[@]} -ne ${#PORTS[@]} ]; then
  echo "❌ Error: All arrays must have the same length"
  exit 1
fi

build_image_if_needed() {
  local service=$1
  #if docker image inspect "${IMAGE_NAME}:${IMAGE_TAG}" >/dev/null 2>&1; then
  #  echo "✅ Image ${IMAGE_NAME}:${IMAGE_TAG} already exists, skipping build"
  #else
    echo "🔨 Building image ${IMAGE_NAME}:${IMAGE_TAG}..."
    export IMAGE_NAME IMAGE_TAG
    docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" build "$service"
  #fi
}

if [ "$ROLLBACK_MODE" = true ]; then
  if [ ! -f "$DEPLOY_HISTORY_FILE" ]; then
    echo "❌ No deployment history found"
    exit 1
  fi
  
  PREVIOUS_TAG=$(tail -n 1 "$DEPLOY_HISTORY_FILE" 2>/dev/null)
  if [ -z "$PREVIOUS_TAG" ]; then
    echo "❌ No previous version found in history"
    exit 1
  fi
  
  if ! docker image inspect "${IMAGE_NAME}:${PREVIOUS_TAG}" >/dev/null 2>&1; then
    echo "❌ Image ${IMAGE_NAME}:${PREVIOUS_TAG} not found locally"
    echo "💡 Available images:"
    docker images "${IMAGE_NAME}" --format "  {{.Tag}}" | head -5
    exit 1
  fi
  
  echo "🔄 Rolling back to: ${IMAGE_NAME}:${PREVIOUS_TAG}"
  IMAGE_TAG="$PREVIOUS_TAG"
  sed -i '$d' "$DEPLOY_HISTORY_FILE"
fi

echo "🔍 Checking which container is running..."

CURRENT_INDEX=-1
CURRENT_IMAGE_TAG=""
RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}")
for i in "${!CONTAINERS[@]}"; do
  if echo "$RUNNING_CONTAINERS" | grep -q "^${CONTAINERS[$i]}$"; then
    CURRENT_INDEX=$i
    CURRENT_IMAGE_TAG=$(docker inspect "${CONTAINERS[$i]}" --format='{{.Config.Image}}' 2>/dev/null | cut -d: -f2 || echo "")
    break
  fi
done

if [ $CURRENT_INDEX -eq -1 ]; then
  echo "🚀 No containers running, building image and starting ${SERVICES[0]}..."
  build_image_if_needed "${SERVICES[0]}"
  docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" up -d "${SERVICES[0]}"
  echo "✅ ${SERVICES[0]} started on port ${PORTS[0]} with image ${IMAGE_NAME}:${IMAGE_TAG}"
  exit 0
fi

NEXT_INDEX=$(( (CURRENT_INDEX + 1) % ${#SERVICES[@]} ))

CURRENT_SERVICE="${SERVICES[$CURRENT_INDEX]}"
CURRENT_CONTAINER="${CONTAINERS[$CURRENT_INDEX]}"
NEXT_SERVICE="${SERVICES[$NEXT_INDEX]}"
NEXT_CONTAINER="${CONTAINERS[$NEXT_INDEX]}"
NEXT_PORT="${PORTS[$NEXT_INDEX]}"

echo "📦 Current: $CURRENT_CONTAINER"
echo "🔄 Deploying: $NEXT_CONTAINER"
echo "🏷️ Image: ${IMAGE_NAME}:${IMAGE_TAG}"

build_image_if_needed "$NEXT_SERVICE"

echo "🚀 Starting $NEXT_CONTAINER with new image..."
docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" up -d "$NEXT_SERVICE"

echo "⏳ Waiting for $NEXT_CONTAINER to be ready..."
ELAPSED=0

while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
  if curl -f -s "http://127.0.0.1:$NEXT_PORT$HEALTH_CHECK_PATH" > /dev/null 2>&1; then
    echo "✅ $NEXT_CONTAINER is healthy!"
    break
  fi
  
  echo "  Waiting... (${ELAPSED}s/${HEALTH_CHECK_TIMEOUT}s)"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
  echo "❌ Timeout waiting for $NEXT_CONTAINER"
  echo "🔙 Rolling back..."
  docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" stop "$NEXT_SERVICE"
  docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" rm -f "$NEXT_SERVICE"
  exit 1
fi

if [ "$NGINX_WAIT_TIME" -gt 0 ]; then
  echo "⏳ Waiting ${NGINX_WAIT_TIME}s for nginx to detect new container..."
  sleep "$NGINX_WAIT_TIME"
fi

echo "🛑 Stopping $CURRENT_CONTAINER..."
docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" stop "$CURRENT_SERVICE"

docker compose $COMPOSE_FILES $COMPOSE_PROFILES --env-file "$ENV_FILE" rm -f "$CURRENT_SERVICE"

if [ -n "$CURRENT_IMAGE_TAG" ] && [ "$CURRENT_IMAGE_TAG" != "latest" ]; then
  if [ ! -f "$DEPLOY_HISTORY_FILE" ] || ! grep -q "^${CURRENT_IMAGE_TAG}$" "$DEPLOY_HISTORY_FILE"; then
    echo "$CURRENT_IMAGE_TAG" >> "$DEPLOY_HISTORY_FILE"
  fi
fi

echo ""
echo "🧹 Cleaning up old images (keeping last $KEEP_IMAGES versions)..."
ALL_TAGS=$(docker images "${IMAGE_NAME}" --format "{{.Tag}}" --filter "dangling=false" | grep -v "^latest$" | sort -u)
TAG_COUNT=$(echo "$ALL_TAGS" | wc -l)

if [ "$TAG_COUNT" -gt "$KEEP_IMAGES" ]; then
  REMOVE_COUNT=$((TAG_COUNT - KEEP_IMAGES))
  echo "$ALL_TAGS" | head -n "$REMOVE_COUNT" | while read -r old_tag; do
    if [ -n "$old_tag" ] && [ "$old_tag" != "$IMAGE_TAG" ]; then
      echo "  Removing ${IMAGE_NAME}:${old_tag}"
      docker rmi "${IMAGE_NAME}:${old_tag}" 2>/dev/null || true
    fi
  done
else
  echo "  No cleanup needed (only $TAG_COUNT versions exist)"
fi

echo ""
echo "🎉 Deploy complete!"
echo "✅ Now running: $NEXT_CONTAINER on port $NEXT_PORT"
echo "🏷️  Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "📊 Check status: docker ps | grep ${CONTAINERS[0]%%_*}"
echo "📜 Rollback: $0 $ENV rollback"

