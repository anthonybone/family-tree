import { beforeEach, describe, expect, it, vi } from "vitest";

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

// No session or credentials exist anywhere: editing is intentionally open to every visitor.
describe("server actions without any authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and updates a person", async () => {
    await expect(actions.savePersonAction({}, person())).rejects.toThrow("REDIRECT:/person/new-id/edit?saved=created");
    expect(mutations.createPerson).toHaveBeenCalled();

    const f = person();
    f.set("id", "p1");
    await expect(actions.savePersonAction({}, f)).rejects.toThrow("REDIRECT:/person/p1?saved=updated");
    expect(mutations.updatePerson).toHaveBeenCalledWith("p1", expect.objectContaining({ firstName: "A" }));
  });

  it("deletes a person", async () => {
    await expect(actions.deletePersonAction("p")).rejects.toThrow("REDIRECT:/?saved=deleted");
    expect(mutations.deletePerson).toHaveBeenCalledWith("p");
  });

  it("adds and removes parent, child and spouse relationships", async () => {
    for (const kind of ["parent", "child", "spouse"] as const) {
      expect(await actions.addRelationAction("p", kind, {}, pick())).toEqual({ notice: expect.stringMatching(/added/) });
      expect(await actions.removeRelationAction("p", kind, "o")).toEqual({ notice: expect.stringMatching(/removed/) });
    }
    expect(mutations.addParentChild).toHaveBeenCalledTimes(2);
    expect(mutations.removeParentChild).toHaveBeenCalledTimes(2);
    expect(mutations.addSpouse).toHaveBeenCalledTimes(1);
    expect(mutations.removeSpouse).toHaveBeenCalledTimes(1);
  });

  it("still validates input and reports integrity errors", async () => {
    const f = person();
    f.set("birthDate", "1990-13-45");
    expect((await actions.savePersonAction({}, f)).errors?.[0]).toMatch(/Birth date/);
    expect(mutations.createPerson).not.toHaveBeenCalled();

    vi.mocked(mutations.addParentChild).mockRejectedValueOnce(new mutations.UserError("That would create a loop."));
    expect((await actions.addRelationAction("p", "parent", {}, pick())).errors).toEqual(["That would create a loop."]);
  });
});
