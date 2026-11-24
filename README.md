# family-tree

Family tree web app built with Next.js (App Router), TypeScript, Tailwind CSS and React Flow. Amazing

**Status:** data is stored in PostgreSQL (Neon) through Prisma. There is no login: anyone with the URL can view, add, edit and delete people and relationships. Photo uploads are not implemented yet.

## Setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. `npx prisma migrate deploy`. Optionally `npm run db:seed` loads 56 fictional sample people into an empty database (`-- --reset` wipes first).

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm test        # Vitest unit tests (relationships and tree layout)
npm run build
```

The tree URL keeps the selected person in the hash (`/#isabel`), so returning from a profile restores the view.

