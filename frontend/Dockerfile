FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts
RUN npm rebuild esbuild --foreground-scripts

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 80

CMD ["node", "server.js"]
