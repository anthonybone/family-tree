-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ParentChildKind" AS ENUM ('BIOLOGICAL', 'ADOPTIVE', 'STEP', 'FOSTER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SpouseEndReason" AS ENUM ('DIVORCED', 'WIDOWED', 'ANNULLED', 'SEPARATED');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TEXT,
    "birthPlace" TEXT,
    "deathDate" TEXT,
    "deathPlace" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "kind" "ParentChildKind" NOT NULL DEFAULT 'BIOLOGICAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpouseRelationship" (
    "id" TEXT NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "endReason" "SpouseEndReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpouseRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_lastName_firstName_idx" ON "Person"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_personId_key" ON "Photo"("personId");

-- CreateIndex
CREATE INDEX "ParentChild_childId_idx" ON "ParentChild"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "ParentChild"("parentId", "childId");

-- CreateIndex
CREATE INDEX "SpouseRelationship_personBId_idx" ON "SpouseRelationship"("personBId");

-- CreateIndex
CREATE UNIQUE INDEX "SpouseRelationship_personAId_personBId_key" ON "SpouseRelationship"("personAId", "personBId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpouseRelationship" ADD CONSTRAINT "SpouseRelationship_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpouseRelationship" ADD CONSTRAINT "SpouseRelationship_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written integrity constraints (not expressible in schema.prisma).
-- No self-parenting.
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_no_self_check" CHECK ("parentId" <> "childId");

-- Spouse pairs are canonical (A < B): rejects self-marriage and reversed duplicates.
ALTER TABLE "SpouseRelationship" ADD CONSTRAINT "SpouseRelationship_canonical_order_check" CHECK ("personAId" < "personBId");

-- Partial ISO dates: YYYY, YYYY-MM or YYYY-MM-DD.
ALTER TABLE "Person" ADD CONSTRAINT "Person_dates_format_check" CHECK (
  ("birthDate" IS NULL OR "birthDate" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$') AND
  ("deathDate" IS NULL OR "deathDate" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$')
);
ALTER TABLE "SpouseRelationship" ADD CONSTRAINT "SpouseRelationship_dates_format_check" CHECK (
  ("startDate" IS NULL OR "startDate" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$') AND
  ("endDate" IS NULL OR "endDate" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$')
);

-- Photos: bounded size, positive dimensions.
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_size_check" CHECK ("sizeBytes" > 0);
