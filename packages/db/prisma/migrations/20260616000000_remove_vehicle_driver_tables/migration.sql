-- Step 1: Add vehicle_plate column to trip_plans
ALTER TABLE "trip_plans" ADD COLUMN "vehicle_plate" TEXT;

-- Step 2: Copy license plate from vehicles into trip_plans
UPDATE "trip_plans"
SET "vehicle_plate" = (
  SELECT "license_plate"
  FROM "vehicles"
  WHERE "vehicles"."id" = "trip_plans"."vehicle_id"
);

-- Step 3: Drop FK constraint and vehicle_id column from trip_plans
ALTER TABLE "trip_plans" DROP CONSTRAINT IF EXISTS "trip_plans_vehicle_id_fkey";
ALTER TABLE "trip_plans" DROP COLUMN IF EXISTS "vehicle_id";

-- Step 4: Drop old vehicle_id index if it exists
DROP INDEX IF EXISTS "trip_plans_vehicle_id_idx";

-- Step 5: Create new index on vehicle_plate
CREATE INDEX "trip_plans_vehicle_plate_idx" ON "trip_plans"("vehicle_plate");

-- Step 6: Drop dependent tables in order
DROP TABLE IF EXISTS "vehicle_trailers";
DROP TABLE IF EXISTS "trailers";
DROP TABLE IF EXISTS "drivers";
DROP TABLE IF EXISTS "vehicles";

-- Step 7: Drop enums
DROP TYPE IF EXISTS "VehicleType";
DROP TYPE IF EXISTS "VehicleStatus";
DROP TYPE IF EXISTS "DriverStatus";
