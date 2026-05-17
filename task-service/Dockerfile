FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 CMD ["node","-e","const p = process.env.PORT || process.env.HTTP_PORT || 3002; require('http').get('http://localhost:' + p + '/health', res => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"]

CMD ["node", "dist/main.js"]
