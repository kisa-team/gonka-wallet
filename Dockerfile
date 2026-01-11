FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_NAME
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_DESCRIPTION
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_DSN
ARG SENTRY_URL
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_AUTH_TOKEN

ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_NAME=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_NAME}
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_DESCRIPTION=${NEXT_PUBLIC_WALLETCONNECT_PROJECT_DESCRIPTION}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV SENTRY_URL=${SENTRY_URL}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

COPY . .
RUN npm run build

FROM node:24-alpine AS prisma-cli
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-save prisma @prisma/engines

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/app/generated ./src/app/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY --from=prisma-cli /app/node_modules ./node_modules

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]