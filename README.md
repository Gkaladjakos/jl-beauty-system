# 💇‍♀️ JL Beauty System - Système de Gestion de Salon de Coiffure

## 📋 Vue d'ensemble

**JL Beauty System** (anciennement GlamSalon) est un système de gestion complet et moderne pour salons de coiffure pour dames. Cette application web offre une solution complète pour gérer tous les aspects de votre salon : rendez-vous, clients, coiffeuses, services, produits, matériels, consommables, ventes et commissions.

**Version actuelle**: v3.0 (6 mars 2026)  
**Dernière mise à jour**: Implémentation complète des améliorations demandées

---

## ✨ Fonctionnalités Principales

### 🎯 Modules Implémentés

#### 1. **Tableau de Bord (Dashboard)**
- Vue d'ensemble des statistiques clés du salon
- Rendez-vous du jour en temps réel
- Revenus journaliers et mensuels
- Graphiques de performance des 7 derniers jours
- Répartition des services les plus demandés
- Alertes de stock pour les produits
- Prochains rendez-vous à venir
- **[v3.0]** Filtre période pour analyses temporelles

#### 2. **Gestion des Rendez-vous** ⭐ **NOUVEAU v3.0**
- Création, modification et suppression de rendez-vous
- Assignation automatique des coiffeuses et services
- Statuts multiples : Programmé, Confirmé, En cours, Terminé, Annulé, Reporté, Absent
- **[v3.0] ✅ Validation dates/horaires**:
  - Blocage rendez-vous dans le passé
  - Minimum 30 minutes à l'avance
  - Contrôles HTML5 dynamiques (min date/time)
  - Messages d'erreur explicites
- **[v3.0] ✅ Vue calendrier hebdomadaire**:
  - Navigation semaine par semaine (précédent/suivant/aujourd'hui)
  - Codes couleur par statut (bleu/vert/violet/gris/rouge/orange/jaune)
  - **Drag & drop** pour reporter facilement
  - Basculer entre vue table et calendrier
- Création client à la volée lors de prise RDV
- Filtrage par statut et date
- Historique complet des rendez-vous
- Calcul automatique du prix et de la durée

#### 3. **Gestion des Clients**
- Fiche client complète (coordonnées, préférences, historique)
- **[v2.0]** Téléphone obligatoire, nom/email optionnels
- **[v2.0]** Recherche par téléphone, nom ou email
- **[v2.0]** Affichage clients anonymes (téléphone uniquement)
- **[v2.0]** Création rapide client anonyme
- Système de fidélité avec points
- Statuts : Actif, VIP, Inactif
- Historique détaillé des rendez-vous par client
- Notes et préférences personnalisées

#### 4. **Gestion des Coiffeuses**
- Profil complet avec photo
- Spécialités (coupe, coloration, coiffage, etc.)
- Taux de commission personnalisable (15-40%)
- Statuts : Actif, Congé, Inactif
- Suivi de la date d'embauche
- Gestion des performances

#### 5. **Catalogue de Services**
- Catégories : Coupe, Coloration, Traitement, Coiffage, Maquillage, Soins
- Prix et durée configurables
- Descriptions détaillées
- Activation/désactivation des services
- Affichage visuel par carte avec code couleur

#### 6. **Gestion des Produits** ⭐ **NOUVEAU v3.0**
- Inventaire complet avec stock en temps réel
- **[v3.0] ✅ Gestion catégories avancée**:
  - Ajouter/Modifier/Supprimer catégories
  - Activer/Désactiver catégories
  - 6 catégories par défaut (localStorage)
  - Double-clic pour éditer nom
- **[v3.0] ✅ Rapport stock par période**:
  - Total produits / Valeur stock / Stock faible / Ruptures
  - Répartition par catégorie
  - Export CSV / Impression
- **[v3.0]** Filtre période pour analyse temporelle
- **[v3.0]** Ajustement stock (Ajouter/Retirer/Définir) avec preview temps réel
- **[v3.0]** Recherche produits en temps réel
- Prix d'achat et de vente
- Alertes de stock bas (rouge si stock ≤ minimum)
- Gestion des fournisseurs
- Mise à jour automatique du stock lors des ventes

#### 7. **Gestion des Matériels**
- Inventaire des équipements (fauteuils, séchoirs, fers, tondeuses, etc.)
- Suivi de l'état : Excellent, Bon, Moyen, Défectueux, Hors service
- Planning de maintenance préventive
- Alertes de maintenance requise
- Historique d'achat et numéros de série

#### 8. **Gestion des Consommables** **[v2.2]**
- Stock produits consommés en salon (mèches, shampooing, spray, gels, vitamines, etc.)
- Catégories : Soins capillaires, Coloration, Mèches, Produits d'hygiène, Vitamines, Outils jetables, Autres
- Suivi consommation par cliente (quantité, date, usage)
- Alertes stock faible (orange) et rupture (rouge)
- Enregistrement réapprovisionnements (historique)
- Statistiques : Total consommables / Alertes / Valeur stock
- 9 consommables de démonstration

#### 9. **Système de Ventes** ⭐ **NOUVEAU v3.0**
- Enregistrement des ventes de services et produits
- **[v3.0] ✅ Vente multi-produits**: Ajouter plusieurs produits dans une seule transaction
- **[v3.0] ✅ Coiffeuse cachée pour produits**: Pas de sélection coiffeuse si vente produit uniquement
- **[v3.0] ✅ Liaison avec rendez-vous**: Remplissage automatique depuis RDV (client, service, coiffeuse)
- **[v3.0] ✅ Multi-services + multi-coiffeuses**: Plusieurs services avec différentes stylistes
- **[v3.0] ✅ Gestion caisse avancée**:
  - Montant reçu
  - Calcul automatique monnaie
  - Validation montant suffisant
  - Notification si insuffisant
- **[v3.0] ✅ Facture thermique imprimable**: Format 80mm optimisé imprimantes thermiques
- **[v3.0] ✅ Filtre période**: Analyse ventes par période + export CSV
- **[v2.0]** Conversion USD ↔ CDF avec taux modifiable
- Modes de paiement : Espèces, Carte, Mobile Money, Chèque
- Statistiques en temps réel (jour, mois, total)
- Calcul automatique des commissions

#### 10. **Calcul des Commissions** ⭐ **NOUVEAU v3.0**
- Calcul automatique mensuel des commissions par coiffeuse
- **[v3.0] ✅ Filtre période**: Calculer commissions d'une période spécifique
- **[v3.0] ✅ Statut Payé/Impayé**: Distinction claire commissions versées / en attente
- **[v3.0] ✅ Date paiement**: Enregistrement automatique lors marquage "Payé"
- **[v3.0] ✅ Marquer comme payé**: Un clic pour passer En attente → Payé
- **[v3.0] ✅ Marquer toutes comme payées**: Action groupée pour période
- **[v3.0] ✅ 4 statistiques**: Total / Payées / En attente / Nb coiffeuses
- **[v3.0] ✅ Détails commission**: Modal avec liste services + montants
- **[v3.0] ✅ Impression reçu**: Imprimer reçu commission styliste
- **[v3.0] ✅ Export CSV**: Exporter données période
- Statuts : Calculé (= En attente), Payé
- Historique des paiements
- Vue détaillée des ventes contribuant aux commissions

#### 11. **Authentification & Permissions** **[v2.3]**
- Connexion sécurisée (localStorage pour démo, Supabase pour production)
- 2 rôles : **Gérant** (accès complet) et **Caissière** (accès limité)
- Masquage automatique modules selon rôle
- Page login moderne avec sélection version (Local/Production)
- Affichage nom utilisateur + rôle dans header
- Logout sécurisé
- 3 comptes par défaut (voir GUIDE_AUTHENTIFICATION.md)

## 🗂️ Structure des Données

### Tables de Base de Données

Le système utilise **8 tables principales** :

1. **clients** - Informations clients et fidélité
2. **coiffeuses** - Données du personnel
3. **services** - Catalogue des prestations
4. **rendez_vous** - Planning des rendez-vous
5. **produits** - Inventaire des produits à vendre
6. **materiels** - Équipements et maintenance
7. **ventes** - Transactions de services et produits
8. **commissions** - Calculs de commissions mensuelles

## 🎨 Design et Interface

### Technologies Utilisées
- **HTML5** - Structure sémantique
- **Tailwind CSS** - Framework CSS moderne via CDN
- **JavaScript ES6+** - Logique applicative
- **Font Awesome 6** - Icônes professionnelles
- **Google Fonts (Inter)** - Typographie élégante
- **Chart.js** - Graphiques et visualisations

### Caractéristiques de l'Interface
- ✅ **Responsive Design** - Adapté mobile, tablette et desktop
- ✅ **Navigation Sidebar** - Menu latéral avec icônes
- ✅ **Cartes Statistiques** - Affichage visuel des KPIs
- ✅ **Badges de Statut** - Code couleur pour les états
- ✅ **Modals Modernes** - Formulaires en popup
- ✅ **Notifications Toast** - Feedback utilisateur instantané
- ✅ **Tables Interactives** - Tri, recherche et filtres
- ✅ **Alertes Visuelles** - Codes couleur pour les priorités

## 🚀 Démarrage Rapide

### Accéder au système
1. Ouvrez le fichier `index.html` dans votre navigateur
2. Le système charge automatiquement avec des **données de démonstration**

### Données de Démonstration Incluses
- ✅ 3 coiffeuses actives (Marie, Aïcha, Fatou)
- ✅ 4 clients avec historique (dont 2 VIP)
- ✅ 8 services dans différentes catégories
- ✅ 6 produits en stock (avec alertes de stock bas)
- ✅ 4 équipements matériels
- ✅ 4 rendez-vous programmés
- ✅ 5 ventes enregistrées

## 📊 Utilisation du Système

### Flux de Travail Typique

#### 1. Configuration Initiale
1. Ajouter les **coiffeuses** de votre salon
2. Créer le **catalogue de services** avec prix
3. Enregistrer les **produits** en stock
4. Lister les **matériels** et équipements

#### 2. Gestion Quotidienne
1. Enregistrer les **clients** (nouveaux ou existants)
2. Créer des **rendez-vous** (client + coiffeuse + service)
3. Marquer les rendez-vous comme "En cours" puis "Terminé"
4. Enregistrer les **ventes** (services fournis + produits vendus)
5. Consulter le **tableau de bord** pour les statistiques

#### 3. Gestion Périodique
1. Vérifier les **alertes de stock** des produits
2. Planifier la **maintenance** des matériels
3. **Calculer les commissions** en fin de mois
4. Marquer les commissions comme **payées**

### Fonctionnalités Avancées

#### Système de Fidélité
- Accumulation automatique de points par visite
- Passage automatique en statut VIP à partir d'un seuil
- Historique complet des visites par client

#### Calcul Automatique des Commissions

**⚠️ IMPORTANT:** Les commissions sont calculées **uniquement sur les services rendus** (pas sur les produits vendus). C'est le mode de rémunération des coiffeuses.

**Taux de commission recommandé:** 20-35% selon l'ancienneté et la performance

**Processus:**
1. Aller dans le module **Commissions**
2. Cliquer sur **"Calculer les commissions du mois"**
3. Le système calcule automatiquement pour chaque coiffeuse :
   - **Nombre de services rendus** dans le mois
   - **Total des revenus** générés par ces services
   - **Commission totale** (basée sur le taux individuel de la coiffeuse)
   - Détails de chaque service contribuant au calcul
4. Marquer comme **"Payé"** ✓ une fois le paiement effectué

**Exemples de calcul:**
- Service de 10,000 FCFA avec taux 25% = Commission de 2,500 FCFA
- Service de 15,000 FCFA avec taux 30% = Commission de 4,500 FCFA
- Vente de produit = **0 FCFA de commission** (non rémunéré)

#### Gestion de Stock
- Les ventes de produits **déduisent automatiquement** du stock
- **Alertes visuelles** (fond rouge) quand stock ≤ minimum
- Bouton **"Stock faible"** pour filtrer rapidement les produits à réapprovisionner

## 🔧 API REST Disponible

Le système utilise l'API RESTful Table intégrée :

### Endpoints Principaux
```
GET    /tables/{table}                    - Liste tous les enregistrements
GET    /tables/{table}/{id}               - Récupère un enregistrement
POST   /tables/{table}                    - Crée un enregistrement
PUT    /tables/{table}/{id}               - Met à jour un enregistrement
DELETE /tables/{table}/{id}               - Supprime un enregistrement (soft delete)
```

### Paramètres de Requête
- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre d'éléments par page (défaut: 100, max: 1000)
- `search` - Recherche textuelle
- `sort` - Tri par champ

## 📁 Structure du Projet

```
glamsalon/
│
├── index.html                 # Page principale
│
├── js/
│   ├── app.js                # Contrôleur principal et navigation
│   ├── utils.js              # Fonctions utilitaires et API
│   ├── dashboard.js          # Module tableau de bord
│   ├── clients.js            # Module gestion clients
│   ├── coiffeuses.js         # Module gestion coiffeuses
│   ├── services.js           # Module catalogue services
│   ├── rendez-vous.js        # Module gestion rendez-vous
│   ├── produits.js           # Module gestion produits
│   ├── materiels.js          # Module gestion matériels
│   ├── ventes.js             # Module enregistrement ventes
│   └── commissions.js        # Module calcul commissions
│
└── README.md                 # Documentation complète
```

## 🎯 Points Forts du Système

### ✅ Complétude Fonctionnelle
- **9 modules complets** couvrant tous les aspects d'un salon
- **CRUD complet** pour toutes les entités
- **Statistiques en temps réel** avec graphiques
- **Système de recherche et filtrage** avancé
- **Gestion automatisée** des stocks et commissions

### ✅ Expérience Utilisateur
- Interface **intuitive et moderne**
- **Responsive** sur tous les appareils
- **Feedback visuel** immédiat (notifications, alertes)
- **Code couleur** pour identifier rapidement les statuts
- **Navigation fluide** entre les modules

### ✅ Fiabilité Technique
- **Architecture modulaire** facile à maintenir
- **Gestion d'erreurs** robuste
- **API REST** standardisée
- **Pas de dépendances** serveur (statique)
- **Données persistantes** via l'API Table

## 🔮 Fonctionnalités Recommandées pour Extension Future

### Phase 2 (Extensions Suggérées)
1. **Authentification et Rôles**
   - Login sécurisé
   - Rôles : Admin, Manager, Coiffeuse, Réceptionniste
   - Permissions granulaires par module

2. **Calendrier Visuel**
   - Vue calendrier mensuel/hebdomadaire/jour
   - Glisser-déposer pour réorganiser les rendez-vous
   - Couleurs par coiffeuse
   - Blocage des créneaux horaires

3. **Rapports et Exports**
   - Génération de rapports PDF/Excel
   - Statistiques avancées par période
   - Comparaisons mois/mois, année/année
   - Export des factures clients

4. **Communications**
   - SMS/Email de rappel de rendez-vous
   - Notifications de promotions clients
   - Alertes de maintenance matériels

5. **Gestion Avancée**
   - Multi-salon (franchises)
   - Gestion des dépenses et charges
   - Comptabilité complète
   - Objectifs et KPIs par coiffeuse

6. **Mobile App**
   - Application mobile native (iOS/Android)
   - Prise de rendez-vous client en ligne
   - Suivi de fidélité via QR code

## 📝 Notes Techniques

### Prérequis
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- Connexion internet (pour CDN Tailwind, Font Awesome, Chart.js)

### Limitations Actuelles
- **Pas d'authentification** - Système ouvert (à implémenter en Phase 2)
- **Stockage navigateur** - Données dans l'environnement de développement
- **Une seule devise** - XAF configuré par défaut (modifiable dans utils.js)

### Configuration
Pour changer la **devise**, modifier dans `js/utils.js` :
```javascript
formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF' // Changer ici (EUR, USD, etc.)
    }).format(amount);
}
```

## 🎓 Guide de Formation

### Pour les Réceptionnistes
1. **Gestion des rendez-vous** - Création et suivi
2. **Enregistrement clients** - Nouvelles fiches
3. **Ventes** - Enregistrement des transactions

### Pour les Managers
1. **Tableau de bord** - Suivi des KPIs
2. **Gestion des stocks** - Réapprovisionnement
3. **Calcul des commissions** - Paiements mensuels
4. **Maintenance matériels** - Planification

### Pour les Administrateurs
1. **Configuration des services** - Prix et durées
2. **Gestion du personnel** - Coiffeuses et commissions
3. **Analyse des performances** - Rapports et statistiques

## 🆘 Support et Contact

Pour toute question ou suggestion d'amélioration, veuillez contacter l'équipe de développement.

## 📜 Licence

Ce système a été développé spécifiquement pour la gestion de salons de coiffure. 
Tous droits réservés © 2026 GlamSalon.

---

**Version actuelle:** 1.0.0  
**Date de création:** 15 février 2026  
**Dernière mise à jour:** 15 février 2026

**Développé avec ❤️ pour les professionnels de la beauté**
