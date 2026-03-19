// ============================================
// CONFIGURATION SUPABASE - JL BEAUTY SYSTEM
// ============================================

// Clés Supabase (Production) - CORRECTES
const SUPABASE_URL = 'https://gxlgxlkcisesywnzckhg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bGd4bGtjaXNlc3l3bnpja2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjI4OTEsImV4cCI6MjA4OTM5ODg5MX0.Yn58LUzD-_SzWO1oe4nt57JMffroYhPNqKXfaAupevo';

// Fonction d'initialisation
(function initSupabase() {
    // Vérifier que la librairie Supabase CDN est chargée
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        console.error('❌ ERREUR CRITIQUE : La librairie Supabase n\'est pas chargée !');
        console.error('Vérifiez que cette ligne est présente dans votre HTML AVANT supabase-config.js :');
        console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        alert('Erreur de configuration Supabase. Consultez la console (F12).');
        return;
    }

    try {
        // Créer le client Supabase
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Vérifier que le client a bien été créé avec auth
        if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Client Supabase créé mais auth est undefined');
        }
        
        // Exporter globalement
        window.supabase = supabaseClient;
        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
        
        // Log de confirmation
        console.log('✅ Supabase configuré avec succès !');
        console.log('📍 URL:', SUPABASE_URL);
        console.log('🔑 Clé chargée:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
        console.log('🔐 Auth disponible:', typeof supabaseClient.auth !== 'undefined');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création du client Supabase:', error);
        alert('Erreur de configuration Supabase : ' + error.message);
    }
})();
