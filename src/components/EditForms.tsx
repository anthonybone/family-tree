"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import {
  addRelationAction,
  deletePersonAction,
  removeRelationAction,
  savePersonAction,
  type FormState,
  type RelationKind,
} from "@/app/actions";

const field =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
const primaryBtn =
  "rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-60";
const ghostBtn =
  "rounded-full border border-line bg-card px-4 py-2 text-sm text-ink transition hover:border-accent hover:text-accent disabled:opacity-60";

function Errors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

export interface PersonFormValues {
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  bio: string;
}

export function PersonForm({ id, initial }: { id?: string; initial: PersonFormValues }) {
  const [state, action, pending] = useActionState(savePersonAction, {} as FormState);
  const v = { ...initial, ...state.values };
  return (
    <form action={action} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ink">
          First name *
          <input name="firstName" required maxLength={100} defaultValue={v.firstName} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm text-ink">
          Last name *
          <input name="lastName" required maxLength={100} defaultValue={v.lastName} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm text-ink">
          Birth date
          <input name="birthDate" placeholder="YYYY, YYYY-MM or YYYY-MM-DD" defaultValue={v.birthDate} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm text-ink">
          Birthplace
          <input name="birthPlace" maxLength={200} defaultValue={v.birthPlace} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm text-ink">
          Death date
          <input name="deathDate" placeholder="Leave blank if living" defaultValue={v.deathDate} className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm text-ink">
          Place of death
          <input name="deathPlace" maxLength={200} defaultValue={v.deathPlace} className={`mt-1 ${field}`} />
        </label>
      </div>
      <label className="block text-sm text-ink">
        Biography
        <textarea name="bio" rows={5} maxLength={5000} defaultValue={v.bio} className={`mt-1 ${field}`} />
      </label>
      <Errors errors={state.errors} />
      <div className="flex gap-3">
        <button disabled={pending} className={primaryBtn}>
          {pending ? "Saving…" : id ? "Save changes" : "Add person"}
        </button>
        <Link href={id ? `/person/${id}` : "/"} className={ghostBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function DeletePerson({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<string[]>();
  const [pending, start] = useTransition();
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-50">
        Delete {name}…
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        Permanently delete <strong>{name}</strong>? Their parent, child and spouse links are removed too. This cannot be undone.
      </p>
      <Errors errors={errors} />
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setErrors((await deletePersonAction(id)).errors))}
          className="rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export interface Option {
  id: string;
  label: string;
}

export function RelationSection({
  personId,
  kind,
  title,
  current,
  candidates,
  addLabel,
}: {
  personId: string;
  kind: RelationKind;
  title: string;
  current: Option[];
  candidates: Option[];
  addLabel: string;
}) {
  const [state, action, pending] = useActionState(addRelationAction.bind(null, personId, kind), {} as FormState);
  const [removeErrors, setRemoveErrors] = useState<string[]>();
  const [removing, startRemove] = useTransition();
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {current.length === 0 ? (
        <p className="text-sm text-muted">None recorded.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {current.map((o) => (
            <li key={o.id} className="flex items-center gap-1 rounded-full border border-line bg-paper py-1 pl-3 pr-1 text-sm">
              {o.label}
              <button
                type="button"
                disabled={removing}
                aria-label={`Remove ${o.label} from ${title.toLowerCase()}`}
                onClick={() => startRemove(async () => setRemoveErrors((await removeRelationAction(personId, kind, o.id)).errors))}
                className="rounded-full px-2 py-0.5 text-muted transition hover:bg-red-50 hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="flex gap-2">
        <select name="otherId" aria-label={addLabel} defaultValue="" className={field}>
          <option value="">{addLabel}</option>
          {candidates.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button disabled={pending} className={`${ghostBtn} shrink-0`}>
          Add
        </button>
      </form>
      <Errors errors={[...(state.errors ?? []), ...(removeErrors ?? [])]} />
    </section>
  );
}
