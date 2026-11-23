import { defineConfig } from "prisma/config";

// Prisma CLI (migrate, db push, studio) must use the direct, non-pooled Neon
// connection. Falls back to DATABASE_URL for local Postgres. An empty string is
// allowed so `prisma generate` and builds work without any credentials.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
