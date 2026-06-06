-- ============================================================
--  CAMPUSCONNECT.TG — Base de données MySQL
--  Exécutez ce script dans phpMyAdmin ou MySQL Workbench
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campusconnect;

-- ============================================================
--  TABLE : utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    prenom       VARCHAR(100)  NOT NULL,
    nom          VARCHAR(100)  NOT NULL,
    email        VARCHAR(255)  NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255)  NOT NULL,   -- bcrypt hash
    role         ENUM('etudiant','recruteur','admin') NOT NULL DEFAULT 'etudiant',
    ecole        VARCHAR(150)  DEFAULT NULL,
    niveau       VARCHAR(50)   DEFAULT 'Licence 1',
    score_ia     INT           DEFAULT 0,
    avatar_url   VARCHAR(500)  DEFAULT NULL,
    actif        TINYINT(1)    DEFAULT 1,
    created_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
--  TABLE : projets
-- ============================================================
CREATE TABLE IF NOT EXISTS projets (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    titre             VARCHAR(300)  NOT NULL,
    description       TEXT,
    tags              JSON,                        -- ex: ["Python", "Mobile"]
    max_participants  INT           DEFAULT 4,
    ecoles            VARCHAR(300)  DEFAULT NULL,  -- "IPNET • ESGIS • UL"
    statut            ENUM('En cours','Recrutement ouvert','Terminé') DEFAULT 'Recrutement ouvert',
    avancement        INT           DEFAULT 0,     -- 0 à 100
    createur_id       INT           NOT NULL,
    created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================================
--  TABLE : inscriptions (relation utilisateur <-> projet)
-- ============================================================
CREATE TABLE IF NOT EXISTS inscriptions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    projet_id      INT NOT NULL,
    joined_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_inscription (utilisateur_id, projet_id),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (projet_id)      REFERENCES projets(id)      ON DELETE CASCADE
);

-- ============================================================
--  TABLE : competences (suivi par utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS competences (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    nom            VARCHAR(150) NOT NULL,
    niveau_pct     INT DEFAULT 0,   -- 0 à 100
    niveau_label   VARCHAR(50)  DEFAULT 'Lvl 1',
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================================
--  TABLE : sessions (tokens JWT stockés côté serveur)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    token          VARCHAR(500) NOT NULL,
    expires_at     DATETIME    NOT NULL,
    created_at     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ============================================================
--  DONNÉES DE DÉPART (seed)
--  Mots de passe hashés avec bcrypt (rounds=10) :
--    campus123    → $2b$10$XY... (voir server.js pour la génération)
--    recruit2025  → hash différent
--    admin@cc2025 → hash différent
--  Pour générer les vrais hashs, lancez : node seed.js
-- ============================================================

INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role, ecole, niveau, score_ia) VALUES
('Rosemonde', 'Adeyi',    'rosemonde@campus-tg.org',    'HASH_ICI', 'etudiant',  'IPNET',    'Licence 1', 82),
('Kofi',      'Mensah',   'kofi@campus-tg.org',         'HASH_ICI', 'etudiant',  'ESGIS',    'Licence 2', 74),
('Amina',     'Kossivi',  'amina@campus-tg.org',        'HASH_ICI', 'etudiant',  'UL',       'Licence 1', 91),
('Jean-Pierre','Agbodjan','jpa@solveteck.tg',            'HASH_ICI', 'recruteur', 'SolveTeck','—',         0),
('Sénamé',    'Adjoa',    'admin@campusconnect.tg',     'HASH_ICI', 'admin',     'Système',  '—',         100);

INSERT INTO projets (titre, description, tags, max_participants, ecoles, statut, avancement, createur_id) VALUES
(
  'Application Mobile d\'Aide à l\'Orientation Scolaire',
  'Conception d\'une application mobile connectée à une API Python pour guider les futurs bacheliers togolais.',
  '["Développement Mobile","API Python"]', 4, 'IPNET • ESGIS • UL', 'En cours', 75, 1
),
(
  'Application de Gestion pour Salon de Coiffure',
  'Système de gestion des dossiers clients, rendez-vous et encaissements avec modélisation UML.',
  '["Génie Logiciel","SQL & Python"]', 4, 'IPNET • UL', 'Recrutement ouvert', 40, 2
),
(
  'Prototype de Driver Monitoring System (Guardian AI)',
  'Script Python d\'analyse faciale pour détecter la somnolence au volant.',
  '["Python","Intelligence Artificielle"]', 4, 'UL', 'Recrutement ouvert', 10, 3
);

INSERT INTO inscriptions (utilisateur_id, projet_id) VALUES (1, 1);
INSERT INTO competences (utilisateur_id, nom, niveau_pct, niveau_label) VALUES
(1, 'Algorithmique & Python', 45, 'Lvl 2'),
(1, 'Travail d\'équipe',       70, 'Lvl 3'),
(1, 'Génie Logiciel',          30, 'Lvl 1'),
(2, 'Algorithmique & Python',  60, 'Lvl 3'),
(3, 'Algorithmique & Python',  80, 'Lvl 4');


desc inscriptions;
desc competences;
desc utilisateurs ;
select *
from utilisateurs