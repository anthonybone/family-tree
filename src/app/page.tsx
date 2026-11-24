import { SavedToast } from "@/components/Toast";
import { FamilyTreeApp } from "@/components/tree/FamilyTreeApp";
import { getFamilyData } from "@/lib/family-data";

// Data comes from the database at request time.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const [data, { saved }] = await Promise.all([getFamilyData(), searchParams]);
  return (
    <>
      <SavedToast code={typeof saved === "string" ? saved : undefined} />
      <FamilyTreeApp data={data} />
    </>
  );
}
