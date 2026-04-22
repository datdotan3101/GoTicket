-- Increase length of stand name to support "VIP"
ALTER TABLE stands ALTER COLUMN name TYPE VARCHAR(10);
