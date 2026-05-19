-- CreateEnum
CREATE TYPE "TripMode" AS ENUM ('STANDARD', 'DROP_AND_HOOK');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('EMPTY_AVAILABLE', 'EMPTY_IN_TRANSIT', 'EMPTY_AT_YARD', 'BEING_LOADED', 'LOADED_READY', 'LOADED_IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "YardMoveStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "YardCostType" AS ENUM ('YARD_HANDLING', 'FORKLIFT', 'OVERTIME', 'OTHER');

-- AlterTable
ALTER TABLE "containers" ADD COLUMN     "current_location_id" TEXT,
ADD COLUMN     "factory_zone" TEXT,
ADD COLUMN     "status" "ContainerStatus" NOT NULL DEFAULT 'EMPTY_AVAILABLE';

-- AlterTable
ALTER TABLE "trip_plans" ADD COLUMN     "trip_mode" "TripMode" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "yard_moves" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "container_id" TEXT NOT NULL,
    "from_zone" TEXT NOT NULL,
    "to_zone" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "status" "YardMoveStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yard_move_costs" (
    "id" TEXT NOT NULL,
    "yard_move_id" TEXT NOT NULL,
    "type" "YardCostType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yard_move_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "yard_moves_location_id_idx" ON "yard_moves"("location_id");

-- CreateIndex
CREATE INDEX "yard_moves_status_idx" ON "yard_moves"("status");

-- CreateIndex
CREATE INDEX "yard_moves_container_id_idx" ON "yard_moves"("container_id");

-- CreateIndex
CREATE INDEX "yard_move_costs_yard_move_id_idx" ON "yard_move_costs"("yard_move_id");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "containers"("status");

-- CreateIndex
CREATE INDEX "containers_current_location_id_idx" ON "containers"("current_location_id");

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_current_location_id_fkey" FOREIGN KEY ("current_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_moves" ADD CONSTRAINT "yard_moves_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_moves" ADD CONSTRAINT "yard_moves_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yard_move_costs" ADD CONSTRAINT "yard_move_costs_yard_move_id_fkey" FOREIGN KEY ("yard_move_id") REFERENCES "yard_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
