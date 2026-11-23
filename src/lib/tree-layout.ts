import { compareByBirth } from "./person-utils";
import type { FamilyData, Person } from "./types";

export const CARD_WIDTH = 232;
export const CARD_HEIGHT = 92;
export const JUNCTION_SIZE = 10;
const SPOUSE_GAP = 56;
const SIBLING_GAP = 48;
const BRANCH_GAP = 110;
const RANK_SEP = 130;
const MARGIN = 40;
const SWEEPS = 16;

export interface PersonNode {
  kind: "person";
  id: string;
  x: number;
  y: number;
  /** Zero-based row of the tree this person sits in. */
  generation: number;
}

export interface JunctionNode {
  kind: "junction";
  id: string;
  x: number;
  y: number;
  parents: [string, string];
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  kind: "spouse" | "child";
  /** Spouse edge between non-neighbouring cards; drawn as an arc over the row. */
  arc?: boolean;
  /** Person ids this edge represents, used for highlighting. */
  persons: string[];
}

export interface GenerationRow {
  index: number;
  y: number;
  personIds: string[];
}

export interface FamilyLayout {
  persons: PersonNode[];
  junctions: JunctionNode[];
  edges: LayoutEdge[];
  generations: GenerationRow[];
  width: number;
  height: number;
}

interface Link {
  parentUnit: number;
  childUnit: number;
  /** Attachment point on the parent unit, as an offset from its left edge. */
  parentOffset: number;
  /** Centre of the child's card, as an offset from its unit's left edge. */
  childOffset: number;
}

const cardCenter = (index: number) => index * (CARD_WIDTH + SPOUSE_GAP) + CARD_WIDTH / 2;

/** Least-squares placement of ordered items that keeps minimum gaps (pool-adjacent-violators). */
function placeRank(desired: number[], weights: number[], seps: number[]): number[] {
  const offsets: number[] = [];
  desired.forEach((_, i) => offsets.push(i === 0 ? 0 : offsets[i - 1] + seps[i]));
  const blocks: { sum: number; weight: number; count: number }[] = [];
  desired.forEach((d, i) => {
    blocks.push({ sum: (d - offsets[i]) * weights[i], weight: weights[i], count: 1 });
    while (blocks.length > 1) {
      const last = blocks[blocks.length - 1];
      const prev = blocks[blocks.length - 2];
      if (prev.sum / prev.weight <= last.sum / last.weight) break;
      blocks.splice(blocks.length - 2, 2, {
        sum: prev.sum + last.sum,
        weight: prev.weight + last.weight,
        count: prev.count + last.count,
      });
    }
  });
  const result: number[] = [];
  for (const b of blocks) {
    for (let k = 0; k < b.count; k++) result.push(b.sum / b.weight + offsets[result.length]);
  }
  return result;
}

/**
 * Lays a family out as "units" (a person plus their spouses) arranged by generation.
 * Children are ordered by parent pair, then birth date (undated last); positions are
 * refined so parents sit over their children and spouses stay side by side.
 */
export function layoutFamily(data: FamilyData): FamilyLayout {
  const byId = new Map<string, Person>(data.people.map((p) => [p.id, p]));
  const sorted = [...data.people].sort(compareByBirth);

  const spouseAdj = new Map<string, string[]>(sorted.map((p) => [p.id, []]));
  for (const s of data.spouses) {
    const a = spouseAdj.get(s.personAId);
    const b = spouseAdj.get(s.personBId);
    if (!a || !b || s.personAId === s.personBId || a.includes(s.personBId)) continue;
    a.push(s.personBId);
    b.push(s.personAId);
  }
  for (const list of spouseAdj.values()) list.sort((x, y) => compareByBirth(byId.get(x)!, byId.get(y)!));

  // Units: connected spouse groups, walked from an end of the chain so chains stay linear.
  const unitOf = new Map<string, number>();
  const units: string[][] = [];
  for (const p of sorted) {
    if (unitOf.has(p.id)) continue;
    const comp: string[] = [];
    const seen = new Set([p.id]);
    const queue = [p.id];
    while (queue.length) {
      const cur = queue.pop()!;
      comp.push(cur);
      for (const n of spouseAdj.get(cur)!) {
        if (seen.has(n)) continue;
        seen.add(n);
        queue.push(n);
      }
    }
    comp.sort((x, y) => compareByBirth(byId.get(x)!, byId.get(y)!));
    const start = comp.reduce((a, b) => (spouseAdj.get(b)!.length < spouseAdj.get(a)!.length ? b : a));
    const order: string[] = [];
    const visited = new Set<string>();
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      order.push(cur);
      for (const n of [...spouseAdj.get(cur)!].reverse()) if (!visited.has(n)) stack.push(n);
    }
    units.push(order);
    order.forEach((id) => unitOf.set(id, units.length - 1));
  }
  const U = units.length;
  const unitWidth = units.map((u) => u.length * CARD_WIDTH + (u.length - 1) * SPOUSE_GAP);
  const indexInUnit = (id: string) => units[unitOf.get(id)!].indexOf(id);

  const parentsOf = new Map<string, string[]>();
  for (const pc of data.parentChild) {
    if (!byId.has(pc.parentId) || !byId.has(pc.childId) || pc.parentId === pc.childId) continue;
    const list = parentsOf.get(pc.childId) ?? [];
    if (!list.includes(pc.parentId)) list.push(pc.parentId);
    parentsOf.set(pc.childId, list);
  }

  // Unit graph and attachment links.
  const parentUnits: Set<number>[] = units.map(() => new Set());
  const childUnits: Set<number>[] = units.map(() => new Set());
  const links: Link[] = [];
  for (const child of sorted) {
    const parents = parentsOf.get(child.id) ?? [];
    const cu = unitOf.get(child.id)!;
    const byUnit = new Map<number, string[]>();
    for (const pid of parents) {
      const pu = unitOf.get(pid)!;
      if (pu === cu) continue;
      byUnit.set(pu, [...(byUnit.get(pu) ?? []), pid]);
    }
    for (const [pu, pids] of byUnit) {
      parentUnits[cu].add(pu);
      childUnits[pu].add(cu);
      links.push({
        parentUnit: pu,
        childUnit: cu,
        parentOffset: pids.reduce((s, id) => s + cardCenter(indexInUnit(id)), 0) / pids.length,
        childOffset: cardCenter(indexInUnit(child.id)),
      });
    }
  }

  // Generations: longest path from the top; parentless units sink toward their children.
  const rank = new Array<number>(U).fill(0);
  for (let pass = 0; pass <= U; pass++) {
    let changed = false;
    for (let c = 0; c < U; c++) {
      for (const p of parentUnits[c]) {
        if (rank[c] < rank[p] + 1) {
          rank[c] = rank[p] + 1;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (let u = 0; u < U; u++) {
    if (parentUnits[u].size === 0 && childUnits[u].size > 0) {
      rank[u] = Math.min(...[...childUnits[u]].map((c) => rank[c])) - 1;
    }
  }
  const usedRanks = [...new Set(rank)].sort((a, b) => a - b);
  const generationOf = rank.map((r) => usedRanks.indexOf(r));
  const R = usedRanks.length;

  // Primary parent unit: the one with its own parents, then the larger family, then the older.
  const unitBirthPerson = (u: number) => byId.get(units[u].slice().sort((a, b) => compareByBirth(byId.get(a)!, byId.get(b)!))[0])!;
  const primary: (number | undefined)[] = units.map((_, u) => {
    const candidates = [...parentUnits[u]];
    if (!candidates.length) return undefined;
    candidates.sort(
      (a, b) =>
        Number(parentUnits[b].size > 0) - Number(parentUnits[a].size > 0) ||
        childUnits[b].size - childUnits[a].size ||
        compareByBirth(unitBirthPerson(a), unitBirthPerson(b)) ||
        a - b,
    );
    return candidates[0];
  });
  const primaryKids: number[][] = units.map(() => []);
  primary.forEach((p, u) => p !== undefined && primaryKids[p].push(u));

  // Sibling order key: where the parents stand in the unit, then the child's birth date.
  const kidSortInfo = (parent: number, kid: number) => {
    let best: { pos: number; person: Person } | undefined;
    for (const member of units[kid]) {
      const idx = (parentsOf.get(member) ?? [])
        .filter((pid) => unitOf.get(pid) === parent)
        .map(indexInUnit);
      if (!idx.length) continue;
      const pos = idx.reduce((a, b) => a + b, 0) / idx.length;
      const person = byId.get(member)!;
      if (!best || pos < best.pos || (pos === best.pos && compareByBirth(person, best.person) < 0)) {
        best = { pos, person };
      }
    }
    return best ?? { pos: 0, person: unitBirthPerson(kid) };
  };
  for (let p = 0; p < U; p++) {
    const info = new Map(primaryKids[p].map((k) => [k, kidSortInfo(p, k)]));
    primaryKids[p].sort((a, b) => {
      const ia = info.get(a)!;
      const ib = info.get(b)!;
      return ia.pos - ib.pos || compareByBirth(ia.person, ib.person) || a - b;
    });
  }

  // Depth-first order gives every generation a left-to-right order consistent with its parents.
  const key = new Array<number>(U).fill(NaN);
  let counter = 0;
  const visit = (u: number) => {
    if (!Number.isNaN(key[u])) return;
    key[u] = counter++;
    primaryKids[u].forEach(visit);
  };
  const roots = units.map((_, u) => u).filter((u) => primary[u] === undefined);
  const attached = roots.filter((u) => primaryKids[u].length === 0 && childUnits[u].size > 0);
  roots.filter((u) => !attached.includes(u)).forEach(visit);
  units.forEach((_, u) => visit(u));
  // In-law roots sit just before the first of their children's family branch.
  for (const u of attached) key[u] = Math.min(...[...childUnits[u]].map((c) => key[c])) - 0.5;

  const rows: number[][] = Array.from({ length: R }, () => []);
  units.forEach((_, u) => rows[generationOf[u]].push(u));
  rows.forEach((row) => row.sort((a, b) => key[a] - key[b] || a - b));

  const sepBetween = (a: number, b: number) =>
    (unitWidth[a] + unitWidth[b]) / 2 + (primary[a] !== undefined && primary[a] === primary[b] ? SIBLING_GAP : BRANCH_GAP);

  const x = new Array<number>(U).fill(0);
  for (const row of rows) {
    let cursor = 0;
    row.forEach((u, i) => {
      cursor += i === 0 ? 0 : sepBetween(row[i - 1], u);
      x[u] = cursor;
    });
  }

  const inLinks: Link[][] = units.map(() => []);
  const outLinks: Link[][] = units.map(() => []);
  for (const l of links) {
    inLinks[l.childUnit].push(l);
    outLinks[l.parentUnit].push(l);
  }
  const settle = (row: number[], down: boolean) => {
    const desired: number[] = [];
    const weights: number[] = [];
    const seps: number[] = [];
    row.forEach((u, i) => {
      const ls = down ? inLinks[u] : outLinks[u];
      if (ls.length) {
        desired.push(
          ls.reduce(
            (s, l) =>
              s +
              (down
                ? x[l.parentUnit] - unitWidth[l.parentUnit] / 2 + l.parentOffset - l.childOffset + unitWidth[u] / 2
                : x[l.childUnit] - unitWidth[l.childUnit] / 2 + l.childOffset - l.parentOffset + unitWidth[u] / 2),
            0,
          ) / ls.length,
        );
        weights.push(ls.length);
      } else {
        desired.push(x[u]);
        weights.push(0.2);
      }
      seps.push(i === 0 ? 0 : sepBetween(row[i - 1], u));
    });
    placeRank(desired, weights, seps).forEach((nx, i) => (x[row[i]] = nx));
  };
  for (let i = 0; i < SWEEPS; i++) {
    for (let r = 1; r < R; r++) settle(rows[r], true);
    for (let r = R - 2; r >= 0; r--) settle(rows[r], false);
  }

  const minLeft = Math.min(...units.map((_, u) => x[u] - unitWidth[u] / 2), 0);
  const shift = MARGIN - (units.length ? minLeft : 0);
  const rowY = (g: number) => MARGIN + g * (CARD_HEIGHT + RANK_SEP);

  const pos = new Map<string, { x: number; y: number; generation: number }>();
  units.forEach((u, ui) => {
    const left = x[ui] - unitWidth[ui] / 2 + shift;
    u.forEach((id, j) =>
      pos.set(id, { x: left + j * (CARD_WIDTH + SPOUSE_GAP), y: rowY(generationOf[ui]), generation: generationOf[ui] }),
    );
  });

  const persons: PersonNode[] = sorted.map((p) => ({ kind: "person", id: p.id, ...pos.get(p.id)! }));
  const junctions = new Map<string, JunctionNode>();
  const edges: LayoutEdge[] = [];

  const adjacent = new Set<string>();
  for (const u of units) {
    for (let j = 0; j < u.length - 1; j++) {
      if (!spouseAdj.get(u[j])!.includes(u[j + 1])) continue;
      adjacent.add(`${u[j]}|${u[j + 1]}`);
      adjacent.add(`${u[j + 1]}|${u[j]}`);
      edges.push({ id: `s:${u[j]}:${u[j + 1]}`, source: u[j], target: u[j + 1], kind: "spouse", persons: [u[j], u[j + 1]] });
    }
  }
  // Spouses that cannot be neighbours (e.g. three or more spouses) get an arc over the row.
  for (const u of units) {
    for (let a = 0; a < u.length; a++) {
      for (let b = a + 2; b < u.length; b++) {
        if (!spouseAdj.get(u[a])!.includes(u[b])) continue;
        edges.push({ id: `s:${u[a]}:${u[b]}`, source: u[a], target: u[b], kind: "spouse", arc: true, persons: [u[a], u[b]] });
      }
    }
  }

  for (const child of sorted) {
    const parents = parentsOf.get(child.id) ?? [];
    const pair =
      parents.length === 2 && adjacent.has(`${parents[0]}|${parents[1]}`)
        ? ([...parents].sort((a, b) => pos.get(a)!.x - pos.get(b)!.x) as [string, string])
        : null;
    if (pair) {
      const jid = `j:${pair[0]}:${pair[1]}`;
      if (!junctions.has(jid)) {
        const left = pos.get(pair[0])!;
        junctions.set(jid, {
          kind: "junction",
          id: jid,
          x: left.x + CARD_WIDTH + SPOUSE_GAP / 2 - JUNCTION_SIZE / 2,
          y: left.y + CARD_HEIGHT / 2 - JUNCTION_SIZE / 2,
          parents: pair,
        });
      }
      edges.push({ id: `c:${jid}:${child.id}`, source: jid, target: child.id, kind: "child", persons: [...pair, child.id] });
    } else {
      for (const parent of parents) {
        edges.push({ id: `c:${parent}:${child.id}`, source: parent, target: child.id, kind: "child", persons: [parent, child.id] });
      }
    }
  }

  const generations: GenerationRow[] = Array.from({ length: R }, (_, index) => ({
    index,
    y: rowY(index),
    personIds: persons.filter((p) => p.generation === index).map((p) => p.id),
  }));
  const width = persons.length ? Math.max(...persons.map((p) => p.x)) + CARD_WIDTH + MARGIN : 0;
  const height = R ? rowY(R - 1) + CARD_HEIGHT + MARGIN : 0;

  return { persons, junctions: [...junctions.values()], edges, generations, width, height };
}
