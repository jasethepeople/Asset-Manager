# Asset-Manager

A Replit project export from [replit.com/@serenebuilding/Asset-Manager](https://replit.com/@serenebuilding/Asset-Manager). The workspace is still the generic template (the `replit.md` project brief is unfilled: `# [Project name]`), but real feature work has started on an **agent-swarm management console**.

## Features

In-progress work on the swarm console, from the actual files:

- **Swarm API** (`artifacts/api-server/src/routes/swarm.ts`) — routes over `agents`, `objectives`, `genotypes`, `sandboxes`, and `activity` tables: list/get agents, create and dispatch objectives, manage sandboxes, and query a swarm summary.
- **Swarm database schema** (`lib/db/src/schema/swarm.ts`) — persisted agents, objectives, genotypes, sandboxes, and activity records.
- **Agent-swarm console UI** (`artifacts/agent-swarm-console/`) — a React + Vite + Tailwind app (`src/`, `index.html`, `package.json`).
- Template pieces: `artifacts/api-server` (Express 5), `artifacts/mockup-sandbox` (UI mockup scaffold), shared libs `lib/db`, `lib/api-spec` (OpenAPI), `lib/api-zod`, `lib/api-client-react`.

## Tech stack

pnpm workspaces, Node.js 24, TypeScript 5.9, Express 5, PostgreSQL + Drizzle ORM, Zod (v4), Orval API codegen, esbuild; React + Vite + Tailwind for the swarm console.

## Getting started

Per `replit.md`:

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` / `pnpm run build` — typecheck and build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Project structure

```
├── artifacts/agent-swarm-console/  # React + Vite swarm console UI
├── artifacts/api-server/           # Express server (health + swarm routes)
├── artifacts/mockup-sandbox/       # UI mockup scaffold
├── lib/db/                         # Drizzle ORM + schema (incl. schema/swarm.ts)
├── lib/api-spec/                   # OpenAPI spec + Orval codegen
├── lib/api-zod/                    # Zod schemas
└── lib/api-client-react/           # React API client
```

## Status

In progress. The product direction (agent-swarm console) is clear from the swarm routes, schema, and console UI, but the `replit.md` project brief was never filled in and the "Asset-Manager" name does not match the swarm-console code — the repo reads as a renamed/repurposed Replit export. Nothing here is presented as finished.
