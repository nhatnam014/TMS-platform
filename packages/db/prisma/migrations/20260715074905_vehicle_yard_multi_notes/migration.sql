-- 1. CreateTable: 3 new note tables (additive)
CREATE TABLE "vehicle_record_notes" (
    "id" TEXT NOT NULL,
    "vehicle_record_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_record_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_maintenance_notes" (
    "id" TEXT NOT NULL,
    "vehicle_record_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_maintenance_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "yard_move_notes" (
    "id" TEXT NOT NULL,
    "yard_move_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yard_move_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vehicle_record_notes_vehicle_record_id_idx" ON "vehicle_record_notes"("vehicle_record_id");
CREATE INDEX "vehicle_maintenance_notes_vehicle_record_id_idx" ON "vehicle_maintenance_notes"("vehicle_record_id");
CREATE INDEX "yard_move_notes_yard_move_id_idx" ON "yard_move_notes"("yard_move_id");

ALTER TABLE "vehicle_record_notes" ADD CONSTRAINT "vehicle_record_notes_vehicle_record_id_fkey" FOREIGN KEY ("vehicle_record_id") REFERENCES "vehicle_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_maintenance_notes" ADD CONSTRAINT "vehicle_maintenance_notes_vehicle_record_id_fkey" FOREIGN KEY ("vehicle_record_id") REFERENCES "vehicle_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "yard_move_notes" ADD CONSTRAINT "yard_move_notes_yard_move_id_fkey" FOREIGN KEY ("yard_move_id") REFERENCES "yard_moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: copy each non-empty existing scalar value into a single note row
INSERT INTO "vehicle_record_notes" (id, vehicle_record_id, content, created_at)
  SELECT gen_random_uuid()::text, id, ghi_chu, now()
  FROM "vehicle_records"
  WHERE ghi_chu IS NOT NULL AND trim(ghi_chu) <> '';

INSERT INTO "vehicle_maintenance_notes" (id, vehicle_record_id, content, created_at)
  SELECT gen_random_uuid()::text, id, ghi_chu_bao_duong, now()
  FROM "vehicle_records"
  WHERE ghi_chu_bao_duong IS NOT NULL AND trim(ghi_chu_bao_duong) <> '';

INSERT INTO "yard_move_notes" (id, yard_move_id, content, created_at)
  SELECT gen_random_uuid()::text, id, notes, now()
  FROM "yard_moves"
  WHERE notes IS NOT NULL AND trim(notes) <> '';

-- 3. Drop the old scalar columns (destructive, safe only after the backfill above)
ALTER TABLE "vehicle_records" DROP COLUMN "ghi_chu";
ALTER TABLE "vehicle_records" DROP COLUMN "ghi_chu_bao_duong";
ALTER TABLE "yard_moves" DROP COLUMN "notes";
