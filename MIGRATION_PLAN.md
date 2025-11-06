# Migration Plan: Customer → Orders → Gates Structure

## 🎯 Ziel
Umstrukturierung der App von "Customer mit Gates" zu "Customer → Orders → Gates"

## 📊 Datenmodell

### Alte Struktur
```
customers
  - id
  - user_id
  - name
  - company
  - phone
  - email
  - address
  - city
  - source
  - type (Ausmessen Tore, etc.)  ← wird zu order.type
  - status (anfrage, auftrag, etc.)  ← wird zu order.status
  - appointment  ← wird zu order.appointment
  - sage_ref  ← wird zu order.sage_ref
  - follow_up_date  ← wird zu order.follow_up_date
  - notes  ← bleibt beim customer
  - created_at

gates
  - id
  - user_id
  - customer_id  ← wird zu order_id
  - (alle Tor-Daten)
```

### Neue Struktur
```
customers (GEÄNDERT)
  - id
  - user_id
  - name
  - company
  - phone
  - email
  - address
  - city
  - notes
  - created_at
  - updated_at

orders (NEU!)
  - id
  - user_id
  - customer_id  ← Referenz zum Kunden
  - order_number (auto-generated: ORD-YYYYMMDD-XXX)
  - type (Ausmessen Tore, Montage, Reparatur, etc.)
  - status (anfrage, termin, angebot, auftrag, abgeschlossen)
  - sage_ref
  - appointment
  - follow_up_date
  - notes
  - created_at
  - updated_at

gates (GEÄNDERT)
  - id
  - user_id
  - customer_id (bleibt für backward compatibility)
  - order_id  ← NEU! Referenz zum Auftrag
  - (alle anderen Tor-Daten bleiben gleich)
```

## 🔄 Migration Steps

### 1. Supabase Datenbank
```sql
-- Create orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    type TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'anfrage',
    sage_ref TEXT,
    appointment TEXT,
    follow_up_date TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
    ON orders FOR DELETE
    USING (auth.uid() = user_id);

-- Add order_id to gates table
ALTER TABLE gates ADD COLUMN order_id TEXT;
CREATE INDEX idx_gates_order_id ON gates(order_id);

-- Data Migration: Create default order for each customer with gates
INSERT INTO orders (id, user_id, customer_id, order_number, type, status, sage_ref, appointment, follow_up_date, notes, created_at)
SELECT
    'order_' || c.id || '_default',
    c.user_id,
    c.id as customer_id,
    'ORD-' || TO_CHAR(c.created_at, 'YYYYMMDD') || '-001',
    c.type,
    c.status,
    c.sage_ref,
    c.appointment,
    c.follow_up_date,
    'Automatisch erstellt bei Migration',
    c.created_at
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM gates g WHERE g.customer_id = c.id
);

-- Update gates to reference orders
UPDATE gates g
SET order_id = 'order_' || g.customer_id || '_default'
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.id = 'order_' || g.customer_id || '_default'
);

-- Remove redundant fields from customers (optional - for cleanup)
-- ALTER TABLE customers DROP COLUMN type;
-- ALTER TABLE customers DROP COLUMN status;
-- ALTER TABLE customers DROP COLUMN sage_ref;
-- ALTER TABLE customers DROP COLUMN appointment;
-- ALTER TABLE customers DROP COLUMN follow_up_date;
-- ALTER TABLE customers DROP COLUMN source;
```

### 2. JavaScript Dateien

#### a) Neue Datei: `order-service.js`
- loadOrdersForCustomer(customerId)
- createOrder(customerId, orderData)
- updateOrder(orderId, orderData)
- deleteOrder(orderId)
- getOrderById(orderId)

#### b) Update: `script.js`
- Entferne status, type, sage_ref, appointment von Customer
- Füge Order-Liste in Customer-Details hinzu
- Neue Modals: Order erstellen, Order bearbeiten
- Order-Status ändern (Abgeschlossen Button)

#### c) Update: `supabase-auth.js`
- loadOrdersForCustomer() Funktion
- Orders beim Customer-Load mitladen

#### d) Update TT-App: Order-Auswahl beim Gate erstellen
- Dropdown mit Orders des ausgewählten Customers
- Gate wird mit order_id gespeichert

### 3. UI Changes

#### Customer Details Screen
```
┌─────────────────────────────────────┐
│ [←] Lukas Reinberger              │
├─────────────────────────────────────┤
│ 📞 06603753739                      │
│ 📧 lraustria@hotmail.com           │
│ 📍 Soisgegend 55 55                │
├─────────────────────────────────────┤
│ [+ Neuer Auftrag]                  │
├─────────────────────────────────────┤
│ Aufträge (3)                        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ORD-20250106-001         🔵 Auftrag │
│ │ Ausmessen Tore                  │ │
│ │ 🚪 2 Tore                       │ │
│ │ Sage: 12345                     │ │
│ │ [Öffnen] [Abschließen]         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ORD-20250105-002     ✅ Abgeschlossen │
│ │ Montage                         │ │
│ │ 🚪 1 Tor                        │ │
│ │ [Öffnen]                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Order Details Modal
```
┌─────────────────────────────────────┐
│ Auftrag ORD-20250106-001       [✕] │
├─────────────────────────────────────┤
│ Auftragsnummer: ORD-20250106-001   │
│ Typ: [Dropdown]                     │
│ Status: [Dropdown]                  │
│ Sage Nummer: [Input]                │
│ Termin: [Date]                      │
│ Wiedervorlage: [Date]               │
│ Notizen: [Textarea]                 │
├─────────────────────────────────────┤
│ Tore (2)                            │
│ [Tor 1 Details]                     │
│ [Tor 2 Details]                     │
│                                     │
│ [+ Neues Tor erstellen]            │
├─────────────────────────────────────┤
│ [Speichern] [Abgeschlossen]        │
└─────────────────────────────────────┘
```

## 📱 Benutzer-Workflows

### Workflow 1: Neuer Auftrag erstellen
1. Kunde öffnen
2. "Neuer Auftrag" klicken
3. Auftragsdaten eingeben
4. Speichern → Auftrag wird erstellt mit auto-generierter Nummer

### Workflow 2: Tor erstellen
1. TT-App öffnen
2. Kunde auswählen
3. **NEU:** Auftrag aus Liste auswählen
4. Tor konfigurieren
5. Speichern → Tor wird mit order_id gespeichert

### Workflow 3: Auftrag abschließen
1. Kunde öffnen
2. Auftrag aus Liste auswählen
3. "Abgeschlossen" Button klicken
4. Status wird auf "abgeschlossen" gesetzt

## 🔍 Statistiken Update

Statt "Anfragen", "Aufträge" in Kunden-Statistik:
- Zeige Order-Statistiken: "Offene Aufträge", "Abgeschlossene Aufträge"

## ✅ Testing Checklist

- [ ] Orders Tabelle erstellt
- [ ] Migration Script ausgeführt
- [ ] Order-Service funktioniert
- [ ] Customer Details zeigt Orders
- [ ] Neuer Auftrag erstellen funktioniert
- [ ] Auftrag bearbeiten funktioniert
- [ ] Auftrag abschließen funktioniert
- [ ] TT-App Order-Auswahl funktioniert
- [ ] Gates werden korrekt mit Orders verknüpft
- [ ] Statistiken zeigen richtige Werte

## 🚀 Deployment Plan

1. Backup aktuelle Datenbank
2. SQL Migration in Supabase ausführen
3. Code Updates deployen
4. Testen mit echten Daten
5. Bei Problemen: Rollback möglich
