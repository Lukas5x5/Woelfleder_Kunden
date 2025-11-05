// ============================================
// SUPABASE KONFIGURATION
// ============================================
//
// WICHTIG: Ersetzen Sie diese Werte mit Ihren eigenen!
//
// So finden Sie Ihre Werte:
// 1. Gehen Sie zu https://supabase.com
// 2. Öffnen Sie Ihr Projekt
// 3. Gehen Sie zu Settings > API
// 4. Kopieren Sie "Project URL" und "anon public" Key
//
// ============================================

const SUPABASE_URL = 'https://zsuzgjygzkhbquhtotxm.supabase.co';  // z.B. 'https://xxxxxxxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzdXpnanlnemtoYnF1aHRvdHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDkyOTksImV4cCI6MjA3NzkyNTI5OX0.prma63t_goE0uMFSyhrmiDD_IVtgma-IWpyO7Bmq0Hk';  // Langer Text, beginnt mit 'eyJ...'

// ============================================
// NICHT ÄNDERN AB HIER
// ============================================

// Prüfen ob Konfiguration vorhanden ist
if (SUPABASE_URL === 'IHRE-PROJECT-URL-HIER' || SUPABASE_ANON_KEY === 'IHR-ANON-KEY-HIER') {
    console.warn('⚠️ WARNUNG: Supabase ist noch nicht konfiguriert!');
    console.warn('📖 Bitte lesen Sie die Datei SUPABASE_SETUP.md für Anweisungen.');
}
