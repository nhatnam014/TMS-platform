-- CreateTable
CREATE TABLE "vehicle_records" (
    "id" TEXT NOT NULL,
    "ten_tai_xe" TEXT,
    "sdt" TEXT,
    "loai_xe" TEXT,
    "bien_so" TEXT,
    "han_dang_kiem" TIMESTAMP(3),
    "han_bao_hiem" TIMESTAMP(3),
    "han_ca_vet" TIMESTAMP(3),
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_record_moocs" (
    "id" TEXT NOT NULL,
    "vehicle_record_id" TEXT NOT NULL,
    "so_mooc" TEXT NOT NULL,
    "han_dang_kiem" TIMESTAMP(3),
    "han_bao_hiem" TIMESTAMP(3),
    "han_ca_vet" TIMESTAMP(3),

    CONSTRAINT "vehicle_record_moocs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehicle_record_moocs" ADD CONSTRAINT "vehicle_record_moocs_vehicle_record_id_fkey" FOREIGN KEY ("vehicle_record_id") REFERENCES "vehicle_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
