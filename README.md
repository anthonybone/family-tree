# family-tree

Family tree web app built with Next.js (App Router), TypeScript, Tailwind CSS and React Flow.

**Status: Phase 1.** The tree currently renders temporary sample data from `src/lib/sample-data.ts`. Phase 2 replaces it with Prisma and Neon PostgreSQL.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm test        # Vitest unit tests (relationships and tree layout)
npm run build
```

The tree URL keeps the selected person in the hash (`/#isabel`), so returning from a profile restores the view.

