-- ============================================
-- SCRIPT SQL : Création des profils utilisateurs
-- ============================================
-- À exécuter dans Supabase SQL Editor APRÈS avoir créé les utilisateurs dans Auth
-- URL: https://supabase.com/dashboard/project/gxlgxlkcisesywnzckhg/editor

-- ============================================
-- ÉTAPE 1 : Vérifier les utilisateurs Auth existants
-- ============================================
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- ÉTAPE 2 : Créer les profils dans la table users
-- ============================================
-- ⚠️ REMPLACER les UUID par ceux obtenus à l'étape 1

-- Supprimer les profils existants si besoin (optionnel)
-- DELETE FROM users WHERE email IN ('admin@jlbeauty.com', 'gerant@jlbeauty.com', 'caisse@jlbeauty.com');

-- Insérer les profils utilisateurs
INSERT INTO users (id, email, nom, role, created_at, updated_at)
VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'admin@jlbeauty.com'),
    'admin@jlbeauty.com',
    'Admin JL Beauty',
    'gerant',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'gerant@jlbeauty.com'),
    'gerant@jlbeauty.com',
    'Gérant',
    'gerant',
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'caisse@jlbeauty.com'),
    'caisse@jlbeauty.com',
    'Caissière',
    'caissiere',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================
-- ÉTAPE 3 : Vérifier les profils créés
-- ============================================
SELECT 
    u.id,
    u.email,
    u.nom,
    u.role,
    u.created_at,
    au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- 3 lignes avec :
-- - admin@jlbeauty.com | Admin JL Beauty | gerant
-- - gerant@jlbeauty.com | Gérant | gerant
-- - caisse@jlbeauty.com | Caissière | caissiere

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Si aucun utilisateur n'apparait dans auth.users :
-- → Créer les utilisateurs dans Supabase Auth d'abord
-- URL: https://supabase.com/dashboard/project/gxlgxlkcisesywnzckhg/auth/users

-- Si l'email n'est pas confirmé :
-- Mettre à jour manuellement :
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'admin@jlbeauty.com';

-- Pour réinitialiser un mot de passe :
-- Aller dans Auth → Users → cliquer sur l'utilisateur → Reset Password

-- ============================================
-- FIN DU SCRIPT
-- ============================================
