import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "./db";
import {
  UserError,
  addParentChild,
  addSpouse,
  createPerson,
  deletePerson,
  removeParentChild,
  removeSpouse,
  updatePerson,
} from "./mutations";
import { buildRelations } from "./relations";
import { getFamilyData } from "./family-data";
import type { PersonInput } from "./validation";

const input = (firstName: string): PersonInput => ({
  firstName,
  lastName: "ZzTest",
  birthDate: null,
  birthPlace: null,
  deathDate: null,
  deathPlace: null,
  bio: null,
});

// Creates and removes its own "ZzTest" people; never touches the seeded family.
describe.skipIf(!process.env.DATABASE_URL)("mutations against the database", () => {
  afterAll(async () => {
    await getDb().person.deleteMany({ where: { lastName: "ZzTest" } });
    await getDb().$disconnect();
  });

  it("creates, updates and deletes a person", async () => {
    const id = await createPerson(input("Solo"));
    await updatePerson(id, { ...input("Solo"), bio: "Updated", birthDate: "1990-02" });
    const found = (await getFamilyData()).people.find((p) => p.id === id);
    expect(found).toMatchObject({ bio: "Updated", birthDate: "1990-02" });
    await deletePerson(id);
    expect((await getFamilyData()).people.some((p) => p.id === id)).toBe(false);
    await expect(deletePerson(id)).rejects.toBeInstanceOf(UserError);
  });

  it("enforces relationship rules and supports half-siblings and multiple spouses", async () => {
    const [dad, mom1, mom2, k1, k2] = await Promise.all(["Dad", "Mom1", "Mom2", "K1", "K2"].map((n) => createPerson(input(n))));

    await expect(addParentChild(dad, dad)).rejects.toThrow(/own parent/);
    await addParentChild(dad, k1);
    await addParentChild(mom1, k1);
    await addParentChild(dad, k2);
    await addParentChild(mom2, k2);
    await expect(addParentChild(dad, k1)).rejects.toThrow(/already exists/);
    await expect(addParentChild(k1, dad)).rejects.toThrow(/ancestor/);

    await addSpouse(dad, mom1);
    await addSpouse(mom2, dad);
    await expect(addSpouse(mom1, dad)).rejects.toThrow(/already exists/);
    await expect(addSpouse(dad, dad)).rejects.toThrow(/own spouse/);

    const rel = buildRelations(await getFamilyData());
    expect(rel.get(dad)!.spouses.sort()).toEqual([mom1, mom2].sort());
    expect(rel.get(k1)!.siblings).toEqual([k2]);

    await removeSpouse(mom1, dad);
    await removeParentChild(mom1, k1);
    const after = buildRelations(await getFamilyData());
    expect(after.get(dad)!.spouses).toEqual([mom2]);
    expect(after.get(k1)!.parents).toEqual([dad]);
  });

  it("deleting a person removes their links", async () => {
    const [p, c] = await Promise.all([createPerson(input("P")), createPerson(input("C"))]);
    await addParentChild(p, c);
    await deletePerson(p);
    expect(await getDb().parentChild.count({ where: { childId: c } })).toBe(0);
  });
});
