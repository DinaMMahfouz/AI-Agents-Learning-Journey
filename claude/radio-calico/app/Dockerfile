FROM docker.io/library/node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./

ENV NODE_ENV=production PORT=3000
EXPOSE 3000

# Run as the built-in non-root "node" user.
USER node

CMD ["node", "server.js"]
