-- Drop the default strict unique constraint on (match_id, seat_id)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_match_id_seat_id_key;

-- Create a partial unique index where the ticket is active (not cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_match_id_seat_id_active 
ON tickets (match_id, seat_id) 
WHERE (status != 'cancelled');
