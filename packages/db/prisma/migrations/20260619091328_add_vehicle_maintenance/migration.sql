-- AlterTable
ALTER TABLE "container_sizes" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cost_templates" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "service_types" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "vehicle_maintenance_records" (
    "id" TEXT NOT NULL,
    "vehicle_record_id" TEXT,
    "bien_so" TEXT,
    "ten_tai_xe" TEXT,
    "sdt" TEXT,
    "loai_xe" TEXT,
    "don_vi_sua_chua" TEXT,
    "ngay_lam" DATE,
    "so_km_bao_duong" DECIMAL(10,2),
    "ki_bao_duong_tiep_theo" DECIMAL(10,2),
    "so_km_hien_tai" DECIMAL(10,2),
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_maintenance_records_bien_so_idx" ON "vehicle_maintenance_records"("bien_so");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_records_loai_xe_idx" ON "vehicle_maintenance_records"("loai_xe");

-- CreateIndex
CREATE INDEX "vehicle_maintenance_records_ngay_lam_idx" ON "vehicle_maintenance_records"("ngay_lam");

-- AddForeignKey
ALTER TABLE "vehicle_maintenance_records" ADD CONSTRAINT "vehicle_maintenance_records_vehicle_record_id_fkey" FOREIGN KEY ("vehicle_record_id") REFERENCES "vehicle_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
