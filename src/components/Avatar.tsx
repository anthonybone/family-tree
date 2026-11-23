import Image from "next/image";
import { avatarTone, initials } from "@/lib/person-utils";
import type { Person } from "@/lib/types";

export function Avatar({ person, size }: { person: Person; size: number }) {
  if (person.photoUrl) {
    return (
      <Image
        src={person.photoUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-serif font-semibold ${avatarTone(person.id)}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(person)}
    </span>
  );
}
