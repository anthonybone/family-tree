import { FamilyTreeApp } from "@/components/tree/FamilyTreeApp";
import { getFamilyData } from "@/lib/family-data";

// Data comes from the database at request time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getFamilyData();
  return <FamilyTreeApp data={data} />;
}
