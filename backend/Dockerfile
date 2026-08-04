FROM node:20-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["dumb-init", "node", "src/app.js"]
