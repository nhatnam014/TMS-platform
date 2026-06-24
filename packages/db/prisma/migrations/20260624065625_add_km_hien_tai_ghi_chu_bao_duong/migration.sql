-- AlterTable
ALTER TABLE "vehicle_records" ADD COLUMN     "ghi_chu_bao_duong" TEXT,
ADD COLUMN     "km_hien_tai" TEXT;

-- RenameIndex
ALTER INDEX "vehicle_maintenance_km_rounds_vehicle_record_id_round_number_ke" RENAME TO "vehicle_maintenance_km_rounds_vehicle_record_id_round_numbe_key";
