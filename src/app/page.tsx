import { FamilyTreeApp } from "@/components/tree/FamilyTreeApp";
import { getFamilyData } from "@/lib/family-data";
import { isAdmin } from "@/lib/auth";

// Data comes from the database at request time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, admin] = await Promise.all([getFamilyData(), isAdmin()]);
  return <FamilyTreeApp data={data} isAdmin={admin} />;
}
