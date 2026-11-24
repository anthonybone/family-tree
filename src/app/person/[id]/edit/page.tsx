import Link from "next/link";
import { notFound } from "next/navigation";
import { DeletePerson, PersonForm, RelationSection, type Option } from "@/components/EditForms";
import { SavedToast } from "@/components/Toast";
import { wouldCreateCycle } from "@/lib/db-mapping";
import { getFamilyData } from "@/lib/family-data";
import { fullName, lifespan } from "@/lib/person-utils";
import { buildRelations } from "@/lib/relations";

export const dynamic = "force-dynamic";

export default async function EditPersonPage({ params, searchParams }: PageProps<"/person/[id]/edit">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const data = await getFamilyData();
  const person = data.people.find((p) => p.id === id);
  if (!person) notFound();

  const rel = buildRelations(data).get(id)!;
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const option = (pid: string): Option => {
    const p = byId.get(pid)!;
    return { id: pid, label: `${fullName(p)} (${lifespan(p)})` };
  };
  const others = data.people.filter((p) => p.id !== id);
  const exclude = (ids: string[], ok: (pid: string) => boolean) =>
    others.filter((p) => !ids.includes(p.id) && ok(p.id)).map((p) => option(p.id));

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <SavedToast code={typeof saved === "string" ? saved : undefined} />
      <Link href={`/person/${id}`} className="text-sm text-accent hover:text-accent-dark">
        ← Back to {person.firstName}&apos;s profile
      </Link>
      <div className="mt-6 space-y-10 rounded-3xl border border-line bg-card p-6 shadow-sm md:p-10">
        <div>
          <h1 className="mb-6 font-serif text-3xl font-semibold text-ink">Edit {fullName(person)}</h1>
          <PersonForm
            id={id}
            initial={{
              firstName: person.firstName,
              lastName: person.lastName,
              birthDate: person.birthDate ?? "",
              birthPlace: person.birthPlace ?? "",
              deathDate: person.deathDate ?? "",
              deathPlace: person.deathPlace ?? "",
              bio: person.bio ?? "",
            }}
          />
        </div>

        <div className="space-y-6 border-t border-line pt-8">
          <h2 className="font-serif text-2xl font-semibold text-ink">Relationships</h2>
          <RelationSection
            personId={id}
            kind="parent"
            title="Parents"
            addLabel="Add a parent…"
            current={rel.parents.map(option)}
            candidates={exclude(rel.parents, (c) => !wouldCreateCycle(data.parentChild, c, id))}
          />
          <RelationSection
            personId={id}
            kind="spouse"
            title="Spouses"
            addLabel="Add a spouse…"
            current={rel.spouses.map(option)}
            candidates={exclude(rel.spouses, () => true)}
          />
          <RelationSection
            personId={id}
            kind="child"
            title="Children"
            addLabel="Add a child…"
            current={rel.children.map(option)}
            candidates={exclude(rel.children, (c) => !wouldCreateCycle(data.parentChild, id, c))}
          />
          <p className="text-sm text-muted">
            Half-siblings need no special step: link a child to just one of a couple, or to a different spouse.
          </p>
        </div>

        <div className="border-t border-line pt-8">
          <DeletePerson id={id} name={fullName(person)} />
        </div>
      </div>
    </main>
  );
}
