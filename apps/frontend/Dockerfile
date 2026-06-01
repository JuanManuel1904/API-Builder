# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/frontend/package*.json apps/frontend/
COPY packages/types/package*.json packages/types/

RUN npm ci --workspace=apps/frontend --workspace=packages/types

COPY apps/frontend/ apps/frontend/
COPY packages/types/ packages/types/
COPY tsconfig.base.json ./

RUN cd apps/frontend && npm run build

# ── Stage 2: Nginx ───────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
