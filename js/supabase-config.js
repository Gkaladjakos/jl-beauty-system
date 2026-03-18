// ============================================
// CONFIGURATION SUPABASE
// ============================================

// ⚠️ REMPLACEZ CES VALEURS PAR VOS PROPRES CLÉS SUPABASE
const SUPABASE_URL = 'https://gxlgxlkcisesywnzckhg.supabase.co'; // Ex: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emNxbHdwc2ltbHJzaWhrc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc3OTgsImV4cCI6MjA2ODQyMzc5OH0.XohKIxxisX0FZVq4hY74LnDqdfVUNAXw58aiaR4Y6P4'; // Le long token qui commence par eyJhbGc..

// Initialiser le client Supabase
const supabase = supabase.createClient('https://gxlgxlkcisesywnzckhg.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emNxbHdwc2ltbHJzaWhrc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc3OTgsImV4cCI6MjA2ODQyMzc5OH0.XohKIxxisX0FZVq4hY74LnDqdfVUNAXw58aiaR4Y6P4')
const supabaseClient = supabase.createClient('https://gxlgxlkcisesywnzckhg.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emNxbHdwc2ltbHJzaWhrc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc3OTgsImV4cCI6MjA2ODQyMzc5OH0.XohKIxxisX0FZVq4hY74LnDqdfVUNAXw58aiaR4Y6P4')


// Test de connexion
console.log('✅ Supabase configuré et prêt !');
