# Fiestamatic

A mobile-first Dumaguete City fiesta navigator app. "Basta fiesta, 'matic na!" — promotes local tourism, education, neighborliness, and community (bayanihan).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from env)
- `pnpm --filter @workspace/fiestamatic run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Lucide React, Leaflet (OpenStreetMap), Framer Motion, Vaul
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Fonts: Bricolage Grotesque (headings) + DM Sans (body)

## Where things live

- `artifacts/fiestamatic/src/` — React frontend
- `artifacts/fiestamatic/src/lib/fiesta-date.ts` — date normalization engine (parses floating fiesta dates)
- `artifacts/fiestamatic/src/data/barangays.ts` — embedded barangay dataset (30 barangays)
- `artifacts/api-server/src/routes/community.ts` — Bayanihan community board API
- `lib/db/src/schema/community_posts.ts` — community posts DB schema
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)

## Architecture decisions

- Barangay data is embedded directly in the frontend (static, no API needed)
- Floating fiesta dates ("May 1st Saturday", "Last Saturday") are parsed by `getOrCreateFiestaDate()` at runtime
- Leaflet/OpenStreetMap used for mapping (no Google Maps API key required)
- Vaul drawer for barangay detail slide-up on mobile
- Community board (Bayanihan) is the only backend-persisted feature

## Product

- **Home / Fiestas tab**: Chronological countdown dashboard, auto-sorted by upcoming date. Search + filter by This Month / Upcoming / Poblacion / Outer Barangays.
- **Map tab**: Leaflet map with all 30 barangay pins. Tap a pin → quick card → open drawer.
- **Bayanihan tab**: Community carpooling & shared table board. Create/view posts. Summary stats at top.
- **Barangay drawer**: Name origin, patron saint & traditions sections (placeholder text for now).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google Fonts `@import url(...)` must be the very first line in `index.css` — before `@import "tailwindcss"`. PostCSS rejects it otherwise.
- Leaflet default marker icons require manual fix (delete `_getIconUrl`, call `L.Icon.Default.mergeOptions`).
- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking artifact packages.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
