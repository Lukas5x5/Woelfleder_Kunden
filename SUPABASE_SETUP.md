# Supabase Setup - Anleitung

## Schritt 1: Supabase Account erstellen

1. Gehen Sie zu: https://supabase.com
2. Klicken Sie auf **"Start your project"**
3. Registrieren Sie sich mit Ihrer Email (kostenlos!)
4. Bestätigen Sie Ihre Email-Adresse

## Schritt 2: Neues Projekt erstellen

1. Klicken Sie auf **"New Project"**
2. Füllen Sie folgende Felder aus:
   - **Name:** Wölfleder Kundenverwaltung
   - **Database Password:** Wählen Sie ein sicheres Passwort (WICHTIG: Notieren Sie sich dieses!)
   - **Region:** Europe (Germany/Frankfurt) - für beste Performance
   - **Pricing Plan:** Free (bis zu 500 MB Datenbank kostenlos)
3. Klicken Sie auf **"Create new project"**
4. ⏳ Warten Sie ca. 2 Minuten, bis das Projekt erstellt ist

## Schritt 3: API-Schlüssel kopieren

1. Klicken Sie in der linken Sidebar auf **"Settings"** (Zahnrad-Symbol)
2. Klicken Sie auf **"API"**
3. Kopieren Sie folgende Werte:
   - **Project URL** (z.B. https://xxxxxxxxxxxxx.supabase.co)
   - **anon public** Schlüssel (langer Text unter "Project API keys")

**WICHTIG:** Bewahren Sie diese Werte sicher auf!

## Schritt 4: Datenbank-Tabelle erstellen

1. Klicken Sie in der linken Sidebar auf **"SQL Editor"**
2. Klicken Sie auf **"New query"**
3. Kopieren Sie folgenden SQL-Code:

```sql
-- Tabelle für Kunden erstellen
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    appointment TIMESTAMP,
    sage_ref TEXT,
    follow_up_date DATE,
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index für schnellere Suche
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);

-- Row Level Security aktivieren
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Daten sehen
CREATE POLICY "Users can view their own customers"
    ON customers FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Daten hinzufügen
CREATE POLICY "Users can insert their own customers"
    ON customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Daten aktualisieren
CREATE POLICY "Users can update their own customers"
    ON customers FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Benutzer können ihre eigenen Daten löschen
CREATE POLICY "Users can delete their own customers"
    ON customers FOR DELETE
    USING (auth.uid() = user_id);

-- Tabelle für eigene Auftragstypen
CREATE TABLE custom_types (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index für custom_types
CREATE INDEX idx_custom_types_user_id ON custom_types(user_id);

-- Row Level Security für custom_types
ALTER TABLE custom_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom types"
    ON custom_types FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom types"
    ON custom_types FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom types"
    ON custom_types FOR DELETE
    USING (auth.uid() = user_id);

-- Tabelle für App-Einstellungen
CREATE TABLE app_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    logo TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security für app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON app_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON app_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON app_settings FOR UPDATE
    USING (auth.uid() = user_id);
```

4. Klicken Sie auf **"Run"** (oder drücken Sie Strg+Enter)
5. ✅ Sie sollten eine Erfolgsmeldung sehen

## Schritt 5: Email-Authentifizierung aktivieren

1. Gehen Sie zu **"Authentication"** in der linken Sidebar
2. Klicken Sie auf **"Providers"**
3. Stellen Sie sicher, dass **"Email"** aktiviert ist (sollte standardmäßig aktiv sein)

## Schritt 6: API-Schlüssel in die App eintragen

Nachdem Sie die API-Schlüssel kopiert haben, müssen Sie diese in die Datei `supabase-config.js` eintragen:

```javascript
// Ersetzen Sie diese Werte mit Ihren eigenen aus Schritt 3
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'Ihr-langer-anon-key-hier';
```

## ✅ Fertig!

Ihre Supabase-Datenbank ist jetzt bereit!

## Was passiert jetzt?

- ✅ Alle Ihre Kundendaten werden automatisch in der Cloud gespeichert
- ✅ Synchronisation zwischen allen Geräten (PC, iPhone, iPad, etc.)
- ✅ Sichere Anmeldung mit Email/Passwort
- ✅ Ihre Daten sind nur für Sie sichtbar (Row Level Security)
- ✅ Automatisches Backup in der Cloud

## Kosten

- **Free Tier:** 500 MB Datenbank, 1 GB File Storage, 2 GB Bandwidth - **KOSTENLOS**
- Für kleine bis mittlere Nutzung (ca. 500-1000 Kunden) völlig ausreichend
- Bei Bedarf später upgraden auf Pro Plan (25$/Monat)

## Nächste Schritte

1. Öffnen Sie die Datei `supabase-config.js`
2. Tragen Sie Ihre API-Schlüssel ein
3. Öffnen Sie die App im Browser
4. Registrieren Sie sich mit Ihrer Email
5. Fertig! 🎉

## Support

Bei Fragen:
- Supabase Dokumentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
