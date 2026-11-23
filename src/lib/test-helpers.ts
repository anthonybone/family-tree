import type { FamilyData, Person } from "./types";

/** Compact builders for test families. */
export function person(id: string, birth?: string, extra: Partial<Person> = {}): Person {
  return { id, firstName: id[0].toUpperCase() + id.slice(1), lastName: "Test", birthDate: birth, ...extra };
}

export function family(
  people: Person[],
  opts: { spouses?: [string, string][]; children?: [string[], string[]][] },
): FamilyData {
  return {
    people,
    spouses: (opts.spouses ?? []).map(([personAId, personBId]) => ({ personAId, personBId })),
    parentChild: (opts.children ?? []).flatMap(([parents, kids]) =>
      kids.flatMap((childId) => parents.map((parentId) => ({ parentId, childId }))),
    ),
  };
}
