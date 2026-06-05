/*
  Warnings:

  - You are about to drop the column `inbound_container_id` on the `trip_plans` table. All the data in the column will be lost.
  - You are about to drop the column `outbound_container_id` on the `trip_plans` table. All the data in the column will be lost.
  - You are about to drop the column `container_id` on the `yard_moves` table. All the data in the column will be lost.
  - You are about to drop the `containers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `container_number` to the `yard_moves` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "containers" DROP CONSTRAINT "containers_current_location_id_fkey";

-- DropForeignKey
ALTER TABLE "trip_plans" DROP CONSTRAINT "trip_plans_inbound_container_id_fkey";

-- DropForeignKey
ALTER TABLE "trip_plans" DROP CONSTRAINT "trip_plans_outbound_container_id_fkey";

-- DropForeignKey
ALTER TABLE "yard_moves" DROP CONSTRAINT "yard_moves_container_id_fkey";

-- DropIndex
DROP INDEX "yard_moves_container_id_idx";

-- AlterTable
ALTER TABLE "trip_plans" DROP COLUMN "inbound_container_id",
DROP COLUMN "outbound_container_id",
ADD COLUMN     "inbound_container_number" TEXT,
ADD COLUMN     "outbound_container_number" TEXT;

-- AlterTable
ALTER TABLE "yard_moves" DROP COLUMN "container_id",
ADD COLUMN     "container_number" TEXT NOT NULL;

-- DropTable
DROP TABLE "containers";

-- DropEnum
DROP TYPE "ContainerSize";

-- DropEnum
DROP TYPE "ContainerStatus";

-- CreateIndex
CREATE INDEX "yard_moves_container_number_idx" ON "yard_moves"("container_number");
