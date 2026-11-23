import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "./db";
import { getFamilyData } from "./family-data";
import { buildRelations } from "./relations";
import { layoutFamily } from "./tree-layout";
import { sampleFamily } from "./sample-data";

// Integration tests: run only when DATABASE_URL points at a database seeded with
// `npm run db:seed`. They never write data (constraint violations roll back).
describe.skipIf(!process.env.DATABASE_URL)("database-backed family data", () => {
  afterAll(() => getDb().$disconnect());

  it("returns the same people and relationships as the sample data", async () => {
    const db = await getFamilyData();
    const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);
    expect([...db.people].sort(byId)).toEqual([...sampleFamily.people].sort(byId));
    expect(buildRelations(db)).toEqual(buildRelations(sampleFamily));
  });

  it("produces an identical tree layout", async () => {
    const db = await getFamilyData();
    expect(layoutFamily(db)).toEqual(layoutFamily(sampleFamily));
  });

  it("rejects self-parenting, reversed spouse pairs, duplicates and bad dates", async () => {
    const prisma = getDb();
    await expect(prisma.parentChild.create({ data: { parentId: "henry", childId: "henry" } })).rejects.toThrow();
    await expect(
      prisma.parentChild.create({ data: { parentId: sampleFamily.parentChild[0].parentId, childId: sampleFamily.parentChild[0].childId } }),
    ).rejects.toThrow();
    await expect(prisma.spouseRelationship.create({ data: { personAId: "henry", personBId: "dorothy" } })).rejects.toThrow();
    await expect(prisma.person.create({ data: { firstName: "X", lastName: "Y", birthDate: "1990-13x" } })).rejects.toThrow();
  });
});
