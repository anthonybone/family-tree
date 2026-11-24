export interface PersonInput {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  bio: string | null;
}

export const PERSON_FIELDS = [
  "firstName",
  "lastName",
  "birthDate",
  "birthPlace",
  "deathDate",
  "deathPlace",
  "bio",
] as const;

/** Accepts YYYY, YYYY-MM or YYYY-MM-DD and rejects impossible calendar dates. */
export function isValidPartialDate(value: string): boolean {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  if (year < 1) return false;
  if (m[2] === undefined) return true;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return false;
  if (m[3] === undefined) return true;
  return Number(m[3]) >= 1 && Number(m[3]) <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Validates raw form values; returns trimmed input or human-readable errors. */
export function parsePersonInput(
  raw: Record<string, string | undefined>,
): { ok: true; data: PersonInput } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const text = (key: string) => (raw[key] ?? "").trim();
  const optional = (key: string, label: string, max: number) => {
    const v = text(key);
    if (v.length > max) errors.push(`${label} must be ${max} characters or fewer.`);
    return v || null;
  };
  const date = (key: string, label: string) => {
    const v = text(key);
    if (v && !isValidPartialDate(v)) errors.push(`${label} must be a real date as YYYY, YYYY-MM or YYYY-MM-DD.`);
    return v || null;
  };

  const firstName = text("firstName");
  const lastName = text("lastName");
  if (!firstName) errors.push("First name is required.");
  if (!lastName) errors.push("Last name is required.");
  if (firstName.length > 100) errors.push("First name must be 100 characters or fewer.");
  if (lastName.length > 100) errors.push("Last name must be 100 characters or fewer.");

  const birthDate = date("birthDate", "Birth date");
  const deathDate = date("deathDate", "Death date");
  if (birthDate && deathDate && isValidPartialDate(birthDate) && isValidPartialDate(deathDate)) {
    const n = Math.min(birthDate.length, deathDate.length);
    if (deathDate.slice(0, n) < birthDate.slice(0, n)) errors.push("Death date cannot be before the birth date.");
  }
  const data: PersonInput = {
    firstName,
    lastName,
    birthDate,
    birthPlace: optional("birthPlace", "Birthplace", 200),
    deathDate,
    deathPlace: optional("deathPlace", "Place of death", 200),
    bio: optional("bio", "Biography", 5000),
  };
  return errors.length ? { ok: false, errors } : { ok: true, data };
}
