// LocalDB Manager - localStorage database simulation
const LocalDB = {
    // Initialize tables
    init() {
        const tables = ['clients', 'coiffeuses', 'services', 'rendez_vous', 'produits', 'materiels', 'consommables', 'consommations', 'ventes', 'commissions'];
        tables.forEach(table => {
            if (!localStorage.getItem(table)) {
                localStorage.setItem(table, JSON.stringify([]));
            }
        });
        
        // Load demo data if first time
        if (!localStorage.getItem('glamsalon_demo_loaded')) {
            this.loadDemoData();
            localStorage.setItem('glamsalon_demo_loaded', 'true');
        }
    },
    
    // Get all records from a table
    getAll(table) {
        const data = localStorage.getItem(table);
        return data ? JSON.parse(data) : [];
    },
    
    // Get a single record by ID
    getById(table, id) {
        const records = this.getAll(table);
        return records.find(r => r.id === id);
    },
    
    // Create a new record
    create(table, data) {
        console.log('[LocalDB] CREATE:', table, data);
        const records = this.getAll(table);
        records.push(data);
        localStorage.setItem(table, JSON.stringify(records));
        console.log('[LocalDB] CREATE SUCCESS:', table, 'Total records:', records.length);
        return data;
    },
    
    // Update a record
    update(table, id, data) {
        const records = this.getAll(table);
        const index = records.findIndex(r => r.id === id);
        if (index !== -1) {
            records[index] = data;
            localStorage.setItem(table, JSON.stringify(records));
        }
        return data;
    },
    
    // Delete a record
    delete(table, id) {
        let records = this.getAll(table);
        records = records.filter(r => r.id !== id);
        localStorage.setItem(table, JSON.stringify(records));
        return true;
    },
    
    // Clear a table
    clear(table) {
        localStorage.setItem(table, JSON.stringify([]));
    },
    
    // Export all data
    exportData() {
        const data = {};
        const tables = ['clients', 'coiffeuses', 'services', 'rendez_vous', 'produits', 'materiels', 'consommables', 'consommations', 'ventes', 'commissions'];
        tables.forEach(table => {
            data[table] = this.getAll(table);
        });
        return JSON.stringify(data, null, 2);
    },
    
    // Import data
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.keys(data).forEach(table => {
                localStorage.setItem(table, JSON.stringify(data[table]));
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },
    
    // Load demo data
    loadDemoData() {
        // Clear existing data
        this.clear('clients');
        this.clear('coiffeuses');
        this.clear('services');
        this.clear('rendez_vous');
        this.clear('produits');
        this.clear('materiels');
        this.clear('consommables');
        this.clear('consommations');
        this.clear('ventes');
        this.clear('commissions');
        
        // Services
        const services = [
            { id: 'srv1', nom: 'Coupe Femme', description: 'Coupe classique ou moderne', prix: 5000, duree: 30, categorie: 'Coupe', actif: true },
            { id: 'srv2', nom: 'Coupe + Brushing', description: 'Coupe avec mise en forme', prix: 8000, duree: 60, categorie: 'Coupe', actif: true },
            { id: 'srv3', nom: 'Coloration Complète', description: 'Coloration de toute la chevelure', prix: 15000, duree: 120, categorie: 'Coloration', actif: true },
            { id: 'srv4', nom: 'Mèches', description: 'Mèches sur cheveux', prix: 12000, duree: 90, categorie: 'Coloration', actif: true },
            { id: 'srv5', nom: 'Défrisage', description: 'Lissage permanent', prix: 20000, duree: 180, categorie: 'Traitement', actif: true },
            { id: 'srv6', nom: 'Coiffage Mariage', description: 'Coiffure élaborée pour mariage', prix: 25000, duree: 120, categorie: 'Coiffage', actif: true },
            { id: 'srv7', nom: 'Tresses', description: 'Différents styles de tresses', prix: 10000, duree: 150, categorie: 'Coiffage', actif: true },
            { id: 'srv8', nom: 'Soin Hydratant', description: 'Masque et soin profond', prix: 7000, duree: 45, categorie: 'Soins', actif: true }
        ];
        services.forEach(s => this.create('services', s));
        
        // Coiffeuses
        const coiffeuses = [
            { id: 'coif1', nom: 'Marie Diop', telephone: '+221 77 123 45 67', email: 'marie@glamsalon.sn', specialites: ['Coupe', 'Coloration'], taux_commission: 30, statut: 'Actif', date_embauche: new Date('2023-01-15').getTime(), photo_url: '' },
            { id: 'coif2', nom: 'Aïcha Ndiaye', telephone: '+221 77 234 56 78', email: 'aicha@glamsalon.sn', specialites: ['Coiffage', 'Tresses'], taux_commission: 25, statut: 'Actif', date_embauche: new Date('2023-03-20').getTime(), photo_url: '' },
            { id: 'coif3', nom: 'Fatou Sall', telephone: '+221 77 345 67 89', email: 'fatou@glamsalon.sn', specialites: ['Défrisage', 'Soins'], taux_commission: 20, statut: 'Actif', date_embauche: new Date('2023-06-10').getTime(), photo_url: '' }
        ];
        coiffeuses.forEach(c => this.create('coiffeuses', c));
        
        // Clients
        const clients = [
            { id: 'cli1', nom: 'Aminata Fall', telephone: '+221 77 111 22 33', email: 'aminata@email.com', date_naissance: new Date('1990-05-15').getTime(), adresse: 'Dakar, Plateau', preferences: 'Préfère Marie pour les coupes', points_fidelite: 150, statut: 'VIP', date_inscription: new Date('2023-01-10').getTime() },
            { id: 'cli2', nom: 'Khady Sarr', telephone: '+221 77 222 33 44', email: 'khady@email.com', date_naissance: new Date('1985-08-20').getTime(), adresse: 'Dakar, Mermoz', preferences: 'Aime les colorations', points_fidelite: 80, statut: 'Actif', date_inscription: new Date('2023-02-15').getTime() },
            { id: 'cli3', nom: 'Mariama Diallo', telephone: '+221 77 333 44 55', email: 'mariama@email.com', date_naissance: new Date('1995-12-03').getTime(), adresse: 'Dakar, Almadies', preferences: 'Tresses africaines', points_fidelite: 120, statut: 'VIP', date_inscription: new Date('2023-03-01').getTime() },
            { id: 'cli4', nom: 'Binta Sy', telephone: '+221 77 444 55 66', email: 'binta@email.com', date_naissance: new Date('1992-07-10').getTime(), adresse: 'Dakar, Ouakam', preferences: '', points_fidelite: 30, statut: 'Actif', date_inscription: new Date('2023-10-20').getTime() }
        ];
        clients.forEach(c => this.create('clients', c));
        
        // Produits
        const produits = [
            { id: 'prod1', nom: 'Shampoing Hydratant', description: 'Shampoing pour cheveux secs', categorie: 'Shampoing', prix_achat: 2000, prix_vente: 3500, stock_actuel: 15, stock_minimum: 5, fournisseur: 'Beauty Supply', actif: true },
            { id: 'prod2', nom: 'Après-shampoing Réparateur', description: 'Après-shampoing intense', categorie: 'Après-shampoing', prix_achat: 2500, prix_vente: 4000, stock_actuel: 12, stock_minimum: 5, fournisseur: 'Beauty Supply', actif: true },
            { id: 'prod3', nom: 'Masque Capillaire', description: 'Masque nourrissant', categorie: 'Masque', prix_achat: 3000, prix_vente: 5000, stock_actuel: 8, stock_minimum: 5, fournisseur: 'Pro Hair', actif: true },
            { id: 'prod4', nom: 'Crème Défrisante', description: 'Défrisant sans soude', categorie: 'Coloration', prix_achat: 5000, prix_vente: 8000, stock_actuel: 3, stock_minimum: 5, fournisseur: 'Pro Hair', actif: true },
            { id: 'prod5', nom: 'Gel Coiffant', description: 'Gel tenue forte', categorie: 'Styling', prix_achat: 1500, prix_vente: 2500, stock_actuel: 20, stock_minimum: 10, fournisseur: 'Beauty Supply', actif: true },
            { id: 'prod6', nom: 'Huile de Coco', description: 'Huile naturelle', categorie: 'Soins', prix_achat: 2000, prix_vente: 3500, stock_actuel: 10, stock_minimum: 5, fournisseur: 'Nature Plus', actif: true }
        ];
        produits.forEach(p => this.create('produits', p));
        
        // Matériels
        const materiels = [
            { id: 'mat1', nom: 'Fauteuil Salon Pro', categorie: 'Fauteuil', numero_serie: 'FS-2023-001', date_achat: new Date('2023-01-10').getTime(), prix_achat: 150000, etat: 'Excellent', derniere_maintenance: null, prochaine_maintenance: null, notes: '' },
            { id: 'mat2', nom: 'Séchoir Professionnel', categorie: 'Séchoir', numero_serie: 'SP-2023-002', date_achat: new Date('2023-01-10').getTime(), prix_achat: 80000, etat: 'Bon', derniere_maintenance: new Date('2024-01-15').getTime(), prochaine_maintenance: new Date('2024-07-15').getTime(), notes: 'Entretien régulier' },
            { id: 'mat3', nom: 'Fer à Lisser Titanium', categorie: 'Fer', numero_serie: 'FL-2023-003', date_achat: new Date('2023-02-20').getTime(), prix_achat: 35000, etat: 'Excellent', derniere_maintenance: null, prochaine_maintenance: null, notes: '' },
            { id: 'mat4', nom: 'Tondeuse Sans Fil', categorie: 'Tondeuse', numero_serie: 'TN-2023-004', date_achat: new Date('2023-03-15').getTime(), prix_achat: 25000, etat: 'Bon', derniere_maintenance: new Date('2024-02-01').getTime(), prochaine_maintenance: new Date('2024-08-01').getTime(), notes: 'Batteries à vérifier' }
        ];
        materiels.forEach(m => this.create('materiels', m));
        
        // Consommables
        const consommables = [
            { id: 'cons1', nom: 'Shampoing Professionnel 1L', description: 'Shampoing salon usage intensif', categorie: 'Soins capillaires', unite: 'Litre', stock_actuel: 3.5, stock_minimum: 2, prix_achat: 8, fournisseur: 'Beauty Supply', date_dernier_achat: new Date('2024-01-15').getTime(), actif: true },
            { id: 'cons2', nom: 'Mèches Brésiliennes (paquet)', description: 'Mèches 100% naturelles 50cm', categorie: 'Mèches', unite: 'Paquet', stock_actuel: 8, stock_minimum: 5, prix_achat: 35, fournisseur: 'Hair Import', date_dernier_achat: new Date('2024-02-01').getTime(), actif: true },
            { id: 'cons3', nom: 'Gel Coiffant 500ml', description: 'Gel tenue extra-forte', categorie: 'Soins capillaires', unite: 'Flacon', stock_actuel: 12, stock_minimum: 8, prix_achat: 5, fournisseur: 'Beauty Supply', date_dernier_achat: new Date('2024-01-20').getTime(), actif: true },
            { id: 'cons4', nom: 'Colorant Professionnel', description: 'Tube coloration 60ml (couleurs variées)', categorie: 'Coloration', unite: 'Pièce', stock_actuel: 25, stock_minimum: 15, prix_achat: 4, fournisseur: 'Pro Hair', date_dernier_achat: new Date('2024-02-10').getTime(), actif: true },
            { id: 'cons5', nom: 'Savon Liquide 5L', description: 'Savon antibactérien pour mains', categorie: 'Produits d\'hygiène', unite: 'Litre', stock_actuel: 15, stock_minimum: 5, prix_achat: 12, fournisseur: 'Hygiène Plus', date_dernier_achat: new Date('2024-01-10').getTime(), actif: true },
            { id: 'cons6', nom: 'Spray Démêlant 250ml', description: 'Spray facilite le coiffage', categorie: 'Soins capillaires', unite: 'Flacon', stock_actuel: 6, stock_minimum: 10, prix_achat: 6, fournisseur: 'Beauty Supply', date_dernier_achat: new Date('2024-01-25').getTime(), actif: true },
            { id: 'cons7', nom: 'Vitamines Capillaires (boîte)', description: 'Compléments pour cheveux sains', categorie: 'Vitamines & Compléments', unite: 'Boîte', stock_actuel: 4, stock_minimum: 3, prix_achat: 15, fournisseur: 'Nature Plus', date_dernier_achat: new Date('2024-02-05').getTime(), actif: true },
            { id: 'cons8', nom: 'Gants Jetables (boîte 100)', description: 'Gants nitrile usage unique', categorie: 'Outils jetables', unite: 'Boîte', stock_actuel: 3, stock_minimum: 5, prix_achat: 8, fournisseur: 'Hygiène Plus', date_dernier_achat: new Date('2024-01-30').getTime(), actif: true },
            { id: 'cons9', nom: 'Serviettes Papier (paquet)', description: 'Serviettes absorbantes usage unique', categorie: 'Outils jetables', unite: 'Paquet', stock_actuel: 10, stock_minimum: 8, prix_achat: 3, fournisseur: 'Hygiène Plus', date_dernier_achat: new Date('2024-02-12').getTime(), actif: true }
        ];
        consommables.forEach(c => this.create('consommables', c));
        
        // Define now before using it
        const now = Date.now();
        
        // Consommations (historique)
        const consommations = [
            { id: 'conso1', consommable_id: 'cons1', consommable_nom: 'Shampoing Professionnel 1L', quantite: -0.3, unite: 'Litre', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', service_nom: 'Coupe + Brushing', client_nom: 'Aminata Fall', date_consommation: now - 86400000, notes: '' },
            { id: 'conso2', consommable_id: 'cons2', consommable_nom: 'Mèches Brésiliennes (paquet)', quantite: -2, unite: 'Paquet', coiffeuse_id: 'coif2', coiffeuse_nom: 'Aïcha Ndiaye', service_nom: 'Tresses', client_nom: 'Mariama Diallo', date_consommation: now - 43200000, notes: '' },
            { id: 'conso3', consommable_id: 'cons3', consommable_nom: 'Gel Coiffant 500ml', quantite: -1, unite: 'Flacon', coiffeuse_id: 'coif2', coiffeuse_nom: 'Aïcha Ndiaye', service_nom: 'Coiffage', client_nom: 'Khady Sarr', date_consommation: now - 21600000, notes: '' },
            { id: 'conso4', consommable_id: 'cons4', consommable_nom: 'Colorant Professionnel', quantite: -3, unite: 'Pièce', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', service_nom: 'Coloration Complète', client_nom: 'Khady Sarr', date_consommation: now - 86400000, notes: 'Couleur châtain' },
            { id: 'conso5', consommable_id: 'cons6', consommable_nom: 'Spray Démêlant 250ml', quantite: 15, unite: 'Flacon', coiffeuse_id: null, coiffeuse_nom: 'Réapprovisionnement', service_nom: null, client_nom: null, date_consommation: now - 172800000, notes: 'Réapprovisionnement (+15 Flacon)' }
        ];
        consommations.forEach(c => this.create('consommations', c));
        
        // Rendez-vous
        const rdv = [
            { id: 'rdv1', client_id: 'cli1', client_nom: 'Aminata Fall', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', service_id: 'srv2', service_nom: 'Coupe + Brushing', date_rdv: now + 3600000, duree: 60, prix: 8000, statut: 'Confirmé', notes: '' },
            { id: 'rdv2', client_id: 'cli2', client_nom: 'Khady Sarr', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', service_id: 'srv3', service_nom: 'Coloration Complète', date_rdv: now + 7200000, duree: 120, prix: 15000, statut: 'Programmé', notes: 'Prévoir test allergie' },
            { id: 'rdv3', client_id: 'cli3', client_nom: 'Mariama Diallo', coiffeuse_id: 'coif2', coiffeuse_nom: 'Aïcha Ndiaye', service_id: 'srv7', service_nom: 'Tresses', date_rdv: now + 10800000, duree: 150, prix: 10000, statut: 'Programmé', notes: '' },
            { id: 'rdv4', client_id: 'cli4', client_nom: 'Binta Sy', coiffeuse_id: 'coif3', coiffeuse_nom: 'Fatou Sall', service_id: 'srv5', service_nom: 'Défrisage', date_rdv: now + 14400000, duree: 180, prix: 20000, statut: 'Programmé', notes: '' }
        ];
        rdv.forEach(r => this.create('rendez_vous', r));
        
        // Ventes (exemples)
        const ventes = [
            { id: 'vent1', date_vente: now - 86400000, type: 'Service', client_id: 'cli1', client_nom: 'Aminata Fall', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', item_id: 'srv1', item_nom: 'Coupe Femme', quantite: 1, prix_unitaire: 5000, montant_total: 5000, commission: 1500, mode_paiement: 'Espèces' },
            { id: 'vent2', date_vente: now - 86400000, type: 'Service', client_id: 'cli2', client_nom: 'Khady Sarr', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', item_id: 'srv3', item_nom: 'Coloration Complète', quantite: 1, prix_unitaire: 15000, montant_total: 15000, commission: 4500, mode_paiement: 'Carte' },
            { id: 'vent3', date_vente: now - 43200000, type: 'Produit', client_id: 'cli1', client_nom: 'Aminata Fall', coiffeuse_id: 'coif1', coiffeuse_nom: 'Marie Diop', item_id: 'prod1', item_nom: 'Shampoing Hydratant', quantite: 2, prix_unitaire: 3500, montant_total: 7000, commission: 0, mode_paiement: 'Espèces' },
            { id: 'vent4', date_vente: now - 43200000, type: 'Service', client_id: 'cli3', client_nom: 'Mariama Diallo', coiffeuse_id: 'coif2', coiffeuse_nom: 'Aïcha Ndiaye', item_id: 'srv7', item_nom: 'Tresses', quantite: 1, prix_unitaire: 10000, montant_total: 10000, commission: 2500, mode_paiement: 'Mobile Money' },
            { id: 'vent5', date_vente: now - 3600000, type: 'Service', client_id: 'cli4', client_nom: 'Binta Sy', coiffeuse_id: 'coif3', coiffeuse_nom: 'Fatou Sall', item_id: 'srv8', item_nom: 'Soin Hydratant', quantite: 1, prix_unitaire: 7000, montant_total: 7000, commission: 1400, mode_paiement: 'Espèces' }
        ];
        ventes.forEach(v => this.create('ventes', v));
        
        console.log('✅ Données de démonstration chargées avec succès !');
    }
};

// Initialize on load
LocalDB.init();
