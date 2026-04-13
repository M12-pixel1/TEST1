# Augimo Programa V1

Growth + Anti-Matter engine for skills development.

## Architecture

```
augimo-programa/
├── app/                   ← Node.js/TypeScript (API + domain + UI)
│   ├── src/
│   │   ├── domain/        ← business logic
│   │   ├── anti/          ← Anti-Matter Core (7 signals, 6 blocks)
│   │   ├── api/           ← API layer
│   │   ├── ui/            ← UI controllers
│   │   ├── db/            ← SQLite schema + repositories
│   │   ├── config/        ← runtime config
│   │   └── bootstrap/     ← pilot seed data
│   ├── browser/           ← browser entry
│   └── tests/             ← unit + integration tests
├── analytics-python/      ← Python/Streamlit analytics
│   ├── main.py            ← Vet AI triage
│   ├── dashboard.py       ← Multi-agent dashboard
│   └── requirements.txt   ← Python dependencies
├── deploy/                ← PostgreSQL migrations for production
└── scripts/               ← CLI utilities
```

## Anti-Matter Core

Two parallel engines in one program:
- **Growth Engine** — tracks what works (matter)
- **Anti Engine** — tracks what blocks (anti-matter)

7 V1 signals: confidence_gap, repeat_error, friction_point, false_progress, script_dependency, drop_risk, system_fault

3 visibility layers: PUBLIC (user), SEMI_PUBLIC (manager), INTERNAL (product team)

## Requirements

- Node.js >= 24 (LTS) — type stripping and `node:sqlite` are stable, no experimental flags needed

## Setup

```bash
pnpm install
```

## Commands (Node.js)

```bash
npm run lint            # ESLint with TypeScript plugin
npm run typecheck       # TypeScript type checking
npm run test            # unit + integration tests
npm run test:coverage   # tests with coverage report
npm run build:browser   # compile browser entry
npm run pilot:init      # initialize demo data
npm run pilot:reset     # hard reset demo DB
npm run pilot:reset:safe -- --confirm=RESET_DEMO_DB
```

## Commands (Python)

```bash
cd analytics-python
pip install -r requirements.txt
streamlit run main.py
```

## DB-backed default path

- Browser/default runtime now uses SQLite-backed repositories (`node:sqlite`) for core V1 entities.
- V1 migration SQL is available at `app/src/db/migrations/001_init_v1.sql`.
- Migration discipline uses deterministic file ordering + `schema_migrations` tracking (`runV1Migrations`).
- DB location is configurable via `V1_DB_PATH` (default: `app/data/v1.sqlite`).

## Manual browser smoke path

1. Build browser files:

```bash
pnpm build:browser
```

2. Open `app/browser/index.html` in a browser.

## Environment

Use `.env.example` as a template:

```bash
cp .env.example .env
```

For pilot/demo operations, see `docs/PILOT_RUNBOOK.md`.

Recommended pilot env keys:
- `V1_DB_PATH`
- `PILOT_ORGANIZATION_ID`
- `PILOT_ACTIVE_USER_ID`
- `PILOT_RESET_CONFIRM` (only for explicit hard-reset flows)
