"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  UserError,
  addParentChild,
  addSpouse,
  createPerson,
  deletePerson,
  removeParentChild,
  removeSpouse,
  updatePerson,
} from "@/lib/mutations";
import { PERSON_FIELDS, parsePersonInput } from "@/lib/validation";

export type FormState = { errors?: string[]; values?: Record<string, string>; notice?: string };

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

/** Runs a mutation and converts expected failures into form errors. Editing is intentionally open to everyone. */
async function run(fn: () => Promise<void>, notice?: string): Promise<FormState> {
  try {
    await fn();
    revalidatePath("/", "layout");
    return { notice };
  } catch (error) {
    if (error instanceof UserError) return { errors: [error.message] };
    console.error("Mutation failed", error);
    return { errors: ["Something went wrong while saving. Please try again."] };
  }
}

export async function savePersonAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(PERSON_FIELDS.map((f) => [f, str(formData, f)]));
  const id = str(formData, "id");
  const parsed = parsePersonInput(raw);
  let savedId = id;
  const result = await run(async () => {
    if (!parsed.ok) throw new UserError(parsed.errors.join("\n"));
    if (id) await updatePerson(id, parsed.data);
    else savedId = await createPerson(parsed.data);
  });
  if (result.errors) return { errors: result.errors.flatMap((e) => e.split("\n")), values: raw };
  redirect(id ? `/person/${id}?saved=updated` : `/person/${savedId}/edit?saved=created`);
}

export async function deletePersonAction(id: string): Promise<FormState> {
  const result = await run(() => deletePerson(id));
  if (result.errors) return result;
  redirect("/?saved=deleted");
}

export type RelationKind = "parent" | "child" | "spouse";
const LABEL: Record<RelationKind, string> = { parent: "Parent", child: "Child", spouse: "Spouse" };

export async function addRelationAction(
  personId: string,
  kind: RelationKind,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const otherId = str(formData, "otherId");
  if (!otherId) return { errors: ["Choose a person first."] };
  return run(() => {
    if (kind === "parent") return addParentChild(otherId, personId);
    if (kind === "child") return addParentChild(personId, otherId);
    return addSpouse(personId, otherId);
  }, `${LABEL[kind]} added.`);
}

export async function removeRelationAction(personId: string, kind: RelationKind, otherId: string): Promise<FormState> {
  return run(() => {
    if (kind === "parent") return removeParentChild(otherId, personId);
    if (kind === "child") return removeParentChild(personId, otherId);
    return removeSpouse(personId, otherId);
  }, `${LABEL[kind]} removed.`);
}
