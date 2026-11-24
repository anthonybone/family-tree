import { describe, expect, it } from "vitest";
import { isValidPartialDate, parsePersonInput } from "./validation";

describe("date validation", () => {
  it("accepts partial and full real dates", () => {
    for (const d of ["1950", "1950-06", "1950-06-15", "2024-02-29"]) expect(isValidPartialDate(d)).toBe(true);
  });
  it("rejects impossible or malformed dates", () => {
    for (const d of ["1950-13", "1950-00", "2023-02-29", "1950-04-31", "50", "1950/06", "1990-13x", "0000"]) {
      expect(isValidPartialDate(d)).toBe(false);
    }
  });
});

describe("parsePersonInput", () => {
  const base = { firstName: " Ada ", lastName: "Lovelace" };

  it("trims values and converts blanks to null", () => {
    const r = parsePersonInput({ ...base, birthDate: "1815-12-10", bio: "  " });
    expect(r).toEqual({
      ok: true,
      data: expect.objectContaining({ firstName: "Ada", birthDate: "1815-12-10", bio: null, deathDate: null }),
    });
  });

  it("requires names and reports every problem", () => {
    const r = parsePersonInput({ firstName: "", lastName: " ", birthDate: "nope" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(3);
  });

  it("rejects a death date before the birth date, including partial dates", () => {
    expect(parsePersonInput({ ...base, birthDate: "1900-05", deathDate: "1899" }).ok).toBe(false);
    expect(parsePersonInput({ ...base, birthDate: "1900-05-02", deathDate: "1900" }).ok).toBe(true);
  });
});
