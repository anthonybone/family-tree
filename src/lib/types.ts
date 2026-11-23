export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  /** Partial ISO date: "YYYY", "YYYY-MM" or "YYYY-MM-DD". */
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  bio?: string;
  photoUrl?: string;
}

export interface ParentChild {
  parentId: string;
  childId: string;
}

export interface Spouse {
  personAId: string;
  personBId: string;
}

export interface FamilyData {
  people: Person[];
  parentChild: ParentChild[];
  spouses: Spouse[];
}
