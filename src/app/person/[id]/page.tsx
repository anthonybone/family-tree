import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { getFamilyData } from "@/lib/family-data";
import { fullName, lifespan } from "@/lib/person-utils";
import { buildRelations } from "@/lib/relations";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: PageProps<"/person/[id]">) {
  const { id } = await params;
  const data = await getFamilyData();
  const person = data.people.find((p) => p.id === id);
  if (!person) notFound();

  const relations = buildRelations(data).get(id)!;
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const groups = [
    ["Parents", relations.parents],
    ["Spouse", relations.spouses],
    ["Siblings", relations.siblings],
    ["Children", relations.children],
  ] as const;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href={`/#${person.id}`} className="text-sm text-accent hover:text-accent-dark">
        ← Back to the family tree
      </Link>
      <article className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-sm md:p-10">
        <div className="flex items-center gap-5">
          <Avatar person={person} size={96} />
          <div>
            <h1 className="font-serif text-3xl font-semibold text-ink">{fullName(person)}</h1>
            <p className="text-muted">{lifespan(person)}</p>
            {person.birthPlace && <p className="text-muted">Born in {person.birthPlace}</p>}
          </div>
        </div>
        {person.bio && <p className="mt-8 leading-relaxed text-ink/80">{person.bio}</p>}
        <div className="mt-8 space-y-5">
          {groups.map(([label, ids]) =>
            ids.length ? (
              <section key={label}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</h2>
                <ul className="flex flex-wrap gap-2">
                  {ids.map((rid) => (
                    <li key={rid}>
                      <Link
                        href={`/person/${rid}`}
                        className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm transition hover:border-accent hover:text-accent"
                      >
                        {fullName(byId.get(rid)!)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      </article>
    </main>
  );
}
