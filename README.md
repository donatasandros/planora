# Planora

Planora is a Discord bot that turns member presence into playtime statistics,
with a web app for browsing them.

The bot listens for presence updates, opens a session when a tracked activity
starts, closes it when the activity stops, and rolls the result into per-user
totals. Sessions and totals are stored in PostgreSQL; live state is kept in
Redis.

## Features

- Automatic session tracking from Discord presence updates
- Per-user activity totals
- Slash commands to view your statistics (`/activity`, `/history`)
- `/privacy` controls for profile visibility
- Paginated, interactive views built on a shared component registry
- Stale-session sweeper with orphan recovery
- Structured logging (pino) with optional Loki shipping via Promtail

> **Status:** the bot is the primary component. The web app (`apps/web`) is
> currently a scaffold; the statistics dashboard is in progress.

## Tech stack

| Area          | Tools                                                |
| ------------- | ---------------------------------------------------- |
| Bot           | discord.js 14, tsdown, Vitest                        |
| Web           | TanStack Start, Vite, Nitro, Tailwind CSS, shadcn/ui |
| Database      | PostgreSQL, Drizzle ORM, `pg` (native)               |
| Cache / state | Redis (ioredis)                                      |
| Validation    | Zod, `@t3-oss/env-core`                              |
| Logging       | pino                                                 |
| Tooling       | pnpm, Turborepo, Biome, TypeScript                   |
| Deployment    | Docker, Docker Compose, Promtail                     |

## Repository layout

This is a pnpm and Turborepo monorepo.

| Path              | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `apps/bot`        | Discord bot                                                |
| `apps/web`        | Web app (TanStack Start)                                   |
| `packages/db`     | Drizzle schema, migrations, database client                |
| `packages/env`    | Typed environment validation                               |
| `packages/logger` | pino logger factory (`createChildLogger`)                  |
| `packages/redis`  | ioredis client and helpers                                 |
| `packages/ui`     | Shared shadcn/ui components (`@workspace/ui/components/*`) |

## Getting started

### Prerequisites

- **Node.js 24** or newer (`engines.node` is `>=24`)
- **pnpm 12** (pinned via `packageManager` in the root `package.json`)
- **PostgreSQL** and **Redis**
- **libpq** (`libpq-dev` on Debian/Ubuntu), required by the native `pg` driver

### Install

```bash
pnpm install --frozen-lockfile
```

### Configure environment

Copy the example files that match what you are running:

| File               | Used by                                       |
| ------------------ | --------------------------------------------- |
| `.env`             | `docker compose` (web, bot, promtail)         |
| `apps/bot/.env`    | Local bot (`pnpm --filter bot dev`)           |
| `packages/db/.env` | drizzle-kit (`generate`, `migrate`, `studio`) |
| `apps/web/.env`    | Local web server (`PORT`)                     |

Environment variables are validated at import time. A missing required value
fails on startup, not on first use.

| Variable               | Required | Description                                                                                                 |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                                                                                |
| `DATABASE_POOL_MAX`    | No       | Maximum database pool connections. Default: `10`                                                            |
| `REDIS_URL`            | Yes      | Redis connection string                                                                                     |
| `DISCORD_BOT_TOKEN`    | Yes      | Discord bot token                                                                                           |
| `DISCORD_DEV_GUILD_ID` | No       | Deploys slash commands to one guild instantly. Unset deploys globally. Leave unset in production.           |
| `LOG_LEVEL`            | No       | `fatal`, `error`, `warn`, `info`, `debug`, or `trace`. Default: `info`                                      |
| `NODE_ENV`             | No       | `development`, `test`, or `production`. Default: `development`                                              |
| `LOKI_URL`             | Prod     | Loki endpoint used by Promtail in `docker-compose.yml`                                                      |
| `PORT`                 | No       | Web server port. Default: `3000`                                                                            |

## Running

### Development

```bash
# Bot, with hot reload (reads apps/bot/.env)
pnpm --filter bot dev

# Web app
pnpm --filter web dev
```

### Production

Build everything, then start each app:

```bash
pnpm build
node apps/bot/dist/index.mjs
node apps/web/dist/server/index.mjs
```

### Docker

Run the web app, bot, and Promtail together (reads the root `.env`):

```bash
docker compose up -d --build
```

Both Dockerfiles are multi-stage: `turbo prune`, then `pnpm install
--frozen-lockfile`, then `turbo build`, then a non-root runtime image. Root-level
config that packages extend (for example `tsconfig.base.json`) is copied
explicitly, because `turbo prune` only copies what a package depends on.

## Development

### Commands

Run from the repository root.

| Command          | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `pnpm build`     | Build all packages (tsdown for bot and packages, Vite for web) |
| `pnpm lint`      | Check lint and formatting with Biome (non-mutating)          |
| `pnpm fix`       | Apply Biome fixes and formatting                             |
| `pnpm typecheck` | Run `tsc --noEmit` in each package                           |
| `pnpm test`      | Run the test suite (the bot is the only package with tests)  |

Run a single package or test file:

```bash
pnpm --filter bot test
pnpm --filter bot exec vitest run src/shared/utils/time.test.ts
```

CI (`.github/workflows/ci.yml`) runs `build`, `lint`, `typecheck`, and `test`,
in that order. Tests do not need PostgreSQL or Redis: they use fakes and
injected dependencies, and the Vitest setup supplies dummy environment values.

### Code style

- Biome is the only linter and formatter (no ESLint or Prettier).
- Tabs, line width 80, double quotes, no semicolons.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org)
  with a scope, for example `feat(bot): ...`, `fix(bot): ...`, `chore: ...`.

## Bot architecture

```
apps/bot/src/
├── index.ts            # Entry point: createClient, createLifecycle
├── app/
│   ├── client.ts       # Intents, partials, error hook
│   └── lifecycle.ts    # Startup, signal handling, shutdown ordering
├── core/               # Framework
│   ├── commands/       # Types, registry (deploy), cooldown gate
│   ├── components/     # Button/modal types, registry, dispatch, define helpers
│   ├── events/         # Types, registry (priority chain), defineEvent
│   ├── loaders/        # Glob discovery of feature modules
│   └── logger.ts
├── features/
│   ├── activity/       # Presence tracking, sessions, stats, sweeper
│   │   ├── identity/   # Activity key (sha256) and session construction
│   │   ├── tracking/   # Fingerprint, last-fingerprint, reconcile, locks
│   │   ├── services/   # Redis session store, history query, write sink
│   │   ├── reporting/  # Page builders and row formatting (pure)
│   │   ├── sweeper/    # Stale-session sweep, presence re-check, orphan recovery
│   │   ├── schemas/    # Zod validation of cached payloads
│   │   ├── commands/   # /activity, /history
│   │   └── events/     # presence-update
│   └── system/         # Non-activity features
│       ├── commands/   # /ping, /privacy
│       ├── events/     # client-ready (deploy + log), interaction-create
│       ├── services/   # User resolution, visibility policy
│       └── schemas/    # Zod validation of cached user records
└── shared/
    ├── discord/        # replyError, profile-view guard
    ├── pagination/     # Static and cursor paginators on the component registry
    ├── constants/
    └── utils/
```

Three rules explain most of the structure:

1. **Handlers are discovered, not imported.** Every `.ts` file under
   `features/**/{commands,events,components}/` is loaded by glob. A handler
   anywhere else never runs. Exports are duck-typed: commands need `data` and
   `execute`; events need `event` and `execute`; components need `kind`,
   `feature`, `match`, and `onButton` or `onModal`.
2. **One registry per interaction kind.** Commands dispatch at priority 10.
   Components dispatch earlier through `componentRegistry.openView`, which owns
   the collector, owner checks, expiry, and the `<feature>:<sessionId>` customId
   format. Do not add private collectors or `awaitModalSubmit`.
3. **`shared/**` never imports `features/**`.** Cross-feature access goes
   through the named feature barrels (`activity`, `system`). The one accepted
   exception is `shared/pagination` importing the component registry.

Tracked sessions are keyed by a sha256 hash of the activity identity (`type`,
`applicationId`, `name`, `isCustom`), so the same activity name under different
applications stays separate.

Presence handling runs in this order: fingerprint, last-fingerprint read, user
lock, resolve user and sessions, reconcile, write, commit fingerprint, release.

## Database

The schema lives in `packages/db/src/schema/` and defines three tables:

- `bot_users`
- `activity_sessions`
- `activity_totals`

Migrations are tracked in `packages/db/migrations/`. To change the schema:

```bash
# 1. Edit the schema in packages/db/src/schema/
pnpm --filter @workspace/db generate

# 2. Review the generated SQL, then commit it with the schema change
pnpm --filter @workspace/db migrate
```

- Never edit a migration that has been applied. Fix forward with a new one.
- `push` diffs against a live database and can drop data. Use it only on
  throwaway databases.

## Deployment

- Bot slash commands are deployed on `ClientReady`. Restarting the bot replaces
  the command payload.
- Guild-scoped commands (`DISCORD_DEV_GUILD_ID`) update immediately. Global
  commands can take up to an hour to propagate in Discord.
- The bot handles `SIGINT` and `SIGTERM` by shutting down the sweeper, the
  session write sink, the Discord client, Redis, and the database, in that order.
