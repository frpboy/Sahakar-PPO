# Multi-stage Dockerfile for NestJS API
# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json turbo.json ./
# Copy workspace packages and apps
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Install dependencies
RUN npm install

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build the API
WORKDIR /app/apps/api
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database ./packages/database

EXPOSE 8080

# Cloud Run expects the app to listen on PORT 8080 by default
CMD ["node", "apps/api/dist/main"]
