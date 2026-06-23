# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY packages/types/package*.json packages/types/
COPY packages/metadata-engine/package*.json packages/metadata-engine/

RUN npm ci --workspace=apps/backend --workspace=packages/types --workspace=packages/metadata-engine

COPY apps/backend/ apps/backend/
COPY packages/types/ packages/types/
COPY packages/metadata-engine/ packages/metadata-engine/
COPY tsconfig.base.json ./

# El binario está en la raíz del monorepo, no en apps/backend
RUN ./node_modules/.bin/prisma generate --schema=apps/backend/prisma/schema.prisma

RUN cd apps/backend && npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/backend

EXPOSE 3001
