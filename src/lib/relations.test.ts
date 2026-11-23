import { describe, expect, it } from "vitest";
import { compareByBirth } from "./person-utils";
import { buildRelations, lineageOf } from "./relations";
import { family, person } from "./test-helpers";

describe("compareByBirth", () => {
  it("orders oldest first and puts undated people last", () => {
    const people = [person("zed"), person("b", "1990-05-01"), person("a", "1985"), person("ann")];
    expect(people.sort(compareByBirth).map((p) => p.id)).toEqual(["a", "b", "ann", "zed"]);
  });

  it("treats a year as earlier than a full date in the same year", () => {
    expect(compareByBirth(person("a", "1990"), person("b", "1990-03-01"))).toBeLessThan(0);
  });
});

describe("buildRelations", () => {
  const data = family(
    [person("dad", "1950"), person("mum", "1952"), person("ex", "1951"), person("c3"), person("c1", "1980"), person("c2", "1985"), person("half", "1975")],
    {
      spouses: [["dad", "mum"], ["dad", "ex"]],
      children: [
        [["dad", "mum"], ["c3", "c2", "c1"]],
        [["dad", "ex"], ["half"]],
      ],
    },
  );
  const rel = buildRelations(data);

  it("sorts children by birth date with undated last", () => {
    expect(rel.get("dad")!.children).toEqual(["half", "c1", "c2", "c3"]);
  });

  it("includes half siblings and excludes the person themself", () => {
    expect(rel.get("c1")!.siblings).toEqual(["half", "c2", "c3"]);
    expect(rel.get("half")!.siblings).toEqual(["c1", "c2", "c3"]);
  });

  it("supports multiple spouses, sorted by birth", () => {
    expect(rel.get("dad")!.spouses).toEqual(["ex", "mum"]);
    expect(rel.get("ex")!.spouses).toEqual(["dad"]);
  });

  it("ignores duplicate and dangling relationships", () => {
    const messy = family([person("a"), person("b")], {
      spouses: [["a", "b"], ["b", "a"], ["a", "ghost"], ["a", "a"]],
      children: [[["a"], ["b"]], [["a"], ["b"]], [["ghost"], ["b"]]],
    });
    const r = buildRelations(messy);
    expect(r.get("a")!.spouses).toEqual(["b"]);
    expect(r.get("b")!.parents).toEqual(["a"]);
  });
});

describe("lineageOf", () => {
  const data = family(
    [person("gp"), person("p"), person("uncle"), person("me"), person("sib"), person("spouse"), person("kid"), person("grandkid")],
    {
      spouses: [["me", "spouse"]],
      children: [
        [["gp"], ["p", "uncle"]],
        [["p"], ["me", "sib"]],
        [["me", "spouse"], ["kid"]],
        [["kid"], ["grandkid"]],
      ],
    },
  );

  it("returns ancestors, descendants and spouse but not collateral relatives", () => {
    const set = lineageOf("me", buildRelations(data));
    expect([...set].sort()).toEqual(["gp", "grandkid", "kid", "me", "p", "spouse"]);
  });

  it("terminates on malformed cyclic data", () => {
    const cyclic = family([person("a"), person("b")], { children: [[["a"], ["b"]], [["b"], ["a"]]] });
    expect([...lineageOf("a", buildRelations(cyclic))].sort()).toEqual(["a", "b"]);
  });
});
