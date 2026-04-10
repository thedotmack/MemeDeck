-- Add field to track if partner code has been customized
ALTER TABLE partners ADD COLUMN code_customized BOOLEAN DEFAULT false;