-- Initialize database with extensions and permissions
-- This script runs on first database startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional roles if needed
-- CREATE ROLE readonly WITH LOGIN PASSWORD 'readonly_password';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
END $$;
