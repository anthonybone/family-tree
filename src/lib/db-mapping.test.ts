import { describe, expect, it } from "vitest";
import { canonicalSpousePair, fromDbRows, toDbRows, wouldCreateCycle } from "./db-mapping";
import { buildRelations } from "./relations";
import { sampleFamily } from "./sample-data";
import { family, person } from "./test-helpers";

const PARTIAL_DATE = /^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$/;

describe("sample data vs database constraints", () => {
  const rows = toDbRows(sampleFamily);

  it("keeps all 56 people and every relationship", () => {
    expect(rows.people).toHaveLength(56);
    expect(rows.parentChild).toHaveLength(sampleFamily.parentChild.length);
    expect(rows.spouses).toHaveLength(sampleFamily.spouses.length);
  });

  it("satisfies the migration's CHECK and unique constraints", () => {
    const ids = new Set(rows.people.map((p) => p.id));
    expect(ids.size).toBe(rows.people.length);
    for (const p of rows.people) {
      for (const d of [p.birthDate, p.deathDate]) if (d) expect(d).toMatch(PARTIAL_DATE);
    }
    const pcKeys = rows.parentChild.map((e) => `${e.parentId}>${e.childId}`);
    expect(new Set(pcKeys).size).toBe(pcKeys.length);
    for (const e of rows.parentChild) {
      expect(e.parentId).not.toBe(e.childId);
      expect(ids.has(e.parentId) && ids.has(e.childId)).toBe(true);
    }
    for (const s of rows.spouses) expect(s.personAId < s.personBId).toBe(true);
    const spKeys = rows.spouses.map((s) => `${s.personAId}+${s.personBId}`);
    expect(new Set(spKeys).size).toBe(spKeys.length);
  });

  it("has no parent-child cycles", () => {
    const added: typeof rows.parentChild = [];
    for (const e of rows.parentChild) {
      expect(wouldCreateCycle(added, e.parentId, e.childId)).toBe(false);
      added.push(e);
    }
  });

  it("round-trips to identical relationships", () => {
    const back = fromDbRows(rows);
    expect(back.people).toEqual(sampleFamily.people);
    expect([...buildRelations(back)].map(([id, r]) => [id, r])).toEqual(
      [...buildRelations(sampleFamily)].map(([id, r]) => [id, r]),
    );
  });
});

describe("relationship mapping", () => {
  it("canonicalizes and dedupes spouse pairs, preserving multiple marriages", () => {
    const data = family([person("a"), person("b"), person("c")], {
      spouses: [["b", "a"], ["a", "b"], ["c", "a"]],
    });
    expect(toDbRows(data).spouses).toEqual([
      { personAId: "a", personBId: "b" },
      { personAId: "a", personBId: "c" },
    ]);
    expect(() => canonicalSpousePair("a", "a")).toThrow();
  });

  it("preserves half-siblings and people with unknown parents", () => {
    const data = family([person("p"), person("q"), person("r"), person("x"), person("y"), person("loner")], {
      children: [[["p", "q"], ["x"]], [["p", "r"], ["y"]]],
    });
    const rel = buildRelations(fromDbRows(toDbRows(data)));
    expect(rel.get("x")!.siblings).toEqual(["y"]);
    expect(rel.get("x")!.parents).toHaveLength(2);
    expect(rel.get("loner")!.parents).toEqual([]);
  });

  it("drops self links and links to unknown people", () => {
    const data = family([person("a"), person("b")], { spouses: [["a", "zzz"]] });
    data.parentChild.push({ parentId: "a", childId: "a" }, { parentId: "a", childId: "nope" });
    const rows = toDbRows(data);
    expect(rows.parentChild).toEqual([]);
    expect(rows.spouses).toEqual([]);
  });
});

describe("wouldCreateCycle", () => {
  const edges = [
    { parentId: "a", childId: "b" },
    { parentId: "b", childId: "c" },
  ];
  it("rejects self and ancestor loops", () => {
    expect(wouldCreateCycle(edges, "a", "a")).toBe(true);
    expect(wouldCreateCycle(edges, "c", "a")).toBe(true);
  });
  it("allows valid new edges", () => {
    expect(wouldCreateCycle(edges, "a", "c")).toBe(false);
    expect(wouldCreateCycle(edges, "d", "a")).toBe(false);
  });
});
