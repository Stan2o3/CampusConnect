// ============================================================
//  api.js — Client API pour CampusConnect.tg
//  Placez ce fichier dans votre dossier projet (même niveau que index.html)
//  Puis ajoutez dans index.html, AVANT script.js :
//    <script src="api.js"></script>
// ============================================================

const API_BASE = 'http://localhost:3000/api';
// ============================================================
//  GESTION DU TOKEN JWT
// ============================================================
const Auth = {
    getToken: ()    => localStorage.getItem('cc_token'),
    setToken: (tok) => localStorage.setItem('cc_token', tok),
    removeToken: () => localStorage.removeItem('cc_token'),

    getUser: ()     => {
        const raw = localStorage.getItem('cc_user');
        return raw ? JSON.parse(raw) : null;
    },
    setUser: (u)    => localStorage.setItem('cc_user', JSON.stringify(u)),
    removeUser: ()  => localStorage.removeItem('cc_user'),

    isLoggedIn: ()  => !!localStorage.getItem('cc_token'),
    logout: ()      => {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
    }
};

// ============================================================
//  REQUÊTE GÉNÉRIQUE (avec gestion du token)
// ============================================================
async function apiRequest(endpoint, options = {}) {
    const token = Auth.getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Erreur ${response.status}`);
        }
        return data;
    } catch (err) {
        if (err.message.includes('Failed to fetch')) {
            throw new Error('Serveur inaccessible. Lancez le backend avec : node server.js');
        }
        throw err;
    }
}

// ============================================================
//  AUTHENTIFICATION
// ============================================================
const AuthAPI = {

    // Connexion
    async login(email, mot_de_passe) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, mot_de_passe }
        });
        Auth.setToken(data.token);
        Auth.setUser(data.utilisateur);
        return data;
    },

    // Inscription
    async register({ prenom, nom, email, mot_de_passe, role, ecole }) {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: { prenom, nom, email, mot_de_passe, role, ecole }
        });
        Auth.setToken(data.token);
        Auth.setUser(data.utilisateur);
        return data;
    },

    // Profil courant
    async me() {
        return apiRequest('/auth/me');
    },

    // Déconnexion
    logout() {
        Auth.logout();
        window.location.href = 'login.html';
    }
};

// ============================================================
//  PROJETS
// ============================================================
const ProjetsAPI = {

    // Récupérer tous les projets
    async getAll() {
        return apiRequest('/projets');
    },

    // Un projet par ID
    async getById(id) {
        return apiRequest(`/projets/${id}`);
    },

    // Créer un projet
    async create(projet) {
        return apiRequest('/projets', { method: 'POST', body: projet });
    },

    // Modifier un projet
    async update(id, projet) {
        return apiRequest(`/projets/${id}`, { method: 'PUT', body: projet });
    },

    // Supprimer un projet
    async delete(id) {
        return apiRequest(`/projets/${id}`, { method: 'DELETE' });
    },

    // Rejoindre un projet
    async rejoindre(id) {
        return apiRequest(`/projets/${id}/rejoindre`, { method: 'POST' });
    },

    // Quitter un projet
    async quitter(id) {
        return apiRequest(`/projets/${id}/quitter`, { method: 'DELETE' });
    },

    // Projets d'un utilisateur
    async getMesProjets(userId) {
        return apiRequest(`/utilisateurs/${userId}/projets`);
    }
};

// ============================================================
//  COMPÉTENCES
// ============================================================
const CompetencesAPI = {
    async get(userId) {
        return apiRequest(`/utilisateurs/${userId}/competences`);
    },
    async update(userId, nom, niveau_pct, niveau_label) {
        return apiRequest(`/utilisateurs/${userId}/competences`, {
            method: 'PUT',
            body: { nom, niveau_pct, niveau_label }
        });
    }
};

// ============================================================
//  ADMIN
// ============================================================
const AdminAPI = {
    async getUtilisateurs() {
        return apiRequest('/admin/utilisateurs');
    },
    async deleteUtilisateur(id) {
        return apiRequest(`/admin/utilisateurs/${id}`, { method: 'DELETE' });
    }
};

// ============================================================
//  UTILITAIRE : Afficher une erreur réseau à l'utilisateur
// ============================================================
function handleAPIError(err) {
    console.error('[API Error]', err.message);
    const msg = err.message.includes('inaccessible')
        ? '⚠️ Impossible de joindre le serveur. Vérifiez que le backend est lancé.'
        : '⚠️ ' + err.message;
    alert(msg);
}

// ============================================================
//  VÉRIFICATION AU CHARGEMENT : redirige vers login si non connecté
//  Commentez ces lignes si vous voulez un accès sans connexion
// ============================================================
// Remplacez la fonction checkAuth à la fin de votre fichier api.js par celle-ci :
(function checkAuth() {
    const currentURL = window.location.href;
    
    // 1. Si l'adresse contient login.html ou register.html, on ne bloque rien
    if (currentURL.includes('login.html') || currentURL.includes('register.html')) {
        return;
    }
    
    // 2. Si on tente d'accéder à index.html (ou une autre page privée) sans jeton de connexion :

})();

console.log('✅ api.js chargé — Backend :', API_BASE);
