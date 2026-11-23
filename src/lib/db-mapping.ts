import type { FamilyData, ParentChild, Person, Spouse } from "./types";

/**
 * Pure mapping between the app's FamilyData shape and database rows
 * (see prisma/schema.prisma). No Prisma import, so it is testable and the seed
 * script / data-access layer can share it in the next stage.
 */

export interface PersonRow {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  bio: string | null;
}

export interface PhotoRow {
  personId: string;
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

export interface ParentChildRow {
  parentId: string;
  childId: string;
}

export interface SpouseRow {
  personAId: string;
  personBId: string;
}

export interface DbRows {
  people: PersonRow[];
  photos: PhotoRow[];
  parentChild: ParentChildRow[];
  spouses: SpouseRow[];
}

/** Spouse pairs are stored with the smaller id first (DB CHECK personAId < personBId). */
export function canonicalSpousePair(a: string, b: string): SpouseRow {
  if (a === b) throw new Error(`A person cannot be their own spouse: ${a}`);
  return a < b ? { personAId: a, personBId: b } : { personAId: b, personBId: a };
}

/** Converts app data to rows: dedupes edges, canonicalizes spouses, drops dangling or self links. */
export function toDbRows(data: FamilyData): DbRows {
  const ids = new Set(data.people.map((p) => p.id));

  const people = data.people.map(
    (p): PersonRow => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate ?? null,
      birthPlace: p.birthPlace ?? null,
      deathDate: p.deathDate ?? null,
      deathPlace: p.deathPlace ?? null,
      bio: p.bio ?? null,
    }),
  );

  const pc = new Map<string, ParentChildRow>();
  for (const { parentId, childId } of data.parentChild) {
    if (parentId === childId || !ids.has(parentId) || !ids.has(childId)) continue;
    pc.set(`${parentId}>${childId}`, { parentId, childId });
  }

  const sp = new Map<string, SpouseRow>();
  for (const { personAId, personBId } of data.spouses) {
    if (personAId === personBId || !ids.has(personAId) || !ids.has(personBId)) continue;
    const pair = canonicalSpousePair(personAId, personBId);
    sp.set(`${pair.personAId}+${pair.personBId}`, pair);
  }

  return { people, photos: [], parentChild: [...pc.values()], spouses: [...sp.values()] };
}

/** Converts rows back to app data; a person's photo URL comes from their Photo row. */
export function fromDbRows(rows: DbRows): FamilyData {
  const photoUrl = new Map(rows.photos.map((ph) => [ph.personId, ph.url]));
  const people = rows.people.map((r): Person => {
    const p: Person = { id: r.id, firstName: r.firstName, lastName: r.lastName };
    if (r.birthDate) p.birthDate = r.birthDate;
    if (r.deathDate) p.deathDate = r.deathDate;
    if (r.birthPlace) p.birthPlace = r.birthPlace;
    if (r.deathPlace) p.deathPlace = r.deathPlace;
    if (r.bio) p.bio = r.bio;
    const url = photoUrl.get(r.id);
    if (url) p.photoUrl = url;
    return p;
  });
  const parentChild: ParentChild[] = rows.parentChild.map(({ parentId, childId }) => ({ parentId, childId }));
  const spouses: Spouse[] = rows.spouses.map(({ personAId, personBId }) => ({ personAId, personBId }));
  return { people, parentChild, spouses };
}

/** True if adding parent -> child would make child an ancestor of itself. */
export function wouldCreateCycle(edges: ParentChildRow[], parentId: string, childId: string): boolean {
  if (parentId === childId) return true;
  const kids = new Map<string, string[]>();
  for (const e of edges) kids.set(e.parentId, [...(kids.get(e.parentId) ?? []), e.childId]);
  const seen = new Set<string>();
  const stack = [childId];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === parentId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(kids.get(id) ?? []));
  }
  return false;
}
