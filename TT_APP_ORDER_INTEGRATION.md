# TT-App Order Integration - TODO

## 🎯 Ziel
Beim Erstellen eines Tors in der TT-App muss der Benutzer einen Auftrag auswählen.

## 📋 Was muss gemacht werden:

### 1. **Order-Liste beim Kunden-Auswahl laden**

Wenn ein Kunde in der TT-App ausgewählt wird, müssen die Orders (Aufträge) dieses Kunden geladen werden.

**Dateipfad:** `C:\Users\LRAus\Desktop\TT_Programm\src\...` (oder wo auch immer die Kunden-Auswahl ist)

**Code-Änderung:**
```javascript
// Nach Kunden-Auswahl, Orders laden
async function loadOrdersForCustomer(customerId) {
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading orders:', error);
        return [];
    }

    return data || [];
}
```

### 2. **Order-Dropdown im Save-Gate Modal hinzufügen**

**Dateipfad:** Dort wo das "Tor speichern" Modal ist

**HTML hinzufügen:**
```html
<div class="form-group">
    <label for="gateOrderId">Auftrag auswählen *</label>
    <select id="gateOrderId" required>
        <option value="">-- Auftrag wählen --</option>
        <!-- Wird dynamisch befüllt -->
    </select>
</div>
```

**JavaScript zum Befüllen:**
```javascript
function populateOrderDropdown(orders) {
    const select = document.getElementById('gateOrderId');
    select.innerHTML = '<option value="">-- Auftrag wählen --</option>';

    orders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `${order.order_number} - ${order.type} (${order.status})`;
        select.appendChild(option);
    });
}
```

### 3. **Order ID beim Gate-Speichern mitgeben**

**Dateipfad:** Dort wo `saveGate()` aufgerufen wird

**Code-Änderung:**
```javascript
// Beim Speichern
const orderId = document.getElementById('gateOrderId').value;

if (!orderId) {
    alert('Bitte wählen Sie einen Auftrag aus');
    return;
}

// Gate-Daten
const gateData = {
    ...existingGateData,
    orderId: orderId  // NEU!
};

// Speichern
await SupabaseStorageService.saveGate(customerId, gateData);
```

### 4. **SupabaseStorageService bereits vorbereitet**

✅ **Bereits erledigt!** Die Datei `tt-app/js/services/SupabaseStorageService.js` unterstützt bereits `order_id`:

- `saveGate()`: Speichert `order_id` mit (Zeile 235)
- `updateGate()`: Updated `order_id` (Zeile 301)

## 🔍 Dateien die geändert werden müssen:

1. **Kunden-Auswahl Component/View**
   - Funktion zum Laden der Orders hinzufügen
   - Orders im State speichern

2. **Gate-Konfiguration View** (Save Modal)
   - Order-Dropdown hinzufügen
   - Dropdown mit Orders befüllen
   - Validation: Order muss ausgewählt sein

3. **Gate-Speichern Logic**
   - `orderId` aus Dropdown lesen
   - An `saveGate()` übergeben

## 💡 User Flow:

```
1. TT-App öffnen
   ↓
2. Kunde aus Liste wählen
   ↓
3. System lädt Orders für diesen Kunden
   ↓
4. Tor konfigurieren
   ↓
5. "Speichern" klicken
   ↓
6. Modal zeigt: "Auftrag auswählen" Dropdown
   ↓
7. User wählt Order aus (REQUIRED!)
   ↓
8. Speichern → Tor wird mit order_id gespeichert
```

## ⚠️ Wichtig:

- **Order-Auswahl ist PFLICHT** (required field)
- Wenn Kunde keine Orders hat: Zeige Meldung "Bitte erst einen Auftrag in der Kunden-App erstellen"
- Order-Dropdown zeigt: `Auftragsnummer - Typ (Status)`
  - Beispiel: `ORD-20250106-001 - Ausmessen Tore (Auftrag)`

## 🧪 Testing:

1. Kunde mit mehreren Aufträgen wählen
2. Tor konfigurieren
3. Speichern → Dropdown muss alle Orders zeigen
4. Order auswählen und speichern
5. In Supabase prüfen: Gate hat `order_id` gesetzt
6. In Kunden-App: Auftrag öffnen → Tor sollte dort erscheinen

## 📚 Referenz:

- **Order Service:** `order-service.js` (zeigt wie Orders geladen werden)
- **Supabase Storage:** `tt-app/js/services/SupabaseStorageService.js` (bereits vorbereitet)
- **Migration:** `migration_orders.sql` (muss in Supabase ausgeführt sein!)
