-- AlterTable
ALTER TABLE "vehicle_records"
ADD COLUMN IF NOT EXISTS "ghi_chu_bao_duong" TEXT,
ADD COLUMN IF NOT EXISTS "km_hien_tai" TEXT;

-- RenameIndex
DO $$
DECLARE
  existing_index TEXT;
  target_index CONSTANT TEXT := 'vehicle_maintenance_km_rounds_vehicle_record_id_round_numbe_key';
BEGIN
  IF to_regclass(format('public.%I', target_index)) IS NULL THEN
    SELECT c.relname
    INTO existing_index
    FROM pg_class c
    JOIN pg_index i ON i.indexrelid = c.oid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'vehicle_maintenance_km_rounds'
      AND i.indisunique
      AND (
        SELECT array_agg(a.attname ORDER BY keys.ordinality)
        FROM unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = keys.attnum
      ) = ARRAY['vehicle_record_id', 'round_number']
    LIMIT 1;

    IF existing_index IS NOT NULL THEN
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', existing_index, target_index);
    END IF;
  END IF;
END $$;
