# Wölfleder Außendienst Manager ☁️

Eine moderne Web-App zur Verwaltung von Kunden, Aufträgen und Terminen im Außendienst.

**🎉 NEU: Cloud-Synchronisation mit Supabase!**
Ihre Daten werden automatisch zwischen allen Geräten synchronisiert!

## ✨ Features

### Kundenverwaltung
- ✅ Kunden anlegen, bearbeiten und löschen
- ✅ Kontaktdaten (Name, Telefon, Email, Adresse)
- ✅ Herkunft tracken (Email, Telefon, Mundpropaganda, Firma)
- ✅ Sage Angebotsnummer verknüpfen

### Auftragstypen
- ✅ Standard-Typen: Nur Angebot, Ausmessen Tore, Stall zeichnen + ausmessen, Bestellung
- ✅ **NEU:** Eigene Auftragstypen in Einstellungen erstellen

### Status-Workflow
- ✅ Anfrage → Termin → Angebot → Auftrag → Abgeschlossen
- ✅ Farbcodierte Übersicht

### Terminverwaltung
- ✅ Termine mit Datum & Uhrzeit
- ✅ Warnung bei Terminen in den nächsten 24h
- ✅ Automatische Erinnerungen

### Medien & Dokumente
- ✅ Mehrere Fotos pro Kunde hochladen
- ✅ **NEU:** Dokumente hochladen (Angebote, PDFs, etc.)
- ✅ Alle Fotos und Dokumente auf einen Blick beim Kunden

### Suche & Filter
- ✅ Volltextsuche über alle Kundendaten
- ✅ Filter nach Status
- ✅ Dashboard mit Statistiken

### Einstellungen
- ✅ **NEU:** Eigenes Logo hochladen
- ✅ **NEU:** Eigene Auftragstypen erstellen
- ✅ Daten exportieren & importieren (Backup)

### Design
- ✅ **Wölfleder-Rot** als Hauptfarbe
- ✅ Responsive Design (Desktop, Tablet, Smartphone)
- ✅ Moderne, übersichtliche Oberfläche

## 🚀 Installation & Setup

### Option A: Mit Cloud-Synchronisation (Empfohlen)

1. **Supabase einrichten** (einmalig, 5 Minuten):
   - Öffnen Sie die Datei [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)
   - Folgen Sie der Schritt-für-Schritt-Anleitung
   - Tragen Sie Ihre API-Schlüssel in `supabase-config.js` ein

2. **Logo hinzufügen** (optional):
   - Platzieren Sie Ihr Wölfleder-Logo als `logo.png` im gleichen Ordner
   - ODER laden Sie es später über Einstellungen hoch

3. **App öffnen**:
   - Öffnen Sie `index.html` in einem modernen Browser
   - Registrieren Sie sich mit Ihrer Email
   - Fertig! Ihre Daten werden jetzt automatisch synchronisiert

### Option B: Nur lokal (ohne Cloud)

1. Lassen Sie `supabase-config.js` unverändert
2. Öffnen Sie `index.html`
3. Die App funktioniert komplett offline (nur auf diesem Gerät)

## 📱 Verwendung

### App öffnen
Doppelklicken Sie auf `index.html` - die App öffnet sich in Ihrem Browser.

**Tipp:** Erstellen Sie ein Lesezeichen/Bookmark für schnellen Zugriff!

### Ersten Kunden anlegen
1. Klicken Sie auf **"➕ Neuer Kunde"**
2. Füllen Sie die Pflichtfelder aus (Name, Quelle, Auftragstyp)
3. Optional: Termin, Fotos, Dokumente hinzufügen
4. Klicken Sie auf **"Speichern"**

### Kunden bearbeiten
1. Klicken Sie auf eine Kundenkarte in der Liste
2. Im Detail-Modal klicken Sie auf **"Bearbeiten"**
3. Nehmen Sie Ihre Änderungen vor
4. Klicken Sie auf **"Speichern"**

### Dokumente hochladen
1. Öffnen Sie einen Kunden zum Bearbeiten
2. Scrollen Sie zu **"Dokumente (Angebote, PDFs, etc.)"**
3. Klicken Sie auf **"Durchsuchen"** und wählen Sie Ihre Dateien
4. Die Dokumente werden automatisch gespeichert

### Eigene Auftragstypen erstellen
1. Klicken Sie auf **"⚙️ Einstellungen"**
2. Gehen Sie zu **"Eigene Auftragstypen"**
3. Geben Sie den Namen ein (z.B. "Wartung", "Reparatur")
4. Klicken Sie auf **"➕ Hinzufügen"**
5. Der neue Typ erscheint jetzt beim Anlegen/Bearbeiten von Kunden

### Logo hochladen
1. Klicken Sie auf **"⚙️ Einstellungen"**
2. Bei **"Logo hochladen"** wählen Sie Ihre Bilddatei
3. Das Logo wird sofort im Header angezeigt

### Daten sichern
1. Klicken Sie auf **"⚙️ Einstellungen"**
2. Klicken Sie auf **"📥 Daten exportieren"**
3. Eine JSON-Datei wird heruntergeladen
4. Bewahren Sie diese als Backup auf

### Daten wiederherstellen
1. Klicken Sie auf **"⚙️ Einstellungen"**
2. Klicken Sie auf **"📤 Daten importieren"**
3. Wählen Sie Ihre Backup-Datei
4. Bestätigen Sie den Import

## 💾 Datenspeicherung

### Mit Supabase (Cloud-Sync)
- ✅ **Automatische Synchronisation** zwischen allen Geräten
- ✅ **Sicheres Cloud-Backup** - Daten gehen nie verloren
- ✅ **Echtzeit-Updates** - Änderungen sofort überall verfügbar
- ✅ **Offline-Funktionalität** - Arbeiten Sie auch ohne Internet
- ✅ **Verschlüsselt** - Ihre Daten sind sicher
- ✅ **Privat** - Nur Sie haben Zugriff auf Ihre Daten

### Ohne Supabase (Lokal)
- ✅ Keine Internetverbindung nötig
- ✅ Daten bleiben nach Browser-Neustart erhalten
- ⚠️ Nur auf diesem Gerät verfügbar
- ⚠️ Bei Browser-Cache löschen gehen Daten verloren (Backup erstellen!)

## 🔍 Tipps & Tricks

### Smartphone-Nutzung
Die App ist vollständig touchscreen-optimiert. Sie können:
- Fotos direkt mit der Kamera aufnehmen
- Termine mit einem Fingertipp eintragen
- Unterwegs Kunden verwalten

### Suche nutzen
Die Suchfunktion durchsucht:
- Kundennamen
- Telefonnummern
- Email-Adressen
- Adressen
- Notizen

### Filter kombinieren
1. Nutzen Sie die Filter-Buttons (Anfrage, Termin, etc.)
2. Zusätzlich können Sie die Suche verwenden
3. So finden Sie schnell die richtigen Kunden

## 🛠️ Technische Details

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Speicher:** LocalStorage API
- **Browser:** Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Offline:** Vollständig funktionsfähig ohne Internet

## 📋 Systemanforderungen

- Moderner Webbrowser (empfohlen: Chrome, Firefox, Edge)
- Mindestens 100 MB freier Speicherplatz im Browser
- Bildschirmauflösung: min. 320px (funktioniert auf allen Smartphones)

## 🔒 Sicherheit & Datenschutz

- Alle Daten bleiben lokal auf Ihrem Gerät
- Keine Server-Verbindung
- Keine Datenübertragung ins Internet
- DSGVO-konform durch lokale Speicherung

## ⚠️ Wichtige Hinweise

1. **Backup erstellen:** Sichern Sie regelmäßig Ihre Daten über die Export-Funktion
2. **Browser-Cache:** Löschen Sie nicht den Browser-Cache, sonst gehen Daten verloren
3. **Große Dateien:** Fotos und Dokumente werden als Base64 gespeichert - bei sehr vielen großen Dateien kann der Browser-Speicher voll werden
4. **Logo-Datei:** Wenn Sie kein Logo hochladen, wird automatisch nach `logo.png` im gleichen Ordner gesucht

## 📞 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie, ob Sie die neueste Browser-Version verwenden
2. Erstellen Sie ein Backup Ihrer Daten
3. Kontaktieren Sie Ihren Administrator

## 🎨 Anpassungen

Das Design verwendet die Wölfleder-Unternehmensfarbe (Rot: #c41e3a).
Wenn Sie Anpassungen vornehmen möchten, bearbeiten Sie die Datei `styles.css`.

---

**Version:** 2.0
**Letzte Aktualisierung:** Januar 2025
**Entwickelt für:** Wölfleder Stalltechnik Außendienst
