-- Database Schema for Todo Application
-- Based on the Data Model defined in API.md

-- Table: todos
CREATE TABLE IF NOT EXISTS todos (
    -- Unique identifier: Supports both number (via SERIAL) and string representation
    -- If string IDs (UUID) are strictly required, use: id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    id SERIAL PRIMARY KEY,

    -- Title of the todo item (Required)
    title VARCHAR(255) NOT NULL,

    -- Completion status (Default: false)
    completed BOOLEAN DEFAULT FALSE,

    -- Creation timestamp (Optional in API, but good practice to store)
    -- Stores ISO 8601 compatible timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_created_at ON todos(created_at);
