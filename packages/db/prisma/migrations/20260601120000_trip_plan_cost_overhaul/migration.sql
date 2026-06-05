-- DropForeignKey
ALTER TABLE "trip_costs" DROP CONSTRAINT "trip_costs_trip_plan_id_fkey";

-- DropIndex
DROP INDEX "trip_costs_trip_plan_id_idx";

-- AlterTable
ALTER TABLE "trip_costs" DROP COLUMN "amount",
DROP COLUMN "cost_type",
DROP COLUMN "description",
DROP COLUMN "invoice_number",
DROP COLUMN "trip_plan_id",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "trip_plans" ADD COLUMN     "container_size" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "trip_cost_amount" DECIMAL(15,2),
ADD COLUMN     "trip_cost_name" TEXT;

-- DropEnum
DROP TYPE "CostType";

-- CreateTable
CREATE TABLE "trip_plan_costs" (
    "id" TEXT NOT NULL,
    "trip_plan_id" TEXT NOT NULL,
    "trip_cost_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "invoice_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_plan_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_plan_costs_trip_plan_id_idx" ON "trip_plan_costs"("trip_plan_id");

-- CreateIndex
CREATE INDEX "trip_plan_costs_trip_cost_id_idx" ON "trip_plan_costs"("trip_cost_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_costs_name_key" ON "trip_costs"("name");

-- AddForeignKey
ALTER TABLE "trip_plan_costs" ADD CONSTRAINT "trip_plan_costs_trip_plan_id_fkey" FOREIGN KEY ("trip_plan_id") REFERENCES "trip_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_plan_costs" ADD CONSTRAINT "trip_plan_costs_trip_cost_id_fkey" FOREIGN KEY ("trip_cost_id") REFERENCES "trip_costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

