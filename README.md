# Application d'Audit 6S

## Configuration Supabase pour la synchronisation des données

Pour que les audits soient sauvegardés et synchronisés entre tous les ordinateurs, vous devez configurer Supabase :

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte et un nouveau projet
3. Attendez que le projet soit initialisé

### 2. Obtenir les clés de configuration

Dans votre projet Supabase :
1. Allez dans **Settings** > **API**
2. Copiez l'**URL** du projet
3. Copiez la clé **anon/public**

### 3. Configurer l'application

Cliquez sur l'icône **Settings** (⚙️) en haut de l'aperçu, puis sur **Supabase** et entrez :
- **Supabase URL** : l'URL de votre projet
- **Supabase Anon Key** : la clé anon/public

### 4. Initialisation automatique

Une fois configuré, l'application va automatiquement :
- Créer les tables nécessaires
- Synchroniser les données entre tous les appareils
- Sauvegarder tous les audits dans le cloud

## Fonctionnalités

- **Audits 6S** : Évaluation complète des 7 piliers (Seiri, Seiton, Seiso, Seiketsu, Shitsuke, Safety, Quality)
- **Actions correctives** : Suivi des actions avec délais de 30 jours
- **Suggestions d'amélioration** : Amélioration continue
- **Rapports avancés** : Tableaux de bord avec graphiques et KPI
- **Synchronisation cloud** : Données partagées entre tous les appareils (avec Supabase)
- **Sauvegarde locale** : Fonctionnement hors ligne avec localStorage

## Utilisation

1. **Accueil** : Vue d'ensemble avec KPI et actions rapides
2. **Audit** : Réaliser les audits par local
3. **Actions** : Gérer les actions correctives
4. **Améliorations** : Suivre les suggestions d'amélioration
5. **Rapports** : Analyser les performances avec graphiques

## Support

Pour toute question technique, contactez l'équipe de développement.