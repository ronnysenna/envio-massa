# Multi-stage Dockerfile for Next.js 16 + Prisma
# Builder stage
FROM node:20-bullseye-slim AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_PRODUCTION=false

# Build-time PUBLIC environment variables (only expose NEXT_PUBLIC_* that are safe for the client)
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ARG NEXT_PUBLIC_CONFIRM_THRESHOLD
ENV NEXT_PUBLIC_CONFIRM_THRESHOLD=${NEXT_PUBLIC_CONFIRM_THRESHOLD}

# copy package files and install deps (com dev deps para build)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false 2>&1 || npm install 2>&1

# copy source e prisma
COPY prisma ./prisma
COPY . .

# generate prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline --no-audit --progress=false 2>&1 || npm install --production 2>&1

# copy build artifacts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Criar diretório de uploads com permissões corretas
RUN mkdir -p /app/public/uploads && chmod 755 /app/public/uploads

EXPOSE 3000

# Create start script that runs migrations and then starts the app
RUN echo '#!/bin/sh\nset -e\necho "Running Prisma migrations..."\nnpx prisma migrate deploy\necho "Starting Next.js..."\nexec npm run start' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
