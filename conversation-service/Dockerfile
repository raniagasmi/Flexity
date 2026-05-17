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
EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD ["node","-e","require('http').get('http://localhost:3006/health', res => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"]

CMD ["node", "dist/main.js"]
