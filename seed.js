// ============================================================
//  seed.js — Peuplement initial de la base de données
//  Lancez : node seed.js
// ============================================================

require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'campusconnect',
    waitForConnections: true,
});

const utilisateurs = [
    { prenom:'Rosemonde', nom:'Adeyi',     email:'rosemonde@campus-tg.org', password:'campus123',   role:'etudiant',  ecole:'IPNET',     score_ia:82 },
    { prenom:'Kofi',      nom:'Mensah',    email:'kofi@campus-tg.org',      password:'campus123',   role:'etudiant',  ecole:'ESGIS',     score_ia:74 },
    { prenom:'Amina',     nom:'Kossivi',   email:'amina@campus-tg.org',     password:'campus123',   role:'etudiant',  ecole:'UL',        score_ia:91 },
    { prenom:'Jean-Pierre',nom:'Agbodjan', email:'jpa@solveteck.tg',        password:'recruit2025', role:'recruteur', ecole:'SolveTeck', score_ia:0  },
    { prenom:'Sénamé',    nom:'Adjoa',     email:'admin@campusconnect.tg',  password:'admin@cc2025',role:'admin',     ecole:'Système',   score_ia:100},
];

async function seed() {
    try {
        console.log('🌱 Début du seeding...\n');

        // Vider les tables dans l'ordre (respect des FK)
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE sessions');
        await pool.query('TRUNCATE TABLE inscriptions');
        await pool.query('TRUNCATE TABLE competences');
        await pool.query('TRUNCATE TABLE projets');
        await pool.query('TRUNCATE TABLE utilisateurs');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🗑️  Tables vidées\n');

        // Insérer les utilisateurs avec mots de passe hashés
        const ids = {};
        for (const u of utilisateurs) {
            const hash = await bcrypt.hash(u.password, 10);
            const [r] = await pool.query(
                `INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role, ecole, score_ia)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [u.prenom, u.nom, u.email, hash, u.role, u.ecole, u.score_ia]
            );
            ids[u.email] = r.insertId;
            console.log(`  ✅ ${u.prenom} ${u.nom} (${u.role}) — id:${r.insertId}`);
        }

        // Insérer les projets
        console.log('\n📁 Insertion des projets...');
        const projets = [
            {
                titre: "Application Mobile d'Aide à l'Orientation Scolaire",
                description: "Conception d'une application mobile connectée à une API Python pour guider les futurs bacheliers togolais.",
                tags: JSON.stringify(["Développement Mobile","API Python"]),
                max_participants: 4, ecoles: "IPNET • ESGIS • UL",
                statut: "En cours", avancement: 75,
                createur_id: ids['rosemonde@campus-tg.org']
            },
            {
                titre: "Application de Gestion pour Salon de Coiffure",
                description: "Système de gestion des dossiers clients, rendez-vous et encaissements.",
                tags: JSON.stringify(["Génie Logiciel","SQL & Python"]),
                max_participants: 4, ecoles: "IPNET • UL",
                statut: "Recrutement ouvert", avancement: 40,
                createur_id: ids['kofi@campus-tg.org']
            },
            {
                titre: "Prototype de Driver Monitoring System (Guardian AI)",
                description: "Script Python d'analyse faciale pour détecter la somnolence au volant.",
                tags: JSON.stringify(["Python","Intelligence Artificielle"]),
                max_participants: 4, ecoles: "UL",
                statut: "Recrutement ouvert", avancement: 10,
                createur_id: ids['amina@campus-tg.org']
            }
        ];

        const projetIds = [];
        for (const p of projets) {
            const [r] = await pool.query(
                `INSERT INTO projets (titre, description, tags, max_participants, ecoles, statut, avancement, createur_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [p.titre, p.description, p.tags, p.max_participants, p.ecoles, p.statut, p.avancement, p.createur_id]
            );
            projetIds.push(r.insertId);
            console.log(`  ✅ "${p.titre.substring(0,40)}..." — id:${r.insertId}`);
        }

        // Inscriptions
        await pool.query(
            'INSERT INTO inscriptions (utilisateur_id, projet_id) VALUES (?, ?)',
            [ids['rosemonde@campus-tg.org'], projetIds[0]]
        );
        console.log('\n🔗 Inscription de Rosemonde au projet 1');

        // Compétences
        console.log('\n⭐ Insertion des compétences...');
        const competences = [
            { uid: ids['rosemonde@campus-tg.org'], nom: "Algorithmique & Python", pct: 45, label: "Lvl 2" },
            { uid: ids['rosemonde@campus-tg.org'], nom: "Travail d'équipe",        pct: 70, label: "Lvl 3" },
            { uid: ids['rosemonde@campus-tg.org'], nom: "Génie Logiciel",          pct: 30, label: "Lvl 1" },
            { uid: ids['kofi@campus-tg.org'],      nom: "Algorithmique & Python",  pct: 60, label: "Lvl 3" },
            { uid: ids['amina@campus-tg.org'],     nom: "Algorithmique & Python",  pct: 80, label: "Lvl 4" },
        ];
        for (const c of competences) {
            await pool.query(
                'INSERT INTO competences (utilisateur_id, nom, niveau_pct, niveau_label) VALUES (?, ?, ?, ?)',
                [c.uid, c.nom, c.pct, c.label]
            );
        }
        console.log(`  ✅ ${competences.length} compétences insérées`);

        console.log('\n✨ Seeding terminé avec succès !\n');
        console.log('═══════════════════════════════════════');
        console.log('Comptes créés :');
        console.log('  rosemonde@campus-tg.org  | campus123   | Étudiant');
        console.log('  kofi@campus-tg.org       | campus123   | Étudiant');
        console.log('  amina@campus-tg.org      | campus123   | Étudiant');
        console.log('  jpa@solveteck.tg         | recruit2025 | Recruteur');
        console.log('  admin@campusconnect.tg   | admin@cc2025| Admin');
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur seeding :', err.message);
        process.exit(1);
    }
}

seed();
