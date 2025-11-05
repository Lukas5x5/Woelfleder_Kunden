# 🔗 App-Synchronisation Anleitung

## Übersicht

Du hast jetzt **zwei Apps**, die über **Supabase** miteinander verbunden sind:

### 1. **Kunden_Programm** (Kundenverwaltung)
- URL: `https://lukas5x5.github.io/Woelfleder_Kunden`
- Funktion: Kunden verwalten, Fotos/Dokumente hochladen, Status tracking

### 2. **TT_Program** (Türen & Tore Kalkulator)
- Funktion: Tore/Türen konfigurieren, Preise berechnen, Angebote erstellen

## 🔄 Wie funktioniert die Synchronisation?

Beide Apps nutzen **dieselbe Supabase-Datenbank**. Das bedeutet:

✅ **Kunden erscheinen automatisch in beiden Apps**
- Erstelle einen Kunden im Kunden_Programm → Er erscheint sofort im TT_Program
- Beide Apps zeigen dieselben Kundendaten

✅ **Tore/Türen werden beim Kunden angezeigt**
- Erstelle ein Tor im TT_Program und weise es einem Kunden zu
- Öffne den Kunden im Kunden_Programm → Dort siehst du alle seine Tore/Türen
- Klicke auf ein Tor → Sieh alle Details (Maße, Produkte, Preise)

## 📋 Nächster Schritt: Supabase Tabelle erstellen

**WICHTIG:** Du musst noch die `gates` Tabelle in Supabase erstellen!

### So gehst du vor:

1. Gehe zu [https://supabase.com](https://supabase.com)
2. Öffne dein Projekt "Wölfleder Kundenverwaltung"
3. Klicke links auf **"SQL Editor"**
4. Klicke auf **"New query"**
5. Öffne die Datei `SUPABASE_GATES_TABLE.sql` in diesem Ordner
6. Kopiere **den gesamten SQL-Code** aus dieser Datei
7. Füge ihn in den SQL Editor ein
8. Klicke auf **"Run"** (oder drücke Strg+Enter)
9. ✅ Du solltest eine Erfolgsmeldung sehen

### Was macht dieses SQL?

- Erstellt die Tabelle `gates` für Tore/Türen
- Verknüpft Tore mit Kunden (`customer_id`)
- Aktiviert Row Level Security (Datenschutz)
- Jeder User sieht nur seine eigenen Tore

## 🎯 Workflow nach der Einrichtung

### Szenario 1: Neuer Kunde, neues Tor

1. **Kunden_Programm öffnen**
2. Klicke auf "Neuer Kunde"
3. Gib Kundendaten ein (Name, Telefon, etc.)
4. Speichere den Kunden
5. **TT_Program öffnen**
6. Wähle den Kunden aus der Liste
7. Konfiguriere ein Tor (Maße, Produkte, Preis)
8. Speichere das Tor
9. **Zurück zum Kunden_Programm**
10. Öffne die Kunden-Details
11. ✅ Das Tor wird bei "Tore & Türen" angezeigt!

### Szenario 2: Bestehender Kunde, weiteres Tor

1. **TT_Program öffnen**
2. Wähle bestehenden Kunden
3. Erstelle neues Tor
4. ✅ Erscheint automatisch im Kunden_Programm

### Szenario 3: Tore eines Kunden ansehen

1. **Kunden_Programm öffnen**
2. Klicke auf einen Kunden
3. Scrolle zu "Tore & Türen"
4. Klicke auf ein Tor
5. ✅ Sieh alle Details: Maße, Produkte, Preise, Notizen

## 📱 Mobile Nutzung

Beide Apps funktionieren auf dem Handy:

- **Kunden_Programm:** Optimiert für iPhone
- **TT_Program:** PWA - kann als App installiert werden

### TT_Program auf dem Handy installieren:

**iPhone (Safari):**
1. Öffne die TT_Program URL im Safari
2. Tippe auf das Teilen-Symbol
3. Scrolle runter und tippe auf "Zum Home-Bildschirm"
4. Bestätige mit "Hinzufügen"
5. ✅ App erscheint auf dem Home-Bildschirm

**Android (Chrome):**
1. Öffne die TT_Program URL in Chrome
2. Tippe auf die 3 Punkte (Menü)
3. Wähle "App installieren" oder "Zum Startbildschirm hinzufügen"
4. ✅ App erscheint auf dem Startbildschirm

## 🔐 Login & Sync

- **Beide Apps nutzen denselben Supabase-Account**
- Melde dich mit derselben Email in beiden Apps an
- Daten werden automatisch synchronisiert
- Funktioniert offline, synct automatisch wenn online

## 🆘 Troubleshooting

### Problem: Kunden erscheinen nicht im TT_Program
**Lösung:**
- Stelle sicher, du bist mit derselben Email angemeldet
- Lade die Seite neu (Cache leeren)
- Prüfe die Browser-Konsole auf Fehler (F12)

### Problem: Tore erscheinen nicht im Kunden_Programm
**Lösung:**
- Hast du die `gates` Tabelle in Supabase erstellt?
- Führe das SQL aus `SUPABASE_GATES_TABLE.sql` aus
- Stelle sicher, das Tor wurde mit `customer_id` gespeichert

### Problem: "Not logged in" Fehler
**Lösung:**
- Melde dich in beiden Apps an
- Verwende dieselbe Email-Adresse
- Aktiviere "Angemeldet bleiben"

## 🎉 Fertig!

Deine Apps sind jetzt verbunden. Viel Erfolg mit dem digitalen Workflow!

Bei Fragen: Schau in die Browser-Konsole (F12) für Fehlermeldungen.
