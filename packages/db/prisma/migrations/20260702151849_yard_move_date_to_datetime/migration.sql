-- Change YardMove.date from free-text String to a real DateTime (date-only).
-- Existing yard_moves rows are test data with unparseable free-text dates (e.g. "24/06", no year),
-- so they are truncated rather than cast.

TRUNCATE TABLE "yard_moves";

ALTER TABLE "yard_moves" ALTER COLUMN "date" TYPE DATE USING "date"::DATE;
