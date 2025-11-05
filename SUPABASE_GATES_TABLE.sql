-- Tabelle für Tore/Türen erstellen
-- WICHTIG: Führe dieses SQL in deinem Supabase SQL Editor aus!

DROP TABLE IF EXISTS gates CASCADE;

CREATE TABLE gates (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    name TEXT,
    type TEXT,
    gate_type TEXT,
    notizen TEXT,
    notes TEXT,
    breite NUMERIC,
    width NUMERIC,
    hoehe NUMERIC,
    height NUMERIC,
    glashoehe NUMERIC,
    gesamtflaeche NUMERIC,
    glasflaeche NUMERIC,
    torflaeche NUMERIC,
    selected_products JSONB DEFAULT '[]'::jsonb,
    aufschlag NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    aufschlag_betrag NUMERIC DEFAULT 0,
    exklusive_mwst NUMERIC DEFAULT 0,
    inkl_mwst NUMERIC DEFAULT 0,
    price NUMERIC,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
