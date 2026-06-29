-- Redesign YardMove into a flat free-text trip-log entity ("lệnh bãi")
-- Drops the zone/status/cost workflow entirely; no production data exists in this table.

-- DropForeignKey
ALTER TABLE "yard_moves" DROP CONSTRAINT "yard_moves_location_id_fkey";

-- DropForeignKey
ALTER TABLE "yard_move_costs" DROP CONSTRAINT "yard_move_costs_yard_move_id_fkey";

-- DropTable
DROP TABLE "yard_move_costs";

-- DropIndex
DROP INDEX "yard_moves_container_number_idx";
DROP INDEX "yard_moves_location_id_idx";
DROP INDEX "yard_moves_status_idx";

-- AlterTable
ALTER TABLE "yard_moves"
  DROP COLUMN "from_zone",
  DROP COLUMN "to_zone",
  DROP COLUMN "location_id",
  DROP COLUMN "status",
  ALTER COLUMN "date" TYPE TEXT USING "date"::TEXT,
  ALTER COLUMN "container_number" DROP NOT NULL,
  ADD COLUMN "gps" TEXT,
  ADD COLUMN "full_name" TEXT,
  ADD COLUMN "truck" TEXT,
  ADD COLUMN "mooc" TEXT,
  ADD COLUMN "booking" TEXT,
  ADD COLUMN "da_keo" TEXT;

-- DropEnum
DROP TYPE "YardMoveStatus";

-- DropEnum
DROP TYPE "YardCostType";
