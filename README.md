# Evaluation Tracker

DOST RO2 training evaluation and customer satisfaction dashboard, built with React, TypeScript, Vite, and Supabase. It supports public feedback forms, CSV/Excel imports, training summaries, charts, and PDF reports.

## Development

1. Install dependencies with `npm ci`.
2. Configure the existing Supabase project in a local `.env` file. Supported variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`), and `VITE_SUPABASE_USE_PROXY`.
3. Run `npm run dev`.

The app validates the Supabase project against its configured project reference. Keep the environment, `src/lib/supabaseEnv.ts`, and the proxy destination in `vercel.json` consistent. Never put a service-role key in a `VITE_*` variable.

The Supabase proxy is enabled by default. Vite proxies `/api/supabase` during development; Vercel supplies the same proxy and client-side routing rewrites in production. `npm run preview` previews the static build but does not provide that API proxy.

## Checks and build

- `npm run lint` checks the code with Oxlint.
- `npm run build` validates the Supabase environment, type-checks the app, and creates the production build in `dist/`.

There is currently no automated test suite or `npm test` script.

## Database maintenance

SQL files are manual maintenance tools, not application runtime imports. Keep the following scripts for setup and support:

- `supabase/setup.sql`: initial schema and setup. This script includes reset operations; review it before using it on an existing database.
- `supabase/feedback-forms.sql`: public feedback form schema and functions.
- `supabase/feedback-forms-csf.sql`: customer satisfaction form support.
- `supabase/create-admin.sql`: administrator account maintenance.
- `supabase/features-queries.sql`: operational queries.
- `supabase/verify-graphs.sql`: chart data diagnostics.

See `DEMO-CHECKLIST.md` for the application walkthrough and maintenance examples. Files under `output/` and `tmp/` are local documents, review notes, and source records; they are not required by the application build.
