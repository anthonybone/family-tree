import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/EditForms";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a person · Family Tree" };

export default async function NewPersonPage() {
  if (!(await isAdmin())) redirect("/login");
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-accent hover:text-accent-dark">
        ← Back to the family tree
      </Link>
      <div className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-sm md:p-10">
        <h1 className="mb-6 font-serif text-3xl font-semibold text-ink">Add a person</h1>
        <PersonForm initial={{ firstName: "", lastName: "", birthDate: "", birthPlace: "", deathDate: "", deathPlace: "", bio: "" }} />
        <p className="mt-6 text-sm text-muted">After saving, you can link parents, spouses and children.</p>
      </div>
    </main>
  );
}
