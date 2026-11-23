import { describe, expect, it } from "vitest";
import { sampleFamily } from "./sample-data";
import { family, person } from "./test-helpers";
import { CARD_HEIGHT, CARD_WIDTH, layoutFamily, type FamilyLayout } from "./tree-layout";

const at = (l: FamilyLayout, id: string) => l.persons.find((p) => p.id === id)!;
const centerX = (l: FamilyLayout, id: string) => at(l, id).x + CARD_WIDTH / 2;

function expectNoOverlaps(l: FamilyLayout) {
  for (const a of l.persons) {
    for (const b of l.persons) {
      if (a.id >= b.id || a.y !== b.y) continue;
      expect(Math.abs(a.x - b.x), `${a.id} overlaps ${b.id}`).toBeGreaterThanOrEqual(CARD_WIDTH);
    }
  }
}

function expectConsistent(l: FamilyLayout) {
  const ids = new Set([...l.persons.map((p) => p.id), ...l.junctions.map((j) => j.id)]);
  for (const e of l.edges) {
    expect(ids.has(e.source), e.id).toBe(true);
    expect(ids.has(e.target), e.id).toBe(true);
  }
  expectNoOverlaps(l);
}

describe("layoutFamily basics", () => {
  it("handles an empty family", () => {
    const l = layoutFamily({ people: [], parentChild: [], spouses: [] });
    expect(l.persons).toEqual([]);
    expect(l.generations).toEqual([]);
  });

  it("puts spouses on the same row, side by side, and children one row below", () => {
    const l = layoutFamily(
      family([person("a", "1950"), person("b", "1952"), person("c", "1980")], {
        spouses: [["a", "b"]],
        children: [[["a", "b"], ["c"]]],
      }),
    );
    expect(at(l, "a").y).toBe(at(l, "b").y);
    expect(Math.abs(at(l, "a").x - at(l, "b").x)).toBeGreaterThan(CARD_WIDTH);
    expect(at(l, "c").y).toBe(at(l, "a").y + CARD_HEIGHT + 130);
    expect(at(l, "c").generation).toBe(1);
    // the child hangs from a junction between its parents, centred under them
    expect(l.junctions).toHaveLength(1);
    expect(centerX(l, "c")).toBeCloseTo((centerX(l, "a") + centerX(l, "b")) / 2, 0);
  });

  it("is deterministic", () => {
    expect(layoutFamily(sampleFamily)).toEqual(layoutFamily(sampleFamily));
  });

  it("does not hang or overlap on cyclic data", () => {
    const l = layoutFamily(
      family([person("a"), person("b"), person("c")], {
        children: [[["a"], ["b"]], [["b"], ["c"]], [["c"], ["a"]]],
      }),
    );
    expect(l.persons).toHaveLength(3);
    expectNoOverlaps(l);
  });
});

describe("sibling ordering", () => {
  const data = family(
    [person("p", "1950"), person("q", "1952"), person("late", "1990"), person("early", "1980"), person("mid", "1985-06"), person("nodate"), person("alsonodate")],
    {
      spouses: [["p", "q"]],
      children: [[["p", "q"], ["nodate", "late", "alsonodate", "early", "mid"]]],
    },
  );
  const l = layoutFamily(data);

  it("orders siblings left to right by birth date, undated last", () => {
    const order = l.persons.filter((p) => p.generation === 1).sort((a, b) => a.x - b.x).map((p) => p.id);
    expect(order).toEqual(["early", "mid", "late", "alsonodate", "nodate"]);
  });

  it("keeps the order for grandchildren (subtrees move with their parents)", () => {
    const d = family(
      [person("g", "1920"), person("a", "1950"), person("b", "1955"), person("a1", "1980"), person("b1", "1985")],
      {
        children: [
          [["g"], ["b", "a"]],
          [["a"], ["a1"]],
          [["b"], ["b1"]],
        ],
      },
    );
    const r = layoutFamily(d);
    expect(at(r, "a").x).toBeLessThan(at(r, "b").x);
    expect(at(r, "a1").x).toBeLessThan(at(r, "b1").x);
    expect(centerX(r, "a1")).toBeCloseTo(centerX(r, "a"), 0);
    expectNoOverlaps(r);
  });
});

describe("multiple spouses", () => {
  it("keeps a serial-marriage chain linear with every couple adjacent", () => {
    const l = layoutFamily(
      family([person("a", "1940"), person("b", "1942"), person("c", "1945"), person("d", "1950")], {
        spouses: [["a", "b"], ["b", "c"], ["c", "d"]],
      }),
    );
    const row = l.persons.sort((p, q) => p.x - q.x).map((p) => p.id);
    expect(row).toHaveLength(4);
    const spouseEdges = l.edges.filter((e) => e.kind === "spouse");
    expect(spouseEdges).toHaveLength(3);
    expect(spouseEdges.every((e) => !e.arc)).toBe(true);
    for (const e of spouseEdges) {
      expect(Math.abs(row.indexOf(e.source) - row.indexOf(e.target))).toBe(1);
    }
    expectConsistent(l);
  });

  it("clusters half siblings under the right parent pair, each group in birth order", () => {
    const l = layoutFamily(
      family(
        [person("first", "1920"), person("dad", "1920"), person("second", "1925"), person("h1", "1946"), person("h2", "1950"), person("f1", "1952"), person("f2", "1956")],
        {
          spouses: [["dad", "first"], ["dad", "second"]],
          children: [
            [["dad", "second"], ["f2", "f1"]],
            [["dad", "first"], ["h2", "h1"]],
          ],
        },
      ),
    );
    const unit = l.persons.filter((p) => p.generation === 0).sort((a, b) => a.x - b.x).map((p) => p.id);
    expect(unit).toEqual(["first", "dad", "second"]);
    const kids = l.persons.filter((p) => p.generation === 1).sort((a, b) => a.x - b.x).map((p) => p.id);
    expect(kids).toEqual(["h1", "h2", "f1", "f2"]);
    expect(l.junctions).toHaveLength(2);
    expectConsistent(l);
  });

  it("draws an arc for a third spouse who cannot sit next to the hub", () => {
    const l = layoutFamily(
      family([person("hub", "1950"), person("s1", "1951"), person("s2", "1955"), person("s3", "1960"), person("kid", "1985")], {
        spouses: [["hub", "s1"], ["hub", "s2"], ["hub", "s3"]],
        children: [[["hub", "s3"], ["kid"]]],
      }),
    );
    const spouseEdges = l.edges.filter((e) => e.kind === "spouse");
    expect(spouseEdges).toHaveLength(3);
    expect(spouseEdges.filter((e) => e.arc)).toHaveLength(1);
    // children of a non-adjacent pair connect to both parents directly
    const kidEdges = l.edges.filter((e) => e.target === "kid");
    expect(kidEdges.map((e) => e.source).sort()).toEqual(["hub", "s3"]);
    expectConsistent(l);
  });

  it("keeps an in-law's own parents on their own branch without overlap", () => {
    const l = layoutFamily(
      family(
        [person("gp", "1920"), person("a", "1950"), person("b", "1952"), person("inlaw", "1951"), person("rp", "1925"), person("kid", "1980")],
        {
          spouses: [["a", "inlaw"]],
          children: [
            [["gp"], ["a", "b"]],
            [["rp"], ["inlaw"]],
            [["a", "inlaw"], ["kid"]],
          ],
        },
      ),
    );
    expect(at(l, "rp").generation).toBe(at(l, "gp").generation);
    expect(at(l, "kid").generation).toBe(2);
    expectConsistent(l);
  });
});

describe("sample family", () => {
  const l = layoutFamily(sampleFamily);

  it("places every person exactly once without overlaps", () => {
    expect(l.persons).toHaveLength(sampleFamily.people.length);
    expectConsistent(l);
  });

  it("always places children below their parents", () => {
    for (const { parentId, childId } of sampleFamily.parentChild) {
      expect(at(l, childId).generation).toBeGreaterThan(at(l, parentId).generation);
    }
  });

  it("reports generation rows covering everyone", () => {
    const covered = l.generations.flatMap((g) => g.personIds);
    expect(new Set(covered).size).toBe(sampleFamily.people.length);
    expect(l.generations).toHaveLength(5);
  });

  it("orders full siblings by birth date", () => {
    const birth = new Map(sampleFamily.people.map((p) => [p.id, p.birthDate ?? "9999"]));
    const groups = new Map<string, string[]>();
    for (const { parentId, childId } of sampleFamily.parentChild) {
      groups.set(parentId, [...(groups.get(parentId) ?? []), childId]);
    }
    for (const kids of groups.values()) {
      const byX = [...kids].sort((a, b) => at(l, a).x - at(l, b).x);
      // children sharing every parent (full siblings) must be in birth order
      const sameParents = (a: string, b: string) =>
        JSON.stringify(sampleFamily.parentChild.filter((p) => p.childId === a).map((p) => p.parentId).sort()) ===
        JSON.stringify(sampleFamily.parentChild.filter((p) => p.childId === b).map((p) => p.parentId).sort());
      for (let i = 0; i < byX.length; i++) {
        for (let j = i + 1; j < byX.length; j++) {
          if (sameParents(byX[i], byX[j])) expect(birth.get(byX[i])! <= birth.get(byX[j])!, `${byX[i]} before ${byX[j]}`).toBe(true);
        }
      }
    }
  });
});
