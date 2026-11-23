import { getDb } from "../src/lib/db";
import { toDbRows } from "../src/lib/db-mapping";
import { sampleFamily } from "../src/lib/sample-data";

// Loads the fictional sample family into an EMPTY database. Pass --reset to wipe
// the tree tables first.
async function main() {
  const db = getDb();
  const rows = toDbRows(sampleFamily);
  const reset = process.argv.includes("--reset");

  const existing = await db.person.count();
  if (existing > 0 && !reset) {
    console.log(`Database already has ${existing} people; skipping seed (use --reset to replace).`);
    return;
  }

  await db.$transaction([
    db.photo.deleteMany(),
    db.parentChild.deleteMany(),
    db.spouseRelationship.deleteMany(),
    db.person.deleteMany(),
    db.person.createMany({ data: rows.people }),
    db.parentChild.createMany({ data: rows.parentChild }),
    db.spouseRelationship.createMany({ data: rows.spouses }),
  ]);
  console.log(
    `Seeded ${rows.people.length} people, ${rows.parentChild.length} parent-child links, ${rows.spouses.length} spouse links.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => getDb().$disconnect());
