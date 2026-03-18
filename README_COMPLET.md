# 💇‍♀️ JL Beauty System - Système de Gestion de Salon de Coiffure

## 📋 Vue d'ensemble

**JL Beauty System** est un système de gestion complet pour salons de coiffure, optimisé pour le marché de la République Démocratique du Congo. Le système gère les clients, rendez-vous, services, ventes, stocks, matériels et commissions.

### 🎯 Version actuelle : 2.3
**Date de mise à jour :** 5 mars 2026 (Système d'authentification ajouté)

---

## 🔐 Nouveautés Version 2.3 (5 Mars 2026)

### 🔒 Système d'Authentification Complet

**Connexion obligatoire** pour accéder au système, avec **2 rôles d'utilisateurs** :

#### 👔 Gérant (Administrateur)
- ✅ **Accès TOTAL** à tous les modules
- ✅ Gestion des coiffeuses, services, produits, matériels
- ✅ Calcul et export des commissions
- ✅ Tous les privilèges

#### 💼 Caissière (Opératrice)
- ✅ Accès : Tableau de bord (lecture), Rendez-vous (lecture), Clients, Ventes, Consommables
- ❌ Modules masqués : Coiffeuses, Services, Produits, Matériels, **Commissions**
- ✅ Peut enregistrer des ventes et consommations
- ✅ Ne peut pas modifier les tarifs ni voir les commissions

**Comptes par défaut :**

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@jlbeauty.com | Admin123! | Gérant |
| marie@jlbeauty.com | Caisse123! | Caissière |
| caisse@jlbeauty.com | Caisse123! | Caissière |

**Fonctionnalités :**
- 🔐 Page de connexion moderne (`login.html`)
- 🔒 Protection automatique de toutes les pages
- 👤 Affichage du nom et rôle de l'utilisateur connecté
- 🚪 Bouton de déconnexion sécurisé
- 🔑 Authentification localStorage (version locale) et Supabase Auth (version production)
- 🛡️ Masquage automatique des modules selon les permissions

**📖 Guide complet :** Voir `GUIDE_AUTHENTIFICATION.md`

---

## 🆕 Nouveautés Version 2.2 (24 Février 2026)

### 💱 Système de Devises USD ↔ CDF
- **Devise principale :** Dollar américain (USD)
- **Devise secondaire :** Franc congolais (CDF)
- **Taux de change paramétrable** : Vous pouvez modifier le taux 1 USD = X CDF à tout moment
- **Sélecteur de devise** dans le header pour basculer entre USD et CDF
- **Affichage automatique** dans la devise choisie partout dans le système

**Comment modifier le taux de change :**
1. Cliquez sur l'icône d'échange (🔄) dans le header
2. Entrez le nouveau taux (ex: 1 USD = 2850 CDF)
3. Le système met à jour tous les montants automatiquement

---

### 👥 Module Clients Amélioré

**Changements majeurs :**
- ✅ **Nom et Email maintenant FACULTATIFS** - Seul le téléphone est obligatoire
- ✅ Affichage automatique "Client +243 XXX XXX XXX" pour les clients sans nom
- ✅ Création rapide de clients anonymes
- ✅ Recherche par téléphone, nom ou email

**Cas d'usage :**
- Client refuse de donner son nom → Enregistrez juste son téléphone
- Client régulier → Nom complet + email + fidélité
- Client VIP → Statut VIP + préférences personnalisées

---

### 📅 Module Rendez-vous Amélioré

**Nouvelles fonctionnalités :**

1. **Nouveau statut "Reporté"**
   - Marque l'ancien RDV comme "Reporté"
   - Crée automatiquement un nouveau RDV avec lien vers l'ancien
   - Historique complet des reports
   - Raison du report enregistrée

2. **Création de client à la volée**
   - Bouton radio pour choisir "Client existant" ou "Nouveau client"
   - Création immédiate du client depuis le formulaire de RDV
   - Téléphone obligatoire, nom facultatif
   - Le client est automatiquement ajouté à la base

**Statuts disponibles :**
- 🔵 Programmé
- 🟢 Confirmé
- 🟡 En cours
- ⚪ Terminé
- 🔴 Annulé
- 🟠 Reporté *(nouveau)*
- ⚠️ Absent

---

### 💰 Module Ventes Multi-Services & Multi-Coiffeuses

**Révolution majeure :** Un client peut maintenant sélectionner **PLUSIEURS services** réalisés par **PLUSIEURS coiffeuses différentes** dans une seule vente !

**Exemple concret :**
```
Client : +243 XXX XXX XXX (nom facultatif)

Service 1 : Lavage de tête - $5 → Coiffeuse : Marie (20% commission)
Service 2 : Tresse africaine - $25 → Coiffeuse : Sophie (25% commission)
Service 3 : Pose perruque - $15 → Coiffeuse : Marie (20% commission)
------------------------
TOTAL : $45
Commission Marie : $4 + $3 = $7 (Services 1 & 3)
Commission Sophie : $6.25 (Service 2)
Commission TOTALE : $13.25
```

**Fonctionnalités :**
- ✅ **Téléphone obligatoire**, nom facultatif
- ✅ **Chaque service est attribué à une coiffeuse spécifique**
- ✅ Ajout dynamique de lignes "Service + Coiffeuse"
- ✅ Calcul automatique du total et commission par coiffeuse
- ✅ Affichage groupé "X services + Y coiffeuses" dans la liste
- ✅ Détail complet au clic avec répartition par coiffeuse

**Modes de paiement :**
- 💵 Espèces
- 💳 Carte bancaire
- 📱 Mobile Money
- 🏦 Chèque

---

### 👩‍🦰 Module Coiffeuses

**Changement de commission :**
- **Ancienne plage :** 20-35%
- **Nouvelle plage :** **15-40%** ✨
- Permet de récompenser les meilleures performeuses
- Flexibilité pour les débutantes

---

### 💲 Flexibilité Totale sur les Prix

**Restrictions supprimées :**
- ✅ **Produits** : Prix d'achat et vente sans minimum (ex: $1 ou $0.50)
- ✅ **Services** : Tarifs de tous montants (ex: $5 lavage, $100 coiffure de mariage)
- ✅ **Matériels** : Prix d'achat flexible
- ✅ **Step de 0.01** conservé pour précision des centimes

**Exemples maintenant acceptés :**
- Shampoing : Achat $2, Vente $5 ✅
- Lavage express : $3 ✅
- Retouche : $8 ✅
- Coiffure de luxe : $200 ✅

---

### 📊 Dashboard Complètement Refait

**Nouveaux graphiques :**

1. **Évolution sur 30 jours** (Graphique interactif)
   - Bouton "Chiffre d'affaire" → Courbe du CA sur 30 jours
   - Bouton "Nouveaux clients" → Graphique en barres des inscriptions

2. **Top 3 Coiffeuses du mois**
   - 🥇 🥈 🥉 Classement par CA généré
   - Affichage avec médailles
   - Mise à jour automatique chaque mois

3. **Top 5 Clients (Plus gros dépensiers)**
   - Classement par montant total dépensé
   - Nom + téléphone + montant
   - Identifier les clients VIP

**Graphiques existants optimisés :**
- ✅ Revenus des 7 derniers jours (courbe lisse)
- ✅ Services les plus demandés (camembert coloré)
- ✅ Hauteur fixe pour tous les graphiques (300-350px)
- ✅ Responsive sur mobile
- ✅ Couleurs cohérentes

---

### 💼 Module Commissions Avancé

**Rapport individuel par coiffeur :**

Cliquez sur l'icône 📄 pour générer un rapport détaillé contenant :
- Nombre de services rendus
- CA total généré
- Commission totale (calculée par service)
- Liste détaillée de toutes les ventes avec service et coiffeuse
- Date, client, service, montant, commission

**⚠️ Important : Multi-coiffeuses**
- Le calcul des commissions ventile correctement par coiffeuse
- Si 3 services sont réalisés par 2 coiffeuses différentes, chaque coiffeuse reçoit sa commission sur les services qu'elle a réalisés
- Le rapport affiche uniquement les services de la coiffeuse concernée

**Export en 3 formats :**
1. **HTML** → Bouton d'impression intégré 🖨️ (optimisé pour l'impression)
2. **CSV** → Ouvrir dans Excel/LibreOffice
3. **PDF** → Via le bouton "Imprimer" du navigateur dans le rapport HTML

**Exemple de rapport :**
```
═══════════════════════════════════════
RAPPORT COMMISSION - Marie Dupont
Période : Février 2026
═══════════════════════════════════════

📊 STATISTIQUES
Services rendus : 45
CA généré : $850.00
Commission (25%) : $212.50

✂️ RÉPARTITION PAR SERVICE
- Coupe homme (12x)
- Tresse (8x)
- Coloration (5x)
...

📋 DÉTAIL DES VENTES
[Table complète avec date, client, service, montant, commission]
```

---

### 🧴 Module Consommables ⭐ NOUVEAU

**Suivi des produits consommés dans le salon** (ajouté le 24 février 2026)

Le module Consommables permet de gérer le stock des produits et matériaux utilisés lors des prestations (shampoings, gels, mèches, colorations, gants jetables, etc.).

**Différence avec les autres modules :**
- **Produits** = Vendus aux clients (ex: shampoing à emporter)
- **Matériels** = Équipements du salon (ex: sèche-cheveux)
- **Consommables** ⭐ = Utilisés pendant les services (ex: shampoing pour laver, mèches pour tresses)

**Fonctionnalités principales :**
1. **Gestion du stock**
   - Nom, description, catégorie
   - Unité de mesure (Pièce, Litre, Gramme, Paquet, etc.)
   - Stock actuel / Stock minimum (alertes automatiques)
   - Prix d'achat (USD), fournisseur

2. **7 Catégories disponibles :**
   - Soins capillaires (shampoings, après-shampoings, etc.)
   - Coloration (colorants, décolorants, etc.)
   - Mèches (mèches brésiliennes, péruviennes, etc.)
   - Produits d'hygiène (savon, désinfectant, etc.)
   - Vitamines & Compléments
   - Outils jetables (gants, serviettes, etc.)
   - Autres

3. **Enregistrement des consommations**
   - Quel consommable utilisé
   - Quelle quantité
   - Par quelle coiffeuse
   - Pour quel service (facultatif)
   - Pour quel client (facultatif)
   - **Stock mis à jour automatiquement** ✅

4. **Réapprovisionnement**
   - Ajout de stock
   - Mise à jour du prix d'achat
   - Historique complet

5. **Alertes de stock**
   - Affichage dans le Dashboard (section dédiée)
   - Badge orange ⚠️ pour les consommables
   - Lignes surlignées en rouge dans le tableau

6. **Statistiques**
   - Total consommables actifs
   - Nombre d'alertes de stock
   - Valeur totale du stock (en USD)

**Exemple d'utilisation :**
```
Scénario : Marie utilise du shampoing pour un service "Coupe + Brushing"

1. Cliquer sur "Enregistrer une consommation"
2. Consommable : Shampoing Professionnel 1L
3. Quantité : 0.2 (Litre)
4. Coiffeuse : Marie Diop
5. Service : Coupe + Brushing
6. Client : Aminata Fall

→ Stock passe de 3.5L à 3.3L automatiquement ✅
→ Historique enregistré ✅
→ Si stock < minimum : alerte dans Dashboard ⚠️
```

**Guide complet :** Consultez `MODULE_CONSOMMABLES.md` pour tous les détails

---

## 🗂️ Structure des Fichiers

```
JL-Beauty-System/
├── index-local.html          # Page principale (version locale)
├── index-supabase.html       # Page principale (version Supabase)
├── supabase-schema.sql       # Schéma de base de données
├── js/
│   ├── currency-config.js    # ✨ Configuration USD/CDF
│   ├── localdb.js           # Base de données locale (localStorage)
│   ├── utils-local.js       # 🔧 Fonctions utilitaires (locale)
│   ├── app.js               # Contrôleur principal
│   ├── dashboard.js         # 📊 Dashboard refait (graphiques)
│   ├── clients.js           # 👥 Gestion clients (nom facultatif)
│   ├── coiffeuses.js        # 👩‍🦰 Gestion coiffeuses (15-40%)
│   ├── services.js          # ✂️ Gestion services
│   ├── rendez-vous.js       # 📅 RDV (reporté + nouveau client)
│   ├── produits.js          # 📦 Gestion produits
│   ├── materiels.js         # 🔧 Gestion matériels
│   ├── ventes.js            # 💰 Ventes (multi-services)
│   └── commissions.js       # 💼 Commissions (rapport PDF/CSV)
└── README.md                # 📖 Ce fichier
```

---

## 🚀 Démarrage Rapide

### Version Locale (Sans serveur)

1. **Télécharger le projet**
   - Téléchargez le ZIP depuis Genspark
   - Extrayez dans un dossier

2. **Ouvrir le fichier**
   ```
   Double-cliquez sur : index-local.html
   ```

3. **Charger les données de démo**
   - Au premier lancement, cliquez sur "Reset" dans le header
   - Des données d'exemple seront chargées

4. **Configurer le taux de change**
   - Cliquez sur l'icône 🔄 dans le header
   - Entrez votre taux (ex: 1 USD = 2850 CDF)

### Version Production (Supabase)

1. **Créer un compte Supabase**
   - Allez sur https://supabase.com
   - Créez un projet (région Europe West)

2. **Exécuter le schéma SQL**
   - Ouvrez SQL Editor dans Supabase
   - Copiez tout le contenu de `supabase-schema.sql`
   - Exécutez (Run)

3. **Configurer les clés API**
   - Récupérez votre Project URL et anon key
   - Modifiez `js/supabase-config.js` :
   ```javascript
   const SUPABASE_URL = 'votre-url';
   const SUPABASE_ANON_KEY = 'votre-clé';
   ```

4. **Ouvrir l'application**
   - Double-cliquez sur `index-supabase.html`

---

## 📖 Guide d'Utilisation

### 1. Gestion des Clients

**Ajouter un client :**
1. Clients → Ajouter un client
2. **Téléphone*** (obligatoire) : +243 XXX XXX XXX
3. **Nom** (facultatif) : Laissez vide pour client anonyme
4. Email, adresse, préférences (tous facultatifs)
5. Points de fidélité : 0 par défaut
6. Statut : Actif / VIP / Inactif

**Rechercher :**
- Tapez dans la barre de recherche (nom, téléphone ou email)
- Filtrez par statut

### 2. Prise de Rendez-vous

**Méthode 1 : Client existant**
1. Rendez-vous → Nouveau rendez-vous
2. Cochez "Client existant"
3. Sélectionnez le client dans la liste
4. Choisissez coiffeuse, service, date, heure

**Méthode 2 : Nouveau client**
1. Rendez-vous → Nouveau rendez-vous
2. Cochez "Nouveau client"
3. Entrez téléphone* + nom (facultatif)
4. Le client sera créé automatiquement
5. Continuez avec coiffeuse, service, date, heure

**Reporter un RDV :**
1. Cliquez sur l'icône 📅 dans les actions
2. Entrez la nouvelle date/heure
3. Indiquez la raison (ex: client indisponible)
4. L'ancien RDV sera marqué "Reporté"
5. Un nouveau RDV sera créé automatiquement

### 3. Enregistrer une Vente

**Vente Multi-Services :**
1. Ventes → Enregistrer une vente
2. Type : **Service(s)**
3. Coiffeuse : Sélectionnez
4. **Client :**
   - Téléphone* : +243 XXX XXX XXX
   - Nom (facultatif) : Laissez vide si anonyme
5. **Services :** Cochez tous les services réalisés
   - ✓ Lavage
   - ✓ Tresse
   - ✓ Maquillage
6. Total calculé automatiquement
7. Commission calculée sur tous les services
8. Mode de paiement : Espèces / Carte / Mobile Money

**Vente Produit :**
1. Type : **Produit**
2. Sélectionnez le produit
3. Quantité
4. Stock mis à jour automatiquement

### 4. Calculer les Commissions

1. Commissions → Calculer les commissions du mois
2. Le système parcourt toutes les ventes de services du mois
3. Calcule la commission pour chaque coiffeuse
4. Génère un enregistrement par coiffeuse

**Voir le rapport détaillé :**
1. Cliquez sur l'icône 📄 à côté de la coiffeuse
2. Consultez le rapport avec :
   - Stats (services, CA, commission)
   - Répartition par service
   - Liste détaillée des ventes
3. Exportez en HTML ou CSV

**Marquer comme payée :**
- Cliquez sur l'icône ✓ verte
- La commission passe en statut "Payé"

---

## 💡 Astuces et Conseils

### Gestion des Clients Anonymes

**Pourquoi ?**
- Certains clients ne veulent pas donner leur nom
- Vous gardez quand même leur historique via le téléphone
- Fidélisation possible même sans nom

**Comment :**
1. Enregistrez juste le téléphone : +243 XXX XXX XXX
2. Laissez le nom vide
3. Le système affiche "Client +243 XXX XXX XXX"
4. Historique complet conservé

### Optimiser les Rendez-vous

**Évitez les absents :**
1. Confirmez les RDV par SMS/WhatsApp
2. Marquez "Confirmé" quand le client répond
3. Clients "Absent" → Statut "Inactif" après 3 fois

**Gérez les reports :**
1. Utilisez le bouton "Reporter" (ne supprimez pas)
2. Gardez l'historique complet
3. Analysez les raisons fréquentes

### Maximiser les Ventes

**Multi-services :**
- Proposez des combos (lavage + coupe + coloration)
- Une seule transaction = plus simple
- Commission calculée sur l'ensemble

**Fidélisation :**
- Points de fidélité automatiques
- Clients VIP → Réductions / Priorités
- Historique complet consultable

---

## 🔧 Maintenance

### Sauvegarde des Données (Version Locale)

**Export :**
1. Cliquez sur "Export" dans le header
2. Fichier JSON téléchargé : `glamsalon-backup-YYYY-MM-DD.json`
3. Conservez ce fichier en sécurité

**Import :**
1. Cliquez sur "Import"
2. Sélectionnez votre fichier de sauvegarde
3. Les données sont restaurées

**Recommandation :** Exportez vos données **chaque fin de journée** ou **chaque semaine**.

### Mise à Jour du Taux de Change

Le taux USD ↔ CDF peut fluctuer. Pour le mettre à jour :
1. Consultez le taux du jour (ex: Banque Centrale du Congo)
2. Cliquez sur l'icône 🔄 dans le header
3. Entrez le nouveau taux
4. Tous les montants sont recalculés automatiquement

**Stockage :** Le taux est sauvegardé dans `localStorage` et persiste entre les sessions.

---

## 📱 Compatibilité

### Navigateurs Supportés
- ✅ Chrome / Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (non supporté)

### Appareils
- 💻 **Desktop** : Expérience complète
- 📱 **Mobile** : Responsive, tous les graphiques adaptés
- 📲 **Tablette** : Interface optimisée

---

## 🆘 Dépannage

### Le système ne charge pas les données
1. Vérifiez que vous utilisez `index-local.html` (version locale)
2. Cliquez sur "Reset" pour charger les données de démo
3. Vérifiez la console du navigateur (F12)

### Les graphiques ne s'affichent pas
1. Vérifiez votre connexion internet (Chart.js est chargé depuis un CDN)
2. Actualisez la page (F5 / Cmd+R)
3. Videz le cache du navigateur

### Le taux de change ne s'applique pas
1. Rechargez la page après modification
2. Vérifiez `localStorage` dans la console :
   ```javascript
   localStorage.getItem('exchangeRate')
   ```

### Erreur "Client déjà existant"
- Un client avec ce téléphone existe déjà
- Recherchez-le dans la liste des clients
- Utilisez "Client existant" dans les RDV / Ventes

---

## 📊 Statistiques du Système

### Modules
- ✅ 9 modules fonctionnels
- ✅ 8 tables de données
- ✅ 6 graphiques interactifs

### Fonctionnalités
- ✅ Multi-devises (USD/CDF)
- ✅ Multi-services par vente
- ✅ Clients anonymes
- ✅ Rendez-vous reportés
- ✅ Rapports exportables (HTML/CSV)
- ✅ Dashboard temps réel
- ✅ Gestion complète des stocks
- ✅ Maintenance des matériels
- ✅ Calcul automatique des commissions

---

## 🔮 Évolutions Futures (Optionnelles)

### Phase 2 (Possible)
- 🔔 Notifications SMS/Email
- 📄 Génération de factures PDF
- 📊 Rapports Excel avancés
- 🔐 Authentification multi-utilisateurs
- 📱 Application mobile native

### Phase 3 (Avancé)
- ☁️ Synchronisation cloud automatique
- 🏢 Gestion multi-salons
- 📈 Analytics et prédictions IA
- 💳 Paiement en ligne intégré
- 🌍 Support multilingue

---

## 👨‍💻 Support Technique

### Questions ?
1. Consultez d'abord ce README complet
2. Vérifiez les fichiers de documentation :
   - `GUIDE_RAPIDE.md`
   - `INSTALLATION_LOCALE.md`
   - `COMMENT_TELECHARGER.md`

### Problème technique ?
- Vérifiez la console du navigateur (F12)
- Consultez les erreurs JavaScript
- Testez sur un autre navigateur

---

## 📜 Licence & Crédits

**Développé pour :** GKal  
**Date :** 24 février 2026  
**Version :** 2.0  

**Technologies utilisées :**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS (via CDN)
- Chart.js (graphiques)
- Font Awesome (icônes)
- Supabase (base de données)

---

## ✨ Remerciements

Merci d'avoir choisi **JL Beauty System** pour votre salon de coiffure. Ce système a été conçu avec soin pour répondre aux besoins spécifiques du marché congolais.

**Bonne gestion ! 💇‍♀️✨**
