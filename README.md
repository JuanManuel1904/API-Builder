# Visual API Builder

> Build complete REST APIs visually — drag & drop, no backend code required.

A professional low-code/no-code platform for developers, students and startups to design, document and export REST APIs through a visual canvas.

---

## ✨ Features

- **Visual canvas** — drag-and-drop node editor powered by React Flow
- **Entity designer** — create data models with typed fields and constraints
- **Endpoint builder** — define REST endpoints with method, path, auth and tags
- **Flow pipelines** — wire request → auth → validation → DB query → response visually
- **Code generation** — export a complete NestJS project, Prisma schema, OpenAPI spec, Postman collection and Docker setup
- **In-app playground** — test your API without leaving the browser
- **Auto-save** — canvas changes sync to the database automatically
- **JWT auth** — register/login with role-based access (admin / developer / viewer)

---

## 🏗 Architecture

```
visual-api-builder/
├── apps/
│   ├── frontend/        React + Vite + TypeScript + React Flow + Zustand
│   └── backend/         NestJS + Prisma + PostgreSQL + JWT
├── packages/
│   ├── @vab/types       Shared TypeScript types (ProjectMetadata graph)
│   └── @vab/metadata-engine  Code generators (Prisma, OpenAPI, NestJS)
├── docker-compose.yml
└── turbo.json
```

The **central concept**: the system stores **metadata** (a JSON graph of entities, relations, flows and endpoints), never raw code. All code is generated on demand from this graph.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose
- npm ≥ 10

### 1. Clone and install

```bash
git clone https://github.com/your-org/visual-api-builder.git
cd visual-api-builder
npm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — set DATABASE_URL and JWT_SECRET
```

### 3a. Run with Docker (recommended)

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

### 3b. Run locally (dev mode)

```bash
# Terminal 1 — start PostgreSQL
docker-compose up db -d

# Terminal 2 — backend
cd apps/backend
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# Terminal 3 — frontend
cd apps/frontend
npm run dev
```

- Frontend: http://localhost:5173
- Demo login: `demo@vab.dev` / `password123`

---

## 📖 Usage

### 1. Create a project
Log in → Dashboard → **New Project**.

### 2. Define entities
Click **+ Entity** in the topbar → add fields with types and constraints.

### 3. Create endpoints
Click **+ Endpoint** → choose method, path, link to an entity.

### 4. Build the flow
Select an endpoint in the sidebar → the canvas shows its pipeline. Drag nodes from the left palette and connect them.

### 5. Test in-app
Click **▶ Playground** at the bottom of the canvas to test requests live.

### 6. Export
Click **↓ ZIP** in the topbar to download the full project:
- `src/` — complete NestJS application
- `prisma/schema.prisma` — database schema
- `openapi.json` — OpenAPI 3.0 spec
- `postman-collection.json` — Postman collection
- `Dockerfile` + `docker-compose.yml`

---

## 🔌 API Reference

Full interactive docs at `/api/docs` (Swagger UI).

| Module      | Base path                               |
|-------------|------------------------------------------|
| Auth        | `POST /api/auth/login`                  |
| Projects    | `GET /api/projects`                     |
| Entities    | `GET /api/projects/:id/entities`        |
| Endpoints   | `GET /api/projects/:id/endpoints`       |
| Flows       | `GET /api/projects/:id/endpoints/:id/flow` |
| Export      | `GET /api/projects/:id/export/zip`      |

---

## 🗺 Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | Setup, layout, React Flow, entity CRUD, metadata system |
| 2 | ✅ | Endpoints, flows, Swagger generation, validations |
| 3 | 🔄 | Runtime engine — preview API without exporting |
| 4 | 🔄 | Code export, Docker generation, auth visual config |
| 5 | 📋 | Auto-deploy via Railway/Render, AI generation, real-time collab |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, React Flow, TailwindCSS, Zustand, React Query |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, JWT, class-validator |
| Packages | Shared types, Metadata engine (code generators) |
| DevOps | Docker, Docker Compose, Turborepo, Husky, Conventional Commits |

---

## 🤝 Contributing

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Commit following Conventional Commits
git commit -m "feat(canvas): add condition node"

# Push and open a PR
git push origin feat/your-feature
```

Commit format: `type(scope): description`
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
