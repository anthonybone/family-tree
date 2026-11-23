import type { FamilyData } from "./types";
import { compareByBirth } from "./person-utils";

export interface Relations {
  parents: string[];
  children: string[];
  spouses: string[];
  siblings: string[];
}

/** Builds per-person relations; children, siblings, parents and spouses are ordered by birth date. */
export function buildRelations(data: FamilyData): Map<string, Relations> {
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const map = new Map<string, Relations>();
  for (const p of data.people) {
    map.set(p.id, { parents: [], children: [], spouses: [], siblings: [] });
  }
  const add = (list: string[] | undefined, id: string) => {
    if (list && !list.includes(id)) list.push(id);
  };
  for (const { parentId, childId } of data.parentChild) {
    if (!byId.has(parentId) || !byId.has(childId)) continue;
    add(map.get(childId)?.parents, parentId);
    add(map.get(parentId)?.children, childId);
  }
  for (const { personAId, personBId } of data.spouses) {
    if (!byId.has(personAId) || !byId.has(personBId) || personAId === personBId) continue;
    add(map.get(personAId)?.spouses, personBId);
    add(map.get(personBId)?.spouses, personAId);
  }
  for (const [id, rel] of map) {
    const sibs = new Set<string>();
    for (const parent of rel.parents) {
      for (const c of map.get(parent)?.children ?? []) if (c !== id) sibs.add(c);
    }
    rel.siblings = [...sibs];
  }
  const byBirth = (x: string, y: string) => compareByBirth(byId.get(x)!, byId.get(y)!);
  for (const rel of map.values()) {
    rel.parents.sort(byBirth);
    rel.children.sort(byBirth);
    rel.spouses.sort(byBirth);
    rel.siblings.sort(byBirth);
  }
  return map;
}

/** Ancestors, descendants, and spouses of the focus person (including itself). */
export function lineageOf(id: string, relations: Map<string, Relations>): Set<string> {
  const result = new Set<string>([id]);
  const walk = (start: string, key: "parents" | "children") => {
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const next of relations.get(cur)?.[key] ?? []) {
        if (!result.has(next)) {
          result.add(next);
          stack.push(next);
        }
      }
    }
  };
  walk(id, "parents");
  walk(id, "children");
  for (const s of relations.get(id)?.spouses ?? []) result.add(s);
  return result;
}
