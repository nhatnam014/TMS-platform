-- DropForeignKey
ALTER TABLE "trip_plan_costs" DROP CONSTRAINT "trip_plan_costs_trip_cost_id_fkey";

-- DropIndex
DROP INDEX "trip_plan_costs_trip_cost_id_idx";

-- AlterTable
ALTER TABLE "trip_plan_costs" DROP COLUMN "trip_cost_id";

-- DropTable
DROP TABLE "trip_costs";
