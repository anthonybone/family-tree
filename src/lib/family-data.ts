import { getDb } from "./db";
import { fromDbRows } from "./db-mapping";
import type { FamilyData } from "./types";

export class FamilyDataError extends Error {
  constructor(cause: unknown) {
    super("The family tree could not be loaded from the database.", { cause });
    this.name = "FamilyDataError";
  }
}

/** Single data-access entry point for the UI. Reads the whole tree from PostgreSQL. */
export async function getFamilyData(): Promise<FamilyData> {
  try {
    try {
      return await load();
    } catch {
      // Neon drops idle connections; one retry replaces a stale pooled connection.
      return await load();
    }
  } catch (error) {
    console.error("getFamilyData failed", error);
    throw new FamilyDataError(error);
  }
}

async function load(): Promise<FamilyData> {
  const db = getDb();
  const [people, photos, parentChild, spouses] = await Promise.all([
    db.person.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }] }),
    db.photo.findMany(),
    db.parentChild.findMany(),
    db.spouseRelationship.findMany(),
  ]);
  return fromDbRows({ people, photos, parentChild, spouses });
}
