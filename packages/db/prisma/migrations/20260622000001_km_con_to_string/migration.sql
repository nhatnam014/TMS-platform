-- Change km_con from DECIMAL to TEXT to support free-form string values
ALTER TABLE "vehicle_maintenance_km_rounds" ALTER COLUMN "km_con" TYPE TEXT USING "km_con"::text;
