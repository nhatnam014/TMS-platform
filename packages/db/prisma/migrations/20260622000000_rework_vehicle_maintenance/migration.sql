-- AlterTable: Add maintenance fields to vehicle_records
ALTER TABLE "vehicle_records" ADD COLUMN "don_vi_sua_chua" TEXT;
ALTER TABLE "vehicle_records" ADD COLUMN "ngay_lam" DATE;

-- CreateTable: vehicle_maintenance_km_rounds
CREATE TABLE "vehicle_maintenance_km_rounds" (
    "id" TEXT NOT NULL,
    "vehicle_record_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "km_con" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_maintenance_km_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_maintenance_km_rounds_vehicle_record_id_round_number_key" ON "vehicle_maintenance_km_rounds"("vehicle_record_id", "round_number");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_km_rounds_vehicle_record_id_idx" ON "vehicle_maintenance_km_rounds"("vehicle_record_id");

-- AddForeignKey
ALTER TABLE "vehicle_maintenance_km_rounds" ADD CONSTRAINT "vehicle_maintenance_km_rounds_vehicle_record_id_fkey" FOREIGN KEY ("vehicle_record_id") REFERENCES "vehicle_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "vehicle_maintenance_records" DROP CONSTRAINT IF EXISTS "vehicle_maintenance_records_vehicle_record_id_fkey";

-- DropTable
DROP TABLE "vehicle_maintenance_records";
