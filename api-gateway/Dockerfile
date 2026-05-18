FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
