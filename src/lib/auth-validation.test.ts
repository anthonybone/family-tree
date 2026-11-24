import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./auth-core";
import { isValidPartialDate, parsePersonInput } from "./validation";

describe("password hashing", () => {
  it("verifies the right password and rejects others", () => {
    const stored = hashPassword("correct horse");
    expect(stored.startsWith("scrypt:")).toBe(true);
    expect(stored).not.toContain("correct horse");
    expect(verifyPassword("correct horse", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("uses a fresh salt each time", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects missing or malformed stored hashes", () => {
    expect(verifyPassword("x", undefined)).toBe(false);
    expect(verifyPassword("x", "plaintext")).toBe(false);
    expect(verifyPassword("x", "scrypt::")).toBe(false);
  });
});

describe("session tokens", () => {
  const secret = "s".repeat(32);
  const now = 1_700_000_000_000;

  it("accepts a fresh token", () => {
    expect(verifySessionToken(createSessionToken(secret, now), secret, now + 1000)).toBe(true);
  });

  it("rejects expired, tampered, wrong-secret and malformed tokens", () => {
    const token = createSessionToken(secret, now);
    expect(verifySessionToken(token, secret, now + 8 * 24 * 3600 * 1000)).toBe(false);
    const [exp, mac] = token.split(".");
    expect(verifySessionToken(`${Number(exp) + 99999}.${mac}`, secret, now)).toBe(false);
    expect(verifySessionToken(token, "t".repeat(32), now)).toBe(false);
    expect(verifySessionToken("garbage", secret, now)).toBe(false);
    expect(verifySessionToken(undefined, secret, now)).toBe(false);
  });
});

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
