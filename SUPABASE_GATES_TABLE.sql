-- Tabelle für Tore/Türen erstellen
-- WICHTIG: Führe dieses SQL in deinem Supabase SQL Editor aus!

CREATE TABLE gates (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    type TEXT NOT NULL,
    width NUMERIC,
    height NUMERIC,
    material TEXT,
    color TEXT,
    price NUMERIC,
    notes TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Index für schnellere Suche
CREATE INDEX idx_gates_user_id ON gates(user_id);
CREATE INDEX idx_gates_customer_id ON gates(customer_id);

-- Row Level Security aktivieren
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Tore sehen
CREATE POLICY "Users can view their own gates"
    ON gates FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Tore hinzufügen
CREATE POLICY "Users can insert their own gates"
    ON gates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Tore aktualisieren
CREATE POLICY "Users can update their own gates"
    ON gates FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Tore löschen
CREATE POLICY "Users can delete their own gates"
    ON gates FOR DELETE
    USING (auth.uid() = user_id);
