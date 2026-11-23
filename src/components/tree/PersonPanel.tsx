"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { fullName, lifespan } from "@/lib/person-utils";
import type { Relations } from "@/lib/relations";
import type { Person } from "@/lib/types";

interface Props {
  person: Person;
  relations: Relations;
  peopleById: Map<string, Person>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function Group({
  label,
  ids,
  peopleById,
  onSelect,
}: {
  label: string;
  ids: string[];
  peopleById: Map<string, Person>;
  onSelect: (id: string) => void;
}) {
  if (!ids.length) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</h3>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => {
          const p = peopleById.get(id);
          if (!p) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="rounded-full border border-line bg-paper px-2.5 py-1 text-sm text-ink transition hover:border-accent hover:text-accent"
            >
              {p.firstName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PersonPanel({ person, relations, peopleById, onSelect, onClose }: Props) {
  return (
    <aside
      aria-label={`Details for ${fullName(person)}`}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto rounded-t-3xl border border-line bg-card p-5 shadow-2xl md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-96 md:rounded-3xl"
    >
      <div className="flex items-start gap-4">
        <Avatar person={person} size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-semibold leading-tight text-ink">{fullName(person)}</h2>
          <p className="mt-0.5 text-sm text-muted">{lifespan(person)}</p>
          {person.birthPlace && <p className="text-sm text-muted">{person.birthPlace}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="-mr-1 -mt-1 rounded-full p-2 text-muted transition hover:bg-paper hover:text-ink"
        >
          ✕
        </button>
      </div>

      {person.bio && <p className="mt-4 text-sm leading-relaxed text-ink/80">{person.bio}</p>}

      <div className="mt-5 space-y-4">
        <Group label="Parents" ids={relations.parents} peopleById={peopleById} onSelect={onSelect} />
        <Group label="Spouse" ids={relations.spouses} peopleById={peopleById} onSelect={onSelect} />
        <Group label="Siblings" ids={relations.siblings} peopleById={peopleById} onSelect={onSelect} />
        <Group label="Children" ids={relations.children} peopleById={peopleById} onSelect={onSelect} />
      </div>

      <Link
        href={`/person/${person.id}`}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-dark"
      >
        View full profile
      </Link>
    </aside>
  );
}
