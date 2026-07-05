# Build & run yes-jnn locally

## Prerequisites

- [Bun](https://bun.sh) v1.x — install with `curl -fsSL https://bun.sh/install | bash`
- A [Supabase](https://supabase.com) project; the free tier is enough

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/littleducktoyou/yes-jnn.git
   cd yes-jnn
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your Supabase project URL & anon key. Both are in your project's **Settings → API** page.

4. **Run the database migration**

   Paste the file at `supabase/migrations/` into the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new) and run it, or use the CLI:

   ```bash
   supabase db push
   ```

5. **Start the dev server**

   ```bash
   bun run dev
   ```

   The app runs at `http://localhost:3000`.

## Environment variables

| Variable                        | What it is                                                                |
| ------------------------------- | ------------------------------------------------------------------------- |
| `SUPABASE_URL`                  | Your project URL, e.g. `https://abcdef.supabase.co`                      |
| `SUPABASE_PUBLISHABLE_KEY`      | Anon/public key — safe to expose in client-side code                      |
| `SUPABASE_PROJECT_ID`           | The project ID segment from your URL                                      |
| `VITE_SUPABASE_URL`             | Same URL, prefixed for Vite's client bundle                               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same anon key, prefixed for Vite's client bundle                          |
| `VITE_SUPABASE_PROJECT_ID`      | Same project ID, prefixed for Vite's client bundle                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server-only.** Set in your hosting dashboard only. Never put in `.env`. |

`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Committing it to source exposes every user's data.

## Database schema

Two tables, both with Row Level Security enabled:

- **`notebooks`** — `id uuid`, `user_id uuid`, `name text`, `created_at timestamptz`, `updated_at timestamptz`
- **`notes`** — `id uuid`, `user_id uuid`, `notebook_id uuid` (nullable FK to `notebooks`), `title text`, `body text`, `created_at timestamptz`, `updated_at timestamptz`

Full SQL is in [`supabase/migrations/`](./supabase/migrations/).
