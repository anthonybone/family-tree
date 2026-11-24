import { Prisma } from "@/generated/prisma/client";
import { getDb } from "./db";
import { canonicalSpousePair, wouldCreateCycle } from "./db-mapping";
import type { PersonInput } from "./validation";

/** An error whose message is safe and useful to show to the administrator. */
export class UserError extends Error {}

const serializable = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

function mapDbError(error: unknown): never {
  if (error instanceof UserError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new UserError("That relationship already exists.");
    if (error.code === "P2003" || error.code === "P2025") throw new UserError("That person no longer exists.");
    if (error.code === "P2034") throw new UserError("The tree changed at the same time. Please try again.");
  }
  throw error;
}

async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return mapDbError(error);
  }
}

export const createPerson = (data: PersonInput) =>
  guarded(async () => (await getDb().person.create({ data })).id);

export const updatePerson = (id: string, data: PersonInput) =>
  guarded(async () => void (await getDb().person.update({ where: { id }, data })));

export const deletePerson = (id: string) =>
  guarded(async () => {
    const { count } = await getDb().person.deleteMany({ where: { id } });
    if (count === 0) throw new UserError("That person no longer exists.");
  });

export const addParentChild = (parentId: string, childId: string) =>
  guarded(() => {
    if (parentId === childId) throw new UserError("A person cannot be their own parent.");
    return getDb().$transaction(async (tx) => {
      const found = await tx.person.count({ where: { id: { in: [parentId, childId] } } });
      if (found !== 2) throw new UserError("That person no longer exists.");
      const edges = await tx.parentChild.findMany({ select: { parentId: true, childId: true } });
      if (edges.some((e) => e.parentId === parentId && e.childId === childId)) {
        throw new UserError("That parent-child relationship already exists.");
      }
      if (wouldCreateCycle(edges, parentId, childId)) {
        throw new UserError("That would make someone their own ancestor.");
      }
      await tx.parentChild.create({ data: { parentId, childId } });
    }, serializable);
  });

export const removeParentChild = (parentId: string, childId: string) =>
  guarded(async () => void (await getDb().parentChild.deleteMany({ where: { parentId, childId } })));

export const addSpouse = (a: string, b: string) =>
  guarded(async () => {
    if (a === b) throw new UserError("A person cannot be their own spouse.");
    const pair = canonicalSpousePair(a, b);
    await getDb().spouseRelationship.create({ data: pair });
  });

export const removeSpouse = (a: string, b: string) =>
  guarded(async () => {
    if (a === b) return;
    await getDb().spouseRelationship.deleteMany({ where: canonicalSpousePair(a, b) });
  });
