# family-tree

Family tree web app built with Next.js (App Router), TypeScript, Tailwind CSS and React Flow. Amazing

**Status:** data is stored in PostgreSQL (Neon) through Prisma. Anyone can view the tree; one administrator password unlocks adding, editing and deleting people and relationships. Photo uploads are not implemented yet.

## Setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. `npm run admin:hash -- "your password"` and put the output in `ADMIN_PASSWORD_HASH`. Set `SESSION_SECRET` to a random string of 32+ characters.
3. `npx prisma migrate deploy`, then `npm run db:seed` (the 56 fictional sample people; `-- --reset` wipes first).
4. Sign in at `/login`.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm test        # Vitest unit tests (relationships and tree layout)
npm run build
```

The tree URL keeps the selected person in the hash (`/#isabel`), so returning from a profile restores the view.

