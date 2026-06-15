-- ============================================================
-- Trip Plan Refactor Migration
-- 1. Create service_types, container_sizes, cost_templates tables
-- 2. Migrate TripPlan: serviceType enum → serviceTypeId FK
-- 3. Migrate TripPlan: containerSize string → containerSizeId FK
-- 4. Migrate TripPlan: location FKs → location name strings
-- 5. Migrate chiPhiPhatSinh data → TripPlanCost rows
-- 6. Drop old columns and enum
-- ============================================================

-- Step 1a: Create service_types table
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_types_code_key" ON "service_types"("code");

-- Step 1b: Seed 4 service types
INSERT INTO "service_types" ("id", "code", "description", "is_active", "created_at", "updated_at") VALUES
  (gen_random_uuid()::text, 'SEA-EX', 'SEA - EXPORT', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEA-IM', 'SEA - IMPORT', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'NEO-EX', 'NEO - EXPORT', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'NEO-IM', 'NEO - IMPORT', true, NOW(), NOW());

-- Step 2a: Create container_sizes table
CREATE TABLE "container_sizes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "container_sizes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "container_sizes_code_key" ON "container_sizes"("code");

-- Step 2b: Seed common container sizes
INSERT INTO "container_sizes" ("id", "code", "name", "is_active", "created_at", "updated_at") VALUES
  (gen_random_uuid()::text, '20GP', '20ft General Purpose', true, NOW(), NOW()),
  (gen_random_uuid()::text, '20HC', '20ft High Cube', true, NOW(), NOW()),
  (gen_random_uuid()::text, '40GP', '40ft General Purpose', true, NOW(), NOW()),
  (gen_random_uuid()::text, '40HC', '40ft High Cube', true, NOW(), NOW()),
  (gen_random_uuid()::text, '45HC', '45ft High Cube', true, NOW(), NOW());

-- Step 3: Create cost_templates table
CREATE TABLE "cost_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_amount" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cost_templates_pkey" PRIMARY KEY ("id")
);

-- Step 4: Add new columns to trip_plans (nullable)
ALTER TABLE "trip_plans"
  ADD COLUMN "service_type_id" TEXT,
  ADD COLUMN "container_size_id" TEXT,
  ADD COLUMN "pickup_location_name" TEXT,
  ADD COLUMN "load_unload_location_name" TEXT,
  ADD COLUMN "dropoff_location_name" TEXT;

-- Step 5: Data-migrate serviceType enum → serviceTypeId FK
UPDATE "trip_plans" tp
SET "service_type_id" = st."id"
FROM "service_types" st
WHERE
  (tp."service_type"::text = 'SEA_EXPORT' AND st."code" = 'SEA-EX') OR
  (tp."service_type"::text = 'SEA_IMPORT' AND st."code" = 'SEA-IM') OR
  (tp."service_type"::text = 'NEO_EXPORT' AND st."code" = 'NEO-EX') OR
  (tp."service_type"::text = 'NEO_IMPORT' AND st."code" = 'NEO-IM');

-- Step 6: Data-migrate containerSize string → containerSizeId FK (for matching codes)
UPDATE "trip_plans" tp
SET "container_size_id" = cs."id"
FROM "container_sizes" cs
WHERE tp."container_size" = cs."code";

-- Step 7: Data-migrate location FK names → location name strings
UPDATE "trip_plans" tp
SET "pickup_location_name" = l."name"
FROM "locations" l
WHERE tp."pickup_location_id" = l."id";

UPDATE "trip_plans" tp
SET "load_unload_location_name" = l."name"
FROM "locations" l
WHERE tp."load_unload_location_id" = l."id";

UPDATE "trip_plans" tp
SET "dropoff_location_name" = l."name"
FROM "locations" l
WHERE tp."dropoff_location_id" = l."id";

-- Step 8: Migrate chiPhiPhatSinh data → TripPlanCost rows
INSERT INTO "trip_plan_costs" ("id", "trip_plan_id", "cost_name", "amount", "created_at")
SELECT
  gen_random_uuid()::text,
  tp."id",
  COALESCE(tp."chi_phi_phat_sinh_name", 'CHI PHÍ PHÁT SINH KHÁC'),
  tp."chi_phi_phat_sinh_amount",
  NOW()
FROM "trip_plans" tp
WHERE tp."chi_phi_phat_sinh_amount" IS NOT NULL AND tp."chi_phi_phat_sinh_amount" > 0;

-- Step 9: Drop location FK constraints
ALTER TABLE "trip_plans" DROP CONSTRAINT IF EXISTS "trip_plans_pickup_location_id_fkey";
ALTER TABLE "trip_plans" DROP CONSTRAINT IF EXISTS "trip_plans_load_unload_location_id_fkey";
ALTER TABLE "trip_plans" DROP CONSTRAINT IF EXISTS "trip_plans_dropoff_location_id_fkey";

-- Step 10: Drop old columns from trip_plans
ALTER TABLE "trip_plans"
  DROP COLUMN IF EXISTS "service_type",
  DROP COLUMN IF EXISTS "container_size",
  DROP COLUMN IF EXISTS "pickup_location_id",
  DROP COLUMN IF EXISTS "load_unload_location_id",
  DROP COLUMN IF EXISTS "dropoff_location_id",
  DROP COLUMN IF EXISTS "chi_phi_phat_sinh_name",
  DROP COLUMN IF EXISTS "chi_phi_phat_sinh_amount";

-- Step 11: Drop ServiceType enum
DROP TYPE IF EXISTS "ServiceType";

-- Step 12: Add FK constraints for new columns
CREATE INDEX "trip_plans_service_type_id_idx" ON "trip_plans"("service_type_id");

ALTER TABLE "trip_plans"
  ADD CONSTRAINT "trip_plans_service_type_id_fkey"
  FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "trip_plans"
  ADD CONSTRAINT "trip_plans_container_size_id_fkey"
  FOREIGN KEY ("container_size_id") REFERENCES "container_sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
