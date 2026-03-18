# 🏠 GlamSalon - Version Locale (localStorage)

## 📌 À Propos

Cette version de GlamSalon fonctionne **entièrement sur votre ordinateur** en utilisant le localStorage du navigateur. Aucun serveur n'est nécessaire.

---

## ⚡ Démarrage Rapide

1. **Téléchargez** tous les fichiers du projet
2. **Ouvrez** `index-local.html` dans votre navigateur
3. **C'est tout!** Les données de démonstration sont chargées automatiquement

---

## 🎯 Différences avec la Version Cloud

| Fonctionnalité | Version Locale | Version Cloud (Genspark) |
|----------------|----------------|-------------------------|
| **Installation** | Télécharger et ouvrir | Publier sur Genspark |
| **Stockage** | localStorage (navigateur) | Base de données cloud |
| **Internet** | Requis pour CDN uniquement | Requis |
| **Multi-utilisateurs** | Non | Oui |
| **Synchronisation** | Manuelle (export/import) | Automatique |
| **Sauvegarde** | Manuelle | Automatique |
| **Limite données** | ~5-10 MB | Illimitée |
| **Coût** | Gratuit | Gratuit (Genspark) |

---

## ✨ Fonctionnalités Supplémentaires

### 📥 Export de Données
- Cliquez sur l'icône **téléchargement** en haut à droite
- Sauvegarde toutes vos données en fichier JSON
- Nom du fichier: `glamsalon-backup-YYYY-MM-DD.json`

### 📤 Import de Données
- Cliquez sur l'icône **upload** en haut à droite
- Sélectionnez un fichier JSON de sauvegarde
- Restaure toutes les données instantanément

### 🔄 Réinitialisation
- Cliquez sur l'icône **synchronisation** en haut à droite
- Supprime toutes vos données
- Recharge les données de démonstration
- ⚠️ Confirmation requise

---

## 💾 Gestion des Données

### Où sont stockées mes données?
Dans le **localStorage** de votre navigateur:
- Emplacement: Interne au navigateur
- Persistance: Permanent jusqu'à suppression manuelle
- Sécurité: Accessible uniquement depuis votre ordinateur

### Comment sauvegarder?
**Méthode 1 (Recommandée):** Export JSON
```
1. Cliquez sur 📥
2. Fichier téléchargé automatiquement
3. Sauvegardez sur disque externe ou cloud
```

**Méthode 2:** Copie du dossier
```
Copiez tout le dossier GlamSalon avec les données du navigateur
(Plus complexe, export JSON recommandé)
```

### Fréquence de sauvegarde recommandée:
- **Usage quotidien:** Sauvegarde chaque soir
- **Usage hebdomadaire:** Sauvegarde chaque semaine
- **Avant modifications importantes:** Sauvegarde systématique

---

## 🔒 Sécurité et Confidentialité

### ✅ Avantages:
- Données stockées localement sur VOTRE ordinateur
- Pas de transmission vers un serveur externe
- Contrôle total de vos données

### ⚠️ Précautions:
- **Ne partagez pas** vos fichiers de sauvegarde
- **Protégez** votre ordinateur avec un mot de passe
- **Sauvegardez** régulièrement (localStorage peut être effacé)

---

## 🌐 Navigateurs Supportés

### ✅ Recommandés:
- **Google Chrome** (version 90+)
- **Mozilla Firefox** (version 88+)
- **Microsoft Edge** (version 90+)

### ⚠️ Compatibles avec limitations:
- Safari (certains problèmes possibles avec localStorage)
- Opera

### ❌ Non supportés:
- Internet Explorer (obsolète)
- Navigateurs très anciens

---

## 📱 Accès Multi-Appareils

### Pas de Synchronisation Automatique
Cette version locale ne synchronise PAS automatiquement entre appareils.

### Solution: Export/Import Manuel

**Depuis Ordinateur A:**
```
1. Export (📥) → Fichier JSON téléchargé
2. Transférer le fichier vers Ordinateur B (USB, email, cloud)
```

**Sur Ordinateur B:**
```
1. Import (📤) → Sélectionner le fichier JSON
2. Données restaurées
```

### Pour Usage Multi-Postes Intensif:
→ Considérez la migration vers la **Version Cloud**

---

## 🚨 Limitations Importantes

### 1. Données Non Synchronisées
- Chaque navigateur = base de données séparée
- Chrome et Firefox = données différentes
- Plusieurs ordinateurs = pas de sync automatique

### 2. Risque de Perte de Données
- Nettoyage du cache navigateur → Données perdues
- Désinstallation du navigateur → Données perdues
- **Solution:** Sauvegardes régulières!

### 3. Pas d'Accès Concurrent
- Un seul utilisateur à la fois
- Pas de gestion multi-utilisateurs
- **Solution:** Utiliser version cloud pour équipe

### 4. Mode Navigation Privée
- Données effacées à la fermeture du navigateur
- **Ne pas utiliser** en mode privé/incognito

---

## 🔄 Migration vers Version Cloud

Quand vous serez prêt pour une solution professionnelle:

### Étapes de Migration:
1. **Exportez** vos données (📥)
2. Contactez-nous pour setup cloud
3. **Importez** automatiquement vos données
4. Profitez de:
   - Synchronisation automatique
   - Multi-utilisateurs
   - Sauvegarde cloud
   - Accès depuis n'importe où

---

## 💡 Conseils d'Utilisation Optimale

### ✅ À Faire:
- Exportez vos données **chaque fin de journée**
- Gardez **plusieurs sauvegardes** (journalière, hebdomadaire, mensuelle)
- Testez l'**import/export** avant utilisation intensive
- Utilisez un **navigateur dédié** pour GlamSalon

### ❌ À Éviter:
- Ne videz JAMAIS le cache sans sauvegarder
- N'utilisez pas en mode navigation privée
- Ne fermez pas brusquement pendant une opération
- N'utilisez pas sur un ordinateur partagé sans protection

---

## 🛠️ Dépannage

### Problème: "Mes données ont disparu"
**Causes possibles:**
- Cache navigateur vidé
- Mode navigation privée utilisé
- Changement de navigateur

**Solution:**
- Importez votre dernière sauvegarde (📤)
- Si pas de sauvegarde: Rechargez données démo (🔄)

### Problème: "L'export ne fonctionne pas"
**Solution:**
- Vérifiez que les téléchargements sont autorisés
- Essayez un autre navigateur
- Vérifiez l'espace disque disponible

### Problème: "Interface cassée"
**Solution:**
- Vérifiez votre connexion internet (CDN)
- Videz le cache et rechargez (Ctrl+F5)
- Essayez en mode navigation privée (test)

---

## 📊 Capacité de Stockage

### localStorage typique:
- **Chrome:** ~10 MB
- **Firefox:** ~10 MB
- **Edge:** ~10 MB
- **Safari:** ~5 MB

### Estimation pour GlamSalon:
- **1000 clients** ≈ 500 KB
- **500 services rendus/mois** ≈ 300 KB
- **1000 produits** ≈ 400 KB
- **Total système complet** ≈ 2-3 MB

**Conclusion:** Largement suffisant pour un salon typique!

---

## 📚 Documentation Complète

Pour plus d'informations:
- `INSTALLATION_LOCALE.md` - Guide d'installation détaillé
- `README.md` - Documentation générale du système
- `GUIDE_RAPIDE.md` - Guide utilisateur rapide
- `AJUSTEMENTS_COMMISSIONS.md` - Système de commissions
- `VALIDATION_FINALE.md` - Récapitulatif des fonctionnalités

---

## ✅ Checklist Avant Production

Avant d'utiliser avec de vraies données:

- [ ] Test complet de tous les modules
- [ ] Test d'export de données
- [ ] Test d'import de données
- [ ] Sauvegarde initiale créée
- [ ] Lieu de sauvegarde défini
- [ ] Formation des utilisateurs effectuée
- [ ] Procédure de sauvegarde établie
- [ ] Plan de migration cloud préparé (optionnel)

---

## 🎓 Recommandations

### Pour Démarrer (Semaine 1):
1. Utilisez les données de démonstration
2. Testez toutes les fonctionnalités
3. Familiarisez-vous avec l'interface
4. Pratiquez export/import

### Pour Production (Semaine 2+):
1. Réinitialisez les données (🔄)
2. Ajoutez vos vraies données
3. Établissez routine de sauvegarde
4. Utilisez quotidiennement

### Pour Évolution (Mois 2-3):
1. Évaluez vos besoins
2. Si multi-utilisateurs nécessaire → Migration cloud
3. Si satisfait → Continuez version locale

---

**Version Locale GlamSalon - Simple, Efficace, Autonome! 🚀**

*Pour assistance: Consultez les fichiers de documentation ou contactez le support.*
