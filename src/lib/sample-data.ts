/**
 * TEMPORARY SAMPLE DATA (Phase 1 only).
 * Fictional people used to develop the tree UI. Phase 2 replaces this module
 * with Prisma/Neon queries; nothing else should import from this file except
 * `family-data.ts`.
 */
import type { FamilyData, ParentChild, Person, Spouse } from "./types";

type Row = [id: string, first: string, last: string, born: string, died?: string, place?: string];

const rows: Row[] = [
  // Generation 0
  ["henry", "Henry", "Whitlock", "1920-03-14", "1995-11-02", "Leeds, England"],
  ["dorothy", "Dorothy", "Price", "1921", "1948", "York, England"],
  ["margaret", "Margaret", "Ellis", "1924-07-09", "2010-01-20", "Bath, England"],
  ["joseph", "Joseph", "Moreau", "1918", "1990", "Lyon, France"],
  ["claire", "Claire", "Dubois", "1922", "2005", "Lyon, France"],
  ["marco", "Marco", "Rossi", "1919", "1999", "Naples, Italy"],
  ["lucia", "Lucia", "Bianchi", "1923", "2012", "Naples, Italy"],
  // Generation 1
  ["walter", "Walter", "Whitlock", "1947-05-01", undefined, "York, England"],
  ["joan", "Joan", "Hale", "1949", undefined, "Boston, USA"],
  ["eleanor", "Eleanor", "Whitlock", "1951-02-18", undefined, "Leeds, England"],
  ["louis", "Louis", "Moreau", "1949", undefined, "Lyon, France"],
  ["thomas", "Thomas", "Whitlock", "1953", undefined, "Leeds, England"],
  ["anna", "Anna", "Rossi", "1955", undefined, "Naples, Italy"],
  ["ruth", "Ruth", "Whitlock", "1956", undefined, "Leeds, England"],
  ["george", "George", "Whitlock", "1958", undefined, "Leeds, England"],
  ["helen", "Helen", "Park", "1960", undefined, "Seoul, Korea"],
  ["alice", "Alice", "Whitlock", "1961", undefined, "Leeds, England"],
  ["samuel", "Samuel", "Okafor", "1958", undefined, "Lagos, Nigeria"],
  // Generation 2
  ["peter", "Peter", "Whitlock", "1973", undefined, "Boston, USA"],
  ["rachel", "Rachel", "Stein", "1975", undefined, "New York, USA"],
  ["linda", "Linda", "Whitlock", "1976", undefined, "Boston, USA"],
  ["karen", "Karen", "Whitlock", "1980", undefined, "Boston, USA"],
  ["sophie", "Sophie", "Moreau", "1977", undefined, "Paris, France"],
  ["ben", "Ben", "Carter", "1975", undefined, "Chicago, USA"],
  ["daniel", "Daniel", "Moreau", "1980", undefined, "Paris, France"],
  ["mia", "Mia", "Tan", "1982", undefined, "Singapore"],
  ["nora", "Nora", "Moreau", "1985", undefined, "Paris, France"],
  ["isabel", "Isabel", "Whitlock", "1980", undefined, "Leeds, England"],
  ["noah", "Noah", "Kim", "1979", undefined, "Seattle, USA"],
  ["marcus", "Marcus", "Whitlock", "1982", undefined, "Leeds, England"],
  ["julian", "Julian", "Whitlock", "1985", undefined, "Leeds, England"],
  ["clara", "Clara", "Whitlock", "1988", undefined, "Leeds, England"],
  ["oliver", "Oliver", "Whitlock", "1988", undefined, "Leeds, England"],
  ["emma", "Emma", "Whitlock", "1991", undefined, "Leeds, England"],
  ["chidi", "Chidi", "Okafor", "1990", undefined, "London, England"],
  ["amara", "Amara", "Okafor", "1993", undefined, "London, England"],
  ["victor", "Victor", "Lang", "1991", undefined, "Vienna, Austria"],
  ["arthur", "Arthur", "Cole", "1952", undefined, "Dublin, Ireland"],
  ["paul", "Paul", "Weber", "1955", undefined, "Munich, Germany"],
  ["nina", "Nina", "Vale", "1960", undefined, "Cardiff, Wales"],
  ["grace", "Grace", "Tran", "1966", undefined, "Hanoi, Vietnam"],
  ["greta", "Greta", "Cole", "1980", undefined, "Dublin, Ireland"],
  ["hugo", "Hugo", "Weber", "1986", undefined, "Leeds, England"],
  ["felix", "Felix", "Whitlock", "1983", undefined, "Cardiff, Wales"],
  // Generation 3
  ["jacob", "Jacob", "Whitlock", "2002", undefined, "Boston, USA"],
  ["hannah", "Hannah", "Whitlock", "2004", undefined, "Boston, USA"],
  ["eli", "Eli", "Whitlock", "2008", undefined, "Boston, USA"],
  ["lily", "Lily", "Carter", "2003", undefined, "Chicago, USA"],
  ["sam", "Sam", "Ortiz", "2001", undefined, "Austin, USA"],
  ["max", "Max", "Carter", "2006", undefined, "Chicago, USA"],
  ["leo", "Leo", "Moreau", "2012", undefined, "Paris, France"],
  ["ava", "Ava", "Kim", "2010", undefined, "Seattle, USA"],
  ["ethan", "Ethan", "Kim", "2012", undefined, "Seattle, USA"],
  ["zoe", "Zoe", "Kim", "2016", undefined, "Seattle, USA"],
  ["theo", "Theo", "Lang", "2021", undefined, "London, England"],
  // Generation 4
  ["mateo", "Mateo", "Ortiz", "2025", undefined, "Chicago, USA"],
];

const bios: Record<string, string> = {
  henry:
    "A machinist and amateur clockmaker, Henry raised his family in Leeds after the war. He remarried in 1950 and was known for Sunday walks on the moors.",
  margaret:
    "Margaret taught primary school for thirty years and kept the family's recipe book, which is still in use today.",
  joseph: "Joseph ran a small bakery in Lyon and taught his son the trade.",
  marco: "Marco emigrated briefly to Argentina before returning to Naples to open a fish market.",
  eleanor: "Eleanor moved to Lyon in 1972, where she met Louis. She now lives in Paris.",
  peter: "Peter is a high-school history teacher and keeps the family archive of letters and photographs.",
  emma: "Emma is a field biologist who documents the family's travels in sketchbooks.",
};

const people: Person[] = rows.map(([id, firstName, lastName, birthDate, deathDate, birthPlace]) => ({
  id,
  firstName,
  lastName,
  birthDate,
  deathDate,
  birthPlace,
  bio: bios[id],
}));

const parentChild: ParentChild[] = [];
const spouses: Spouse[] = [];

const marry = (a: string, b: string) => spouses.push({ personAId: a, personBId: b });
const family = (parents: string[], children: string[]) => {
  for (const childId of children) {
    for (const parentId of parents) parentChild.push({ parentId, childId });
  }
};

marry("dorothy", "henry");
marry("henry", "margaret");
marry("joseph", "claire");
marry("marco", "lucia");
marry("walter", "joan");
marry("eleanor", "louis");
marry("thomas", "anna");
marry("george", "helen");
marry("alice", "samuel");
marry("peter", "rachel");
marry("sophie", "ben");
marry("daniel", "mia");
marry("isabel", "noah");
marry("amara", "victor");
marry("lily", "sam");
// Remarriages: Ruth has two husbands, George has three wives.
marry("arthur", "ruth");
marry("ruth", "paul");
marry("george", "nina");
marry("george", "grace");

family(["henry", "dorothy"], ["walter"]);
family(["henry", "margaret"], ["eleanor", "thomas", "ruth", "george", "alice"]);
family(["joseph", "claire"], ["louis"]);
family(["marco", "lucia"], ["anna"]);
family(["walter", "joan"], ["peter", "linda", "karen"]);
family(["eleanor", "louis"], ["sophie", "daniel", "nora"]);
family(["thomas", "anna"], ["isabel", "marcus", "julian", "clara"]);
family(["george", "helen"], ["oliver", "emma"]);
family(["alice", "samuel"], ["chidi", "amara"]);
family(["peter", "rachel"], ["jacob", "hannah", "eli"]);
family(["sophie", "ben"], ["lily", "max"]);
family(["daniel", "mia"], ["leo"]);
family(["isabel", "noah"], ["ava", "ethan", "zoe"]);
family(["amara", "victor"], ["theo"]);
family(["lily", "sam"], ["mateo"]);
family(["arthur", "ruth"], ["greta"]);
family(["ruth", "paul"], ["hugo"]);
family(["george", "nina"], ["felix"]);

export const sampleFamily: FamilyData = { people, parentChild, spouses };
