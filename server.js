// ============================================================
//  CAMPUSCONNECT.TG — Serveur API REST (Node.js + Express)
//  Fichier : server.js
// ============================================================

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const mysql     = require('mysql2/promise');

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
//  MIDDLEWARES
// ============================================================
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000', 'null'],
    credentials: true
}));
app.use(express.json());

// ============================================================
//  CONNEXION À LA BASE DE DONNÉES MySQL
// ============================================================
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'campusconnect',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

// Test de connexion au démarrage
pool.getConnection()
    .then(conn => {
        console.log('✅ Connexion MySQL réussie !');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Erreur connexion MySQL :', err.message);
        console.error('   Vérifiez votre fichier .env');
    });

// ============================================================
//  MIDDLEWARE : Vérification du token JWT
// ============================================================
function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'Token manquant.' });

    const token = header.split(' ')[1]; // "Bearer <token>"
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token invalide ou expiré.' });
    }
}

function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    }
    next();
}

// ============================================================
//  ROUTES — AUTHENTIFICATION
// ============================================================

// POST /api/auth/register — Créer un compte
app.post('/api/auth/register', async (req, res) => {
    const { prenom, nom, email, mot_de_passe, role, ecole } = req.body;

    if (!prenom || !nom || !email || !mot_de_passe) {
        return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }
    if (mot_de_passe.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères.' });
    }

    try {
        // Vérifier si l'email existe déjà
        const [existing] = await pool.query(
            'SELECT id FROM utilisateurs WHERE email = ?', [email.toLowerCase()]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const hash = await bcrypt.hash(mot_de_passe, 10);

        // Insérer l'utilisateur
        const [result] = await pool.query(
            `INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role, ecole)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [prenom, nom, email.toLowerCase(), hash, role || 'etudiant', ecole || null]
        );

        // Générer un token JWT
        const token = jwt.sign(
            { id: result.insertId, email, role: role || 'etudiant' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Compte créé avec succès !',
            token,
            utilisateur: { id: result.insertId, prenom, nom, email, role: role || 'etudiant', ecole }
        });

    } catch (err) {
        console.error('Erreur register :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/auth/login — Connexion
app.post('/api/auth/login', async (req, res) => {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
        return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT u.*, 
                    COUNT(i.id) AS nb_projets
             FROM utilisateurs u
             LEFT JOIN inscriptions i ON i.utilisateur_id = u.id
             WHERE u.email = ? AND u.actif = 1
             GROUP BY u.id`,
            [email.toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!valid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Ne jamais renvoyer le mot de passe
        delete user.mot_de_passe;

        res.json({
            message: 'Connexion réussie !',
            token,
            utilisateur: user
        });

    } catch (err) {
        console.error('Erreur login :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /api/auth/me — Profil de l'utilisateur connecté
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.prenom, u.nom, u.email, u.role, u.ecole, u.niveau,
                    u.score_ia, u.avatar_url, u.created_at,
                    COUNT(i.id) AS nb_projets
             FROM utilisateurs u
             LEFT JOIN inscriptions i ON i.utilisateur_id = u.id
             WHERE u.id = ?
             GROUP BY u.id`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ============================================================
//  ROUTES — PROJETS
// ============================================================

// GET /api/projets — Tous les projets avec nb participants
app.get('/api/projets', async (req, res) => {
    try {
        const [projets] = await pool.query(
            `SELECT p.*,
                    u.prenom AS createur_prenom, u.nom AS createur_nom,
                    COUNT(i.id) AS nb_participants
             FROM projets p
             JOIN utilisateurs u ON u.id = p.createur_id
             LEFT JOIN inscriptions i ON i.projet_id = p.id
             GROUP BY p.id
             ORDER BY p.created_at DESC`
        );
        res.json(projets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /api/projets/:id — Un projet avec ses membres
app.get('/api/projets/:id', async (req, res) => {
    try {
        const [[projet]] = await pool.query(
            `SELECT p.*, COUNT(i.id) AS nb_participants
             FROM projets p
             LEFT JOIN inscriptions i ON i.projet_id = p.id
             WHERE p.id = ? GROUP BY p.id`,
            [req.params.id]
        );
        if (!projet) return res.status(404).json({ error: 'Projet introuvable.' });

        const [membres] = await pool.query(
            `SELECT u.id, u.prenom, u.nom, u.ecole, u.role
             FROM inscriptions i
             JOIN utilisateurs u ON u.id = i.utilisateur_id
             WHERE i.projet_id = ?`,
            [req.params.id]
        );

        res.json({ ...projet, membres });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// POST /api/projets — Créer un projet (authentifié)
app.post('/api/projets', authMiddleware, async (req, res) => {
    const { titre, description, tags, max_participants, ecoles, statut, avancement } = req.body;
    if (!titre) return res.status(400).json({ error: 'Le titre est obligatoire.' });

    try {
        const [result] = await pool.query(
            `INSERT INTO projets (titre, description, tags, max_participants, ecoles, statut, avancement, createur_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                titre, description || null,
                JSON.stringify(tags || []),
                max_participants || 4,
                ecoles || null,
                statut || 'Recrutement ouvert',
                avancement || 0,
                req.user.id
            ]
        );
        res.status(201).json({ message: 'Projet créé !', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/projets/:id — Modifier un projet
app.put('/api/projets/:id', authMiddleware, async (req, res) => {
    const { titre, description, statut, avancement, tags, ecoles } = req.body;
    try {
        await pool.query(
            `UPDATE projets SET titre=?, description=?, statut=?, avancement=?, tags=?, ecoles=?, updated_at=NOW()
             WHERE id=? AND (createur_id=? OR ? = 'admin')`,
            [titre, description, statut, avancement, JSON.stringify(tags || []), ecoles,
             req.params.id, req.user.id, req.user.role]
        );
        res.json({ message: 'Projet mis à jour.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/projets/:id
app.delete('/api/projets/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM projets WHERE id=? AND (createur_id=? OR ?="admin")',
            [req.params.id, req.user.id, req.user.role]
        );
        res.json({ message: 'Projet supprimé.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ============================================================
//  ROUTES — INSCRIPTIONS
// ============================================================

// POST /api/projets/:id/rejoindre — Rejoindre un projet
app.post('/api/projets/:id/rejoindre', authMiddleware, async (req, res) => {
    try {
        // Vérifier les places disponibles
        const [[projet]] = await pool.query(
            `SELECT p.max_participants, COUNT(i.id) AS nb
             FROM projets p
             LEFT JOIN inscriptions i ON i.projet_id = p.id
             WHERE p.id = ? GROUP BY p.id`,
            [req.params.id]
        );
        if (!projet) return res.status(404).json({ error: 'Projet introuvable.' });
        if (projet.nb >= projet.max_participants) {
            return res.status(409).json({ error: 'Équipe complète.' });
        }

        await pool.query(
            'INSERT IGNORE INTO inscriptions (utilisateur_id, projet_id) VALUES (?, ?)',
            [req.user.id, req.params.id]
        );
        res.json({ message: 'Vous avez rejoint le projet !' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/projets/:id/quitter — Quitter un projet
app.delete('/api/projets/:id/quitter', authMiddleware, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM inscriptions WHERE utilisateur_id=? AND projet_id=?',
            [req.user.id, req.params.id]
        );
        res.json({ message: 'Vous avez quitté le projet.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// GET /api/utilisateurs/:id/projets — Projets d'un utilisateur
app.get('/api/utilisateurs/:id/projets', authMiddleware, async (req, res) => {
    try {
        const [projets] = await pool.query(
            `SELECT p.*, COUNT(i2.id) AS nb_participants
             FROM inscriptions i
             JOIN projets p ON p.id = i.projet_id
             LEFT JOIN inscriptions i2 ON i2.projet_id = p.id
             WHERE i.utilisateur_id = ?
             GROUP BY p.id`,
            [req.params.id]
        );
        res.json(projets);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ============================================================
//  ROUTES — COMPÉTENCES
// ============================================================

// GET /api/utilisateurs/:id/competences
app.get('/api/utilisateurs/:id/competences', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM competences WHERE utilisateur_id = ?',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// PUT /api/utilisateurs/:id/competences — Mettre à jour
app.put('/api/utilisateurs/:id/competences', authMiddleware, async (req, res) => {
    const { nom, niveau_pct, niveau_label } = req.body;
    try {
        await pool.query(
            `INSERT INTO competences (utilisateur_id, nom, niveau_pct, niveau_label)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE niveau_pct=VALUES(niveau_pct), niveau_label=VALUES(niveau_label)`,
            [req.params.id, nom, niveau_pct, niveau_label]
        );
        res.json({ message: 'Compétence mise à jour.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ============================================================
//  ROUTES — ADMIN
// ============================================================

// GET /api/admin/utilisateurs — Tous les utilisateurs
app.get('/api/admin/utilisateurs', authMiddleware, adminOnly, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, prenom, nom, email, role, ecole, score_ia, actif, created_at FROM utilisateurs ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// DELETE /api/admin/utilisateurs/:id
app.delete('/api/admin/utilisateurs/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM utilisateurs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Utilisateur supprimé.' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ============================================================
//  SANTÉ DU SERVEUR
// ============================================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connectée', timestamp: new Date() });
    } catch {
        res.status(500).json({ status: 'error', database: 'déconnectée' });
    }
});

// ============================================================
//  DÉMARRAGE
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Serveur CampusConnect lancé sur http://localhost:${PORT}`);
    console.log(`📋 Routes disponibles :`);
    console.log(`   POST /api/auth/register`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET  /api/auth/me`);
    console.log(`   GET  /api/projets`);
    console.log(`   POST /api/projets/:id/rejoindre`);
    console.log(`   GET  /api/admin/utilisateurs`);
});
