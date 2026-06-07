# CampusConnect.tg 🎓

> Plateforme web collaborative destinée aux étudiants, formateurs et recruteurs du Togo.

![Version](https://img.shields.io/badge/version-1.0.0-emerald) ![Statut](https://img.shields.io/badge/statut-en%20développement-orange) ![Année](https://img.shields.io/badge/année-2025-blue)

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Description des fichiers](#3-description-des-fichiers)
4. [Guide d'installation](#4-guide-dinstallation)
5. [Guide d'utilisation par rôle](#5-guide-dutilisation-par-rôle)
6. [Corrections de bugs apportées](#6-corrections-de-bugs-apportées)
7. [Dépannage](#7-dépannage)
8. [Ordre de démarrage](#8-ordre-de-démarrage)

---

Équipe 
IPNET Institute of Technology — Lomé, Togo
#Nom completRôle1
PATAYODI Stanley Esso-sosso
AYISSOU Mawunyo Ben-Junior
BITHO Essohanam Rosemonde
ADJANAYO Ayomidé Marcellin

## 1. Présentation

**CampusConnect.tg** est une plateforme web collaborative qui permet à des étudiants de différentes écoles togolaises (IPNET, ESGIS, Université de Lomé, Université de Kara) de se regrouper, collaborer sur des projets pratiques, développer leurs compétences et se faire repérer par des recruteurs.

### Objectifs principaux

- Connecter les étudiants de différentes écoles autour de projets concrets
- Permettre aux étudiants de développer et faire reconnaître leurs compétences
- Offrir aux formateurs/recruteurs un espace pour proposer et suivre des projets
- Fournir un système de scoring IA qui évalue les profils étudiants
- Générer automatiquement un CV Portfolio basé sur les projets réalisés

### Public cible

| Rôle | Qui c'est ? | Ce qu'il peut faire |
|------|-------------|---------------------|
| **Étudiant** | Étudiants de IPNET, ESGIS, UL, UK | Rejoindre des projets, suivre ses compétences, générer son CV |
| **Formateur** | Enseignants, encadreurs, recruteurs | Proposer des projets, évaluer l'avancement des équipes |
| **Administrateur** | Gestionnaire de la plateforme | Gérer tous les utilisateurs, projets, exporter les données |

---

## 2. Architecture du projet

```
Campusconnect/
│
├── index.html          ← Application principale (interface utilisateur)
├── login.html          ← Page de connexion et d'inscription
├── style.css           ← Styles visuels globaux
├── script.js           ← Logique applicative frontend  ⚠️ Fichier corrigé
├── api.js              ← Client API — connecte le frontend au backend
│
└── campusconnect-backend/
    ├── server.js       ← Serveur Node.js + API REST
    ├── seed.js         ← Script de peuplement de la base de données
    ├── database.sql    ← Schéma MySQL — création des tables
    ├── package.json    ← Dépendances Node.js
    └── .env            ← Configuration (à créer depuis .env.example)
```

### Schéma d'architecture

```
FRONTEND (Navigateur)          BACKEND (Serveur)
─────────────────────          ─────────────────────
index.html + login.html   ←──→  server.js (Node.js/Express)
style.css + script.js      API      │
api.js                     REST     └── Base de données MySQL
```

---

## 3. Description des fichiers

### 3.1 `login.html` — Page de Connexion

Point d'entrée de l'application. Première page vue par l'utilisateur.

**Fonctionnalités :**
- Authentification (vérification email + mot de passe)
- Création de compte (inscription)
- Détection du rôle (étudiant, formateur, admin)
- Stockage de la session dans le `localStorage` et redirection vers `index.html`
- Onglets de rôle et chips de connexion rapide
- Barre de force du mot de passe lors de l'inscription
- Mode sombre/clair avec sauvegarde de la préférence
- Auto-login si session existante

**Stockage local utilisé :**
- `campusconnect_session` — objet de l'utilisateur connecté
- `campusconnect_users` — tous les comptes

---

### 3.2 `index.html` — Application Principale

Contient toute la structure HTML. Les sections sont masquées ou affichées selon le rôle.

**Sections présentes :**

| ID Section | Visible par | Contenu |
|------------|-------------|---------|
| `sectionDashboard` | Étudiant | Tableau de bord : projets rejoints, score IA, métriques |
| `sectionEtudiant` | Étudiant | Espace projets : recherche, filtres, cartes, fil d'actualités |
| `sectionRecruteur` | Formateur + Admin | Statistiques, liste des projets, évaluation des livrables |
| `sectionAdmin` | Admin uniquement | KPIs, gestion utilisateurs, gestion projets, journal |
| `sectionProfil` | Étudiant | Drawer latéral : compétences, audit IA |

**Modales partagées :**
- `modalFormulaire` — Formulaire de création de projet (formateur et admin)
- `modaleEvaluation` — Évaluation des livrables avec slider d'avancement
- `modalCV` — Générateur de CV Portfolio avec simulation IA
- `chatbotContainer` — Chatbot IA (étudiant et formateur)

---

### 3.3 `style.css` — Styles Visuels

- Police **Outfit** (Google Fonts)
- Animation `fadeIn` — transition fluide entre onglets
- Classe `.role-btn-active` — onglet actif (vert émeraude)
- Variables CSS `--btn-active-bg` et `--btn-active-color` pour le thème
- Scrollbar personnalisé discret
- Classe `.glass-panel` — effet glassmorphisme
- Classe `.hover-card` — élévation au survol des cartes
- Animation `.ai-glow` — effet de scan IA sur le générateur de CV

---

### 3.4 `script.js` — Logique Applicative Frontend ⚠️

Fichier JavaScript principal. Gère toute la logique : affichage des vues, données, rôles, interactions.

**Modules internes :**

| Section | Nom | Description |
|---------|-----|-------------|
| **0** | Système de rôles | Récupère l'utilisateur depuis le `localStorage`. Redirige si aucune session. |
| **1** | Thème sombre | Détecte et applique le thème. Sauvegarde le choix. |
| **2** | Navigation | Affiche nom et badge de rôle dans la barre de navigation. |
| **3** | Onglets | Génère dynamiquement les onglets selon le rôle. |
| **4** | Affichage sections | `showSection()` : cache toutes les sections, affiche celle demandée. |
| **5** | Chatbot & Profil | Active/désactive le chatbot et le drawer profil selon le rôle. |
| **6** | Déconnexion | Supprime la session et redirige vers `login.html`. |
| **7** | Données (localStorage) | Projets/utilisateurs par défaut. Fonctions `saveState()` et `logJournal()`. |
| **8** | Dashboard étudiant | Calcule les stats personnelles (projets, heures, compétences). |
| **9** | Espace projets | Cartes de projets avec filtres et gestion des inscriptions. |
| **10** | Espace formateur | Liste des projets avec statistiques et actions de gestion. |
| **11** | Panneau admin | KPIs globaux, liste utilisateurs/projets, journal d'activité. |
| **12** | Modale projet | Ouverture/fermeture du formulaire de création de projet. |
| **13** | Modale évaluation | Ajustement de l'avancement d'un projet par le formateur. |
| **14** | Audit IA | Simulation d'audit de compétences avec animation de chargement. |
| **15** | Générateur CV | Compile les projets en CV Portfolio téléchargeable en PDF. |
| **16** | Chatbot | Répond aux questions sur la plateforme. |
| **17** | Chargement initial | Initialise la vue selon le rôle connecté. |

---

### 3.5 `api.js` — Client API REST

Pont entre frontend et backend. Encapsule tous les appels HTTP. Gère les tokens JWT automatiquement.

| Objet | Fonctions disponibles |
|-------|----------------------|
| `Auth` | `getToken()`, `setToken()`, `getUser()`, `setUser()`, `isLoggedIn()`, `logout()` |
| `AuthAPI` | `login(email, mdp)`, `register({...})`, `me()` |
| `ProjetsAPI` | `getAll()`, `getById(id)`, `create()`, `update()`, `delete()`, `rejoindre()`, `quitter()`, `getMesProjets()` |
| `CompetencesAPI` | `get(userId)`, `update(userId, nom, pct, label)` |
| `AdminAPI` | `getUtilisateurs()`, `deleteUtilisateur(id)` |

> ⚠️ `api.js` vérifie au chargement si l'utilisateur est connecté. Si non, il redirige vers `login.html`. Ce comportement peut être désactivé en commentant `checkAuth()` en bas du fichier.

---

### 3.6 `server.js` — Serveur API REST (Backend)

Serveur Node.js avec Express. Gère l'authentification JWT, les routes CRUD et la connexion MySQL.

**Technologies :**
- `express` — framework web
- `mysql2` — pilote MySQL (avec Promises)
- `bcrypt` — hachage sécurisé des mots de passe (10 rounds)
- `jsonwebtoken` — authentification sans état par tokens
- `cors` — gestion des accès cross-origin
- `dotenv` — variables d'environnement

**Routes API disponibles :**

| Méthode | Route | Description | Auth ? |
|---------|-------|-------------|--------|
| `POST` | `/api/auth/register` | Créer un compte | Non |
| `POST` | `/api/auth/login` | Se connecter | Non |
| `GET` | `/api/auth/me` | Obtenir son profil | Oui |
| `GET` | `/api/projets` | Lister tous les projets | Non |
| `POST` | `/api/projets` | Créer un projet | Oui |
| `PUT` | `/api/projets/:id` | Modifier un projet | Oui |
| `DELETE` | `/api/projets/:id` | Supprimer un projet | Oui |
| `POST` | `/api/projets/:id/rejoindre` | Rejoindre un projet | Oui |
| `DELETE` | `/api/projets/:id/quitter` | Quitter un projet | Oui |
| `GET` | `/api/utilisateurs/:id/projets` | Projets d'un utilisateur | Oui |
| `GET` | `/api/utilisateurs/:id/competences` | Compétences d'un utilisateur | Oui |
| `GET` | `/api/admin/utilisateurs` | Tous les utilisateurs | Admin |
| `DELETE` | `/api/admin/utilisateurs/:id` | Supprimer un utilisateur | Admin |
| `GET` | `/api/health` | Vérification santé du serveur | Non |

---

### 3.7 `database.sql` — Schéma de la Base de Données

Script SQL à exécuter une seule fois pour créer la structure MySQL.

| Table | Colonnes principales |
|-------|---------------------|
| `utilisateurs` | `id`, `prenom`, `nom`, `email` (UNIQUE), `mot_de_passe` (bcrypt), `role` (ENUM), `ecole`, `score_ia`, `actif`, `created_at` |
| `projets` | `id`, `titre`, `description`, `tags` (JSON), `max_participants`, `statut` (ENUM), `avancement` (0-100), `createur_id` (FK) |
| `inscriptions` | `id`, `utilisateur_id` (FK), `projet_id` (FK) — relation N:N |
| `competences` | `id`, `utilisateur_id` (FK), `nom`, `niveau_pct` (0-100), `niveau_label` (Lvl 1 à 5) |
| `sessions` | `id`, `utilisateur_id` (FK), `token` JWT, `expires_at` |

---

### 3.8 `seed.js` — Peuplement Initial

Script à exécuter une seule fois après la création des tables. Insère 5 utilisateurs et 3 projets.

**Comptes créés :**

| Email | Mot de passe | Rôle | École |
|-------|-------------|------|-------|
| `rosemonde@campus-tg.org` | `campus123` | Étudiant | IPNET |
| `kofi@campus-tg.org` | `campus123` | Étudiant | ESGIS |
| `amina@campus-tg.org` | `campus123` | Étudiant | UL |
| `jpa@solveteck.tg` | `recruit2025` | Formateur | SolveTeck |
| `admin@campusconnect.tg` | `admin@cc2025` | Admin | Système |

---

## 4. Guide d'installation

> Ce guide suppose Windows avec XAMPP. Les commandes sont identiques sur Mac/Linux.

### Étape 1 — Installer les logiciels nécessaires

| Logiciel | Lien | Notes |
|----------|------|-------|
| XAMPP | https://www.apachefriends.org | Cocher : Apache, MySQL, phpMyAdmin |
| Node.js LTS | https://nodejs.org | Vérifier : `node --version` (v18 ou +) |
| Visual Studio Code | https://code.visualstudio.com | Extension recommandée : **Live Server** |

### Étape 2 — Démarrer MySQL (XAMPP)

1. Ouvrir le panneau de contrôle XAMPP
2. Cliquer **Start** à côté de **MySQL**
3. Cliquer **Admin** → phpMyAdmin s'ouvre dans le navigateur
4. Créer une base de données nommée `campusconnect` (encodage : `utf8mb4_unicode_ci`)
5. Cliquer sur la base `campusconnect` > onglet **SQL**
6. Coller le contenu de `database.sql` > cliquer **Exécuter**

> ✅ Si tout s'est bien passé, 5 tables apparaissent : `utilisateurs`, `projets`, `inscriptions`, `competences`, `sessions`.

### Étape 3 — Configurer le fichier `.env`

Dans le dossier `campusconnect-backend/`, créer un fichier `.env` :

```env
# Copier .env.example en .env puis modifier :

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # Laisser vide si XAMPP sans mot de passe
DB_NAME=campusconnect

JWT_SECRET=votre_cle_secrete_ici
JWT_EXPIRES_IN=7d
PORT=3001
```

> ⚠️ Ne jamais partager `.env` sur GitHub — il contient votre mot de passe MySQL.

### Étape 4 — Installer les dépendances et peupler la base

```bash
# Aller dans le dossier backend
cd C:\Users\USER\Downloads\Campusconnect\campusconnect-backend

# Installer les dépendances Node.js
npm install

# Peupler la base avec les données de départ
node seed.js
```

Sortie attendue dans le terminal :
```
Début du seeding...
Rosemonde Adeyi (etudiant) — id:1
Kofi Mensah (etudiant) — id:2
Amina Kossivi (etudiant) — id:3
Jean-Pierre Agbodjan (recruteur) — id:4
Sénamé Adjoa (admin) — id:5
Seeding terminé avec succès !
```

### Étape 5 — Lancer le serveur backend

```bash
# Toujours dans campusconnect-backend/
node server.js

# Sortie attendue :
# Connexion MySQL réussie !
# Serveur CampusConnect lancé sur http://localhost:3001
```

Vérifier dans le navigateur :
```
http://localhost:3001/api/health
# Réponse attendue : {"status":"ok","database":"connectee","timestamp":"..."}
```

> ⚠️ Laisser ce terminal ouvert. Si vous le fermez, le serveur s'arrête.

### Étape 6 — Ouvrir l'application

Dans VS Code, faire **clic droit** sur `login.html` > **Open with Live Server**.

L'URL sera : `http://127.0.0.1:5500/login.html`

> ⛔ Ne pas ouvrir `login.html` en double-cliquant (protocole `file://`). Live Server est obligatoire pour que les appels API fonctionnent (politique CORS) **et** pour que tous les boutons réagissent correctement.

---

## 5. Guide d'utilisation par rôle

### 5.1 Connexion Étudiant

- Onglet **Étudiant** sur `login.html`
- Chip **Rosemonde A. - IPNET** ou entrer manuellement :
  - Email : `rosemonde@campus-tg.org` | Mot de passe : `campus123`
- Deux onglets : **Mon Espace** (tableau de bord) et **Espace Projets**
- Dans Espace Projets : cliquer **Rejoindre l'équipe** sur un projet
- Cliquer sur son prénom (en haut à droite) pour ouvrir le profil de compétences
- Bouton **Générer mon CV Portfolio via IA** pour créer son CV téléchargeable

### 5.2 Connexion Formateur

- Onglet **Recruteur** sur `login.html`
- Chip **Jean-Pierre A. - SolveTeck** ou :
  - Email : `jpa@solveteck.tg` | Mot de passe : `recruit2025`
- Un seul onglet : **Espace Formateur**
- Bouton **+ Proposer un projet** pour créer un nouveau projet
- Bouton **Évaluer les livrables** sur un projet pour ajuster l'avancement

### 5.3 Connexion Administrateur

- Onglet **Admin** sur `login.html`
- Chip **Sénamé A. - Système** ou :
  - Email : `admin@campusconnect.tg` | Mot de passe : `admin@cc2025`
- Deux onglets : **Administration** et **Projets**
- Administration : KPIs globaux, gestion utilisateurs, journal d'activité
- Zone de danger : réinitialiser projets/inscriptions, exporter données en JSON

---

## 6. Corrections de bugs apportées

### Bug 1 — Aucun bouton ne répondait au clic (Admin & Formateur) 🔴 Critique

**Fichier :** `script.js`

**Cause :** `showSection(config.defaultTab)` était appelé à la ligne 141, avant que les fonctions `renderAdmin()`, `renderRecruteur()` et `renderDashboard()` soient définies (lignes 232+). En JavaScript, les variables `const` ne sont **pas hissées** (pas de hoisting). Pour les rôles admin et formateur, l'appel déclenchait une `ReferenceError` qui **crashait tout le callback `DOMContentLoaded`** — aucun `addEventListener` n'était jamais attaché sur toute la page.

**Correction :** `showSection(config.defaultTab)` a été déplacé à la section 17 (fin du script), après la définition de toutes les fonctions `render`.

```javascript
// ❌ AVANT (ligne 141 — trop tôt)
showSection(config.defaultTab);  // renderAdmin pas encore défini → crash

// ✅ APRÈS (section 17 — fin du script)
// Toutes les fonctions render sont définies ici
showSection(config.defaultTab);
renderProjects();
```

---

### Bug 2 — Bouton "Proposer un projet" n'ouvrait pas la modale 🟠

**Fichier :** `script.js` (section 12) + `index.html`

**Cause :** La modale `#modalFormulaire` possédait simultanément les classes Tailwind `flex` et `hidden` dans le HTML. Le CSS personnalisé dans `index.html` définissait `.hidden { display: none !important; }` qui écrasait Tailwind. Quand JavaScript retirait `hidden` via `classList.toggle()`, Tailwind Browser (CDN dynamique) ne réappliquait pas `flex` car il ne recalculait pas les styles à la volée.

**Correction en deux parties :**

1. Suppression de `.hidden { display: none !important; }` dans `index.html` (Tailwind gère nativement `.hidden`).
2. Remplacement de `toggleModal` par des fonctions `ouvrirModal()` / `fermerModal()` avec gestion explicite du `display` :

```javascript
// ❌ AVANT
const toggleModal = () => modalFormulaire?.classList.toggle("hidden");

// ✅ APRÈS
const ouvrirModal = () => {
    modalFormulaire.classList.remove("hidden");
    modalFormulaire.style.display = "flex";  // forcé explicitement
};
const fermerModal = () => {
    modalFormulaire.classList.add("hidden");
    modalFormulaire.style.display = "";
};
```

---

### Bug 3 — Bouton Déconnexion ne redirigeait pas fiablement 🟡

**Fichier :** `script.js` (section 6)

**Cause :** `window.location.href = "login.html"` avec un chemin relatif peut échouer selon le contexte (ouverture via `file://`, serveur Node.js, etc.).

**Correction :**

```javascript
// ❌ AVANT
window.location.href = "login.html";

// ✅ APRÈS
window.location.replace("login.html");
// .replace() est plus fiable et empêche le retour arrière après déconnexion
```

---

## 7. Dépannage

| Problème | Solution |
|----------|----------|
| **MySQL ne démarre pas dans XAMPP** | Vérifier si le port 3306 est occupé : `netstat -ano \| findstr :3306`. Changer le port dans `my.ini`. Supprimer `ib_logfile0` et `ib_logfile1` dans `C:\xampp\mysql\data\` |
| **Erreur connexion MySQL dans le terminal** | Vérifier `.env` : `DB_PASSWORD` doit être vide si pas de mot de passe XAMPP |
| **Failed to fetch dans la console** | Le serveur Node.js n'est pas lancé. Lancer : `node server.js` |
| **Erreur CORS dans la console** | `login.html` ouvert en double-clic. Utiliser **Live Server** de VS Code (port 5500) |
| **Les boutons ne répondent pas** | Ouvrir la console (F12) et vérifier les erreurs JavaScript. S'assurer d'utiliser le `script.js` corrigé |
| **Token expiré** | Se reconnecter. Durée par défaut : 7 jours (modifiable via `JWT_EXPIRES_IN` dans `.env`) |

---

## 8. Ordre de démarrage

| # | Action | Outil |
|---|--------|-------|
| 1 | Démarrer MySQL dans XAMPP | Panneau XAMPP > MySQL > **Start** |
| 2 | Lancer le serveur Node.js | Terminal > `node server.js` (dans `campusconnect-backend/`) |
| 3 | Ouvrir `login.html` | VS Code > Clic droit > **Open with Live Server** |
| 4 | Se connecter avec un compte | Onglet selon le rôle + chip de connexion rapide |
| 5 | Utiliser l'application | Selon votre rôle : étudiant, formateur ou administrateur |

---

*CampusConnect.tg — Documentation Technique v1.0.1 — IPNET · ESGIS · UL · 2025*
