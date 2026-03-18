// ============================================
// CONFIGURATION SUPABASE - JL BEAUTY SYSTEM
// ============================================

// Clés Supabase (Production)
const SUPABASE_URL = 'https://gxlgxlkcisesywnzckhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emNxbHdwc2ltbHJzaWhrc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc3OTgsImV4cCI6MjA2ODQyMzc5OH0.XohKIxxisX0FZVq4hY74LnDqdfVUNAXw58aiaR4Y6P4';

// Vérifier que la librairie Supabase est chargée
if (typeof supabase === 'undefined') {
    console.error('❌ ERREUR CRITIQUE : La librairie Supabase n\'est pas chargée !');
    console.error('Vérifiez que cette ligne est présente dans votre HTML AVANT supabase-config.js :');
    console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    alert('Erreur de configuration : Supabase n\'est pas chargé. Consultez la console (F12).');
} else {
    // Créer le client Supabase
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Exporter globalement pour que tous les autres scripts puissent l'utiliser
    window.supabase = supabaseClient;
    
    // Log de confirmation
    console.log('✅ Supabase configuré avec succès !');
    console.log('📍 URL:', SUPABASE_URL);
    console.log('🔑 Clé chargée:', SUPABASE_ANON_KEY.substring(0, 20) + '...');