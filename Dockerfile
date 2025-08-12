FROM oven/bun:1-alpine

# Create app directory
WORKDIR /app

# Install deps
COPY package.json bun.lockb* ./
RUN bun install --production

# App source
COPY app.js ./

# Public dir for volumes
RUN mkdir -p /app/public

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["bun", "run", "app.js"]
