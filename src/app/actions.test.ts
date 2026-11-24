import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth-core";

const SECRET = "x".repeat(40);
let cookie: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookie ? { value: cookie } : undefined), set: vi.fn(), delete: vi.fn() }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/mutations", () => {
  class UserError extends Error {}
  return {
    UserError,
    createPerson: vi.fn(async () => "new-id"),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
    addParentChild: vi.fn(),
    removeParentChild: vi.fn(),
    addSpouse: vi.fn(),
    removeSpouse: vi.fn(),
  };
});

import * as actions from "./actions";
import * as mutations from "@/lib/mutations";

const person = () => {
  const f = new FormData();
  f.set("firstName", "A");
  f.set("lastName", "B");
  return f;
};
const pick = () => {
  const f = new FormData();
  f.set("otherId", "other");
  return f;
};
const calls = () => [
  () => actions.savePersonAction({}, person()),
  () => actions.deletePersonAction("p"),
  () => actions.addRelationAction("p", "parent", {}, pick()),
  () => actions.addRelationAction("p", "child", {}, pick()),
  () => actions.addRelationAction("p", "spouse", {}, pick()),
  () => actions.removeRelationAction("p", "parent", "o"),
  () => actions.removeRelationAction("p", "child", "o"),
  () => actions.removeRelationAction("p", "spouse", "o"),
];

describe("admin protection of server actions", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
    cookie = undefined;
    vi.clearAllMocks();
  });

  it("rejects every mutation without a session and touches no data", async () => {
    for (const call of calls()) {
      const result = await call();
      expect(result.errors?.[0]).toMatch(/signed in/);
    }
    for (const fn of Object.values(mutations)) if (typeof fn === "function" && "mock" in fn) expect(fn).not.toHaveBeenCalled();
  });

  it("rejects forged and expired cookies", async () => {
    cookie = "9999999999.forged";
    expect((await actions.deletePersonAction("p")).errors?.[0]).toMatch(/signed in/);
    cookie = createSessionToken(SECRET, Date.now() - 8 * 24 * 3600 * 1000);
    expect((await actions.deletePersonAction("p")).errors?.[0]).toMatch(/signed in/);
    cookie = createSessionToken("y".repeat(40));
    expect((await actions.deletePersonAction("p")).errors?.[0]).toMatch(/signed in/);
    expect(mutations.deletePerson).not.toHaveBeenCalled();
  });

  it("allows a valid admin session", async () => {
    cookie = createSessionToken(SECRET);
    await expect(actions.deletePersonAction("p")).rejects.toThrow("REDIRECT:/");
    expect(mutations.deletePerson).toHaveBeenCalledWith("p");
    await expect(actions.savePersonAction({}, person())).rejects.toThrow("REDIRECT:/person/new-id/edit");
  });

  it("reports validation errors to an authenticated admin without saving", async () => {
    cookie = createSessionToken(SECRET);
    const f = person();
    f.set("birthDate", "1990-13-45");
    const result = await actions.savePersonAction({}, f);
    expect(result.errors?.[0]).toMatch(/Birth date/);
    expect(mutations.createPerson).not.toHaveBeenCalled();
  });
});
