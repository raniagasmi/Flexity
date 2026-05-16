# syntax=docker/dockerfile:1.7

FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 CMD curl -f http://localhost:3002/health || exit 1

CMD ["sh", "-c", "node dist/migration-runner.js && node dist/main.js"]
