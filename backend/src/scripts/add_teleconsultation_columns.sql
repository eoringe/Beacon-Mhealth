-- Migration: Add teleconsultation fields to appointments table
-- Run this migration on the EXTERNAL (Laravel) database

-- Add new columns for teleconsultation support
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(20) DEFAULT 'IN_PERSON';

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_meet_link VARCHAR(500);

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);

-- Add unique constraint on idempotency_key to prevent duplicates
-- Only add if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_idempotency_key_unique'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_idempotency_key_unique UNIQUE (idempotency_key);
    END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_idempotency ON appointments(idempotency_key);

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('appointment_type', 'google_meet_link', 'google_calendar_event_id', 'idempotency_key');
