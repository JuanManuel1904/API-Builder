# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY packages/types/package*.json packages/types/
COPY packages/metadata-engine/package*.json packages/metadata-engine/

RUN npm ci --workspace=apps/backend --workspace=packages/types --workspace=packages/metadata-engine

# Copy source
COPY apps/backend/ apps/backend/
COPY packages/types/ packages/types/
COPY packages/metadata-engine/ packages/metadata-engine/
COPY tsconfig.base.json ./

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build
RUN cd apps/backend && npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/main"]
