# Stage 1: Build with Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# Install main app dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build main app
COPY . .
RUN bun run build

# Build sidecar
WORKDIR /app/sidecar
COPY sidecar/package.json sidecar/bun.lock* ./
RUN bun install --frozen-lockfile
RUN bun run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

# Install s6-overlay
ARG S6_OVERLAY_VERSION=3.1.6.2
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz /tmp/
ADD https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-x86_64.tar.xz /tmp/
RUN apk add --no-cache xz && \
    tar -C / -Jxpf /tmp/s6-overlay-noarch.tar.xz && \
    tar -C / -Jxpf /tmp/s6-overlay-x86_64.tar.xz && \
    rm -f /tmp/s6-overlay-*.tar.xz

# Install Docker CLI and compose plugin
RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/sidecar/dist ./sidecar/dist
COPY --from=builder /app/sidecar/node_modules ./sidecar/node_modules

# Copy s6 service definitions
COPY docker/s6-overlay /etc/s6-overlay

# Create persistent data directories
RUN mkdir -p /data/servers /data/db /data/backups

ENV NODE_ENV=production
ENV PORT=3000
ENV SIDECAR_PORT=3001
ENV DATA_DIR=/data
ENV DATABASE_URL=/data/db/minepanel.db

EXPOSE 3000 3001

ENTRYPOINT ["/init"]
