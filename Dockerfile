# Multi-stage Dockerfile for Next.js 16 + Prisma
# Builder stage
FROM node:20-bullseye-slim AS builder
WORKDIR /app
# Ensure devDependencies are installed during the build (tailwind/postcss etc.)
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false || npm install

# copy source
COPY prisma ./prisma
COPY . .

# generate prisma client and build
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --production --prefer-offline --no-audit --progress=false || npm install --production

# copy build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start"]
