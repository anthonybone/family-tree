import type { Person } from "./types";

export function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

/** Oldest first; people without a birth date come last, then by name for stable ties. */
export function compareByBirth(a: Person, b: Person): number {
  if (a.birthDate && !b.birthDate) return -1;
  if (!a.birthDate && b.birthDate) return 1;
  if (a.birthDate && b.birthDate && a.birthDate !== b.birthDate) {
    return a.birthDate < b.birthDate ? -1 : 1;
  }
  return fullName(a).localeCompare(fullName(b)) || a.id.localeCompare(b.id);
}

export function initials(p: Person): string {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

const year = (d?: string) => (d ? d.slice(0, 4) : undefined);

export function lifespan(p: Person): string {
  const b = year(p.birthDate);
  const d = year(p.deathDate);
  if (b && d) return `${b} – ${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return "";
}

const PALETTE = [
  "bg-[#e9d5c4] text-[#7a4a2e]",
  "bg-[#dfe5d3] text-[#4f6038]",
  "bg-[#ecdcd0] text-[#8a4b3a]",
  "bg-[#e3dccd] text-[#6b5a36]",
  "bg-[#d9e2e0] text-[#3f5f5a]",
  "bg-[#ead6d8] text-[#80454d]",
];

export function avatarTone(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
