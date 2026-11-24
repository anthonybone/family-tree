import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/EditForms";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administrator sign in · Family Tree" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/");
  return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <Link href="/" className="text-sm text-accent hover:text-accent-dark">
        ← Back to the family tree
      </Link>
      <div className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-sm">
        <h1 className="mb-1 font-serif text-2xl font-semibold text-ink">Administrator sign in</h1>
        <p className="mb-5 text-sm text-muted">Only needed to edit the tree. Everyone can view it.</p>
        <LoginForm />
      </div>
    </main>
  );
}
