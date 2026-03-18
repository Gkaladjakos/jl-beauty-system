-- ============================================
-- GLAMSALON - SCHÉMA DE BASE DE DONNÉES SUPABASE (VERSION 2.2)
-- Mis à jour pour USD/CDF, multi-services, clients anonymes, rendez-vous reportés, consommables, authentification
-- ============================================

-- 0. TABLE USERS (AUTHENTIFICATION)
-- Cette table stocke les informations des utilisateurs du système
-- Elle est liée à Supabase Auth (auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'caissiere' CHECK (role IN ('gerant', 'caissiere')),
    actif BOOLEAN DEFAULT true,
    date_creation BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_actif ON users(actif);

-- 1. TABLE CLIENTS
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT DEFAULT '', -- Nom now optional (can be empty)
    telephone TEXT NOT NULL UNIQUE, -- Phone is now the primary identifier
    email TEXT DEFAULT '',
    date_naissance BIGINT,
    adresse TEXT,
    preferences TEXT,
    points_fidelite INTEGER DEFAULT 0,
    statut TEXT DEFAULT 'Actif' CHECK (statut IN ('Actif', 'VIP', 'Inactif')),
    date_inscription BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLE COIFFEUSES
CREATE TABLE coiffeuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    specialites TEXT[] DEFAULT '{}',
    taux_commission NUMERIC(5,2) DEFAULT 25.00 CHECK (taux_commission >= 15 AND taux_commission <= 40), -- Updated range: 15-40%
    statut TEXT DEFAULT 'Actif' CHECK (statut IN ('Actif', 'En congé', 'Inactif')),
    date_embauche BIGINT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLE SERVICES
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    description TEXT,
    prix NUMERIC(10,2) NOT NULL, -- Now in USD
    duree INTEGER NOT NULL,
    categorie TEXT NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLE RENDEZ_VOUS
CREATE TABLE rendez_vous (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    client_nom TEXT NOT NULL,
    client_telephone TEXT, -- Added for direct display
    coiffeuse_id UUID REFERENCES coiffeuses(id) ON DELETE CASCADE,
    coiffeuse_nom TEXT NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    service_nom TEXT NOT NULL,
    date_rdv BIGINT NOT NULL,
    duree INTEGER NOT NULL,
    prix NUMERIC(10,2) NOT NULL,
    statut TEXT DEFAULT 'Programmé' CHECK (statut IN ('Programmé', 'Confirmé', 'En cours', 'Terminé', 'Annulé', 'Reporté', 'Absent')), -- Added 'Reporté'
    notes TEXT,
    rdv_precedent_id UUID, -- Link to previous appointment if rescheduled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLE PRODUITS
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    description TEXT,
    categorie TEXT NOT NULL,
    prix_achat NUMERIC(10,2) NOT NULL, -- Now in USD
    prix_vente NUMERIC(10,2) NOT NULL, -- Now in USD
    stock_actuel INTEGER DEFAULT 0,
    stock_minimum INTEGER DEFAULT 5,
    fournisseur TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLE MATERIELS
CREATE TABLE materiels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL,
    numero_serie TEXT,
    date_achat BIGINT NOT NULL,
    prix_achat NUMERIC(10,2) NOT NULL, -- Now in USD
    etat TEXT DEFAULT 'Bon' CHECK (etat IN ('Excellent', 'Bon', 'Moyen', 'Défectueux', 'Hors service')),
    derniere_maintenance BIGINT,
    prochaine_maintenance BIGINT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLE VENTES (UPDATED FOR MULTI-SERVICES)
CREATE TABLE ventes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_vente BIGINT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Service', 'Produit')),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_nom TEXT DEFAULT '', -- Optional name
    client_telephone TEXT NOT NULL, -- Phone is mandatory
    coiffeuse_id UUID REFERENCES coiffeuses(id) ON DELETE SET NULL,
    coiffeuse_nom TEXT NOT NULL,
    -- For backward compatibility (single item)
    item_id UUID,
    item_nom TEXT,
    quantite INTEGER DEFAULT 1,
    prix_unitaire NUMERIC(10,2),
    -- For multi-services (new)
    items JSONB, -- Array of {id, nom, prix} for multiple services
    montant_total NUMERIC(10,2) NOT NULL, -- Total in USD
    commission NUMERIC(10,2) DEFAULT 0, -- Commission in USD (services only)
    mode_paiement TEXT NOT NULL CHECK (mode_paiement IN ('Espèces', 'Carte bancaire', 'Mobile Money', 'Chèque')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABLE COMMISSIONS (UPDATED)
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coiffeuse_id UUID REFERENCES coiffeuses(id) ON DELETE CASCADE,
    coiffeuse_nom TEXT NOT NULL,
    periode TEXT NOT NULL, -- e.g., "février 2026"
    nb_services INTEGER DEFAULT 0, -- Number of services rendered
    total_ventes NUMERIC(10,2) DEFAULT 0, -- Total sales in USD
    total_commission NUMERIC(10,2) DEFAULT 0, -- Total commission in USD
    statut TEXT DEFAULT 'Calculé' CHECK (statut IN ('Calculé', 'Payé')),
    date_calcul BIGINT NOT NULL,
    date_paiement BIGINT,
    ventes_detail JSONB, -- Detailed sales for report generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLE CONSOMMABLES (NEW - Stock tracking for salon consumables)
CREATE TABLE consommables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    description TEXT,
    categorie TEXT NOT NULL CHECK (categorie IN ('Soins capillaires', 'Coloration', 'Mèches', 'Produits d''hygiène', 'Vitamines & Compléments', 'Outils jetables', 'Autres')),
    unite TEXT NOT NULL DEFAULT 'Pièce' CHECK (unite IN ('Pièce', 'Litre', 'Millilitre', 'Kilogramme', 'Gramme', 'Paquet', 'Boîte', 'Flacon')),
    stock_actuel NUMERIC(10,2) DEFAULT 0, -- Current stock quantity
    stock_minimum NUMERIC(10,2) DEFAULT 5, -- Minimum threshold for alerts
    prix_achat NUMERIC(10,2) NOT NULL, -- Purchase price in USD
    fournisseur TEXT,
    date_dernier_achat BIGINT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABLE CONSOMMATIONS (NEW - Consumption history)
CREATE TABLE consommations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consommable_id UUID REFERENCES consommables(id) ON DELETE CASCADE,
    consommable_nom TEXT NOT NULL,
    quantite NUMERIC(10,2) NOT NULL, -- Quantity consumed
    unite TEXT NOT NULL,
    coiffeuse_id UUID REFERENCES coiffeuses(id) ON DELETE SET NULL,
    coiffeuse_nom TEXT,
    service_nom TEXT, -- Service for which consumable was used (optional)
    client_nom TEXT, -- Client name (optional)
    date_consommation BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================

CREATE INDEX idx_clients_telephone ON clients(telephone);
CREATE INDEX idx_clients_statut ON clients(statut);
CREATE INDEX idx_clients_nom ON clients(nom); -- For name search
CREATE INDEX idx_coiffeuses_statut ON coiffeuses(statut);
CREATE INDEX idx_rendez_vous_date ON rendez_vous(date_rdv);
CREATE INDEX idx_rendez_vous_statut ON rendez_vous(statut);
CREATE INDEX idx_rendez_vous_client ON rendez_vous(client_id);
CREATE INDEX idx_rendez_vous_coiffeuse ON rendez_vous(coiffeuse_id);
CREATE INDEX idx_ventes_date ON ventes(date_vente);
CREATE INDEX idx_ventes_type ON ventes(type);
CREATE INDEX idx_ventes_client ON ventes(client_id);
CREATE INDEX idx_ventes_coiffeuse ON ventes(coiffeuse_id);
CREATE INDEX idx_commissions_periode ON commissions(periode);
CREATE INDEX idx_commissions_coiffeuse ON commissions(coiffeuse_id);
CREATE INDEX idx_consommables_categorie ON consommables(categorie);
CREATE INDEX idx_consommables_actif ON consommables(actif);
CREATE INDEX idx_consommations_date ON consommations(date_consommation);
CREATE INDEX idx_consommations_consommable ON consommations(consommable_id);
CREATE INDEX idx_consommations_coiffeuse ON consommations(coiffeuse_id);

-- ============================================
-- TRIGGERS POUR UPDATED_AT AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coiffeuses_updated_at BEFORE UPDATE ON coiffeuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rendez_vous_updated_at BEFORE UPDATE ON rendez_vous
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON produits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materiels_updated_at BEFORE UPDATE ON materiels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventes_updated_at BEFORE UPDATE ON ventes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consommables_updated_at BEFORE UPDATE ON consommables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consommations_updated_at BEFORE UPDATE ON consommations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Function to get client display name
CREATE OR REPLACE FUNCTION get_client_display_name(client_nom TEXT, client_telephone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF client_nom IS NULL OR client_nom = '' THEN
        RETURN 'Client ' || client_telephone;
    ELSE
        RETURN client_nom;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- POLITIQUES RLS (ROW LEVEL SECURITY) - Optional
-- ============================================

-- Enable RLS on all tables (recommended for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coiffeuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consommables ENABLE ROW LEVEL SECURITY;
ALTER TABLE consommations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Only authenticated users can read their own profile
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
-- Only gerants can read all users
CREATE POLICY "Gerants can read all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerant')
);
-- Only gerants can insert/update/delete users
CREATE POLICY "Gerants can manage users" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerant')
);

-- Create policies (allow all authenticated users for other tables)
CREATE POLICY "Allow all for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON coiffeuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON rendez_vous FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON produits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON materiels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON ventes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON commissions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON consommables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON consommations FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- NOTES DE MIGRATION
-- ============================================

/*
CHANGEMENTS PAR RAPPORT À LA VERSION 1:

1. DEVISE : Tous les montants sont maintenant en USD (au lieu de XAF)
   - Le taux de change USD↔CDF est géré côté frontend (localStorage)
   
2. CLIENTS :
   - Nom et Email sont maintenant OPTIONNELS
   - Téléphone est UNIQUE et obligatoire
   - Affichage : "Client +téléphone" si pas de nom
   
3. COIFFEUSES :
   - Commission: 15-40% (au lieu de 20-35%)
   
4. RENDEZ-VOUS :
   - Nouveau statut: "Reporté"
   - Nouveau champ: rdv_precedent_id (lien vers RDV précédent)
   - Nouveau champ: client_telephone (pour affichage direct)
   
5. VENTES :
   - Nouveau champ: items (JSONB) pour multi-services
   - client_nom maintenant OPTIONNEL
   - client_telephone maintenant OBLIGATOIRE
   - item_nom, item_id, quantite, prix_unitaire gardés pour compatibilité
   
6. COMMISSIONS :
   - Nouveau champ: nb_services
   - Nouveau champ: ventes_detail (JSONB) pour rapports détaillés
   
7. INDEX :
   - Ajout d'index sur client_id et coiffeuse_id dans ventes et rendez_vous
   - Ajout d'index sur nom dans clients
*/
