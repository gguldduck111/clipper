# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- This is a **vinext** app (Next.js App Router API reimplemented on Vite), deployed to **Cloudflare Workers**, not a standard Next.js/Node server. `next.config.ts` is effectively unused; build config lives in `vite.config.ts` and `wrangler.jsonc`.
- Code runs in the Workers runtime: avoid Node-only APIs in app/route code.
- Database is Cloudflare D1 (SQLite) via Drizzle ORM. Get a client with `getDatabase()` from `@/lib/clipper/db` (reads the `DB` binding from `cloudflare:workers`). Put queries in `lib/clipper/data.ts`.
- Pages that read the DB set `export const dynamic = "force-dynamic"`. Route `params` are a `Promise` and must be awaited.
- UI uses shadcn/ui (new-york style, lucide icons) in `components/ui/`; app-specific components go in `components/clipper/`. Import via the `@/` alias (maps to repo root).

## Commands

- First-time local setup: `npm run db:migrate:local` then `npm run db:seed:local` (local D1 lives in `.wrangler/`).
- `npm run db:seed:local` **deletes all rows** before reseeding (`scripts/seed.sql`).
- After changing bindings in `wrangler.jsonc`, run `npm run cf-typegen` to regenerate `worker-configuration.d.ts`.
- There are no tests. Verify changes with `npm run lint`, `npx tsc --noEmit`, then `npm run build`.
- Schema lives in `db/schema.ts`; migrations in `drizzle/` (applied by wrangler via `migrations_dir`).

Always use Koreans when you answered
