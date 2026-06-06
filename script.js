document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 0. SYSTÈME DE RÔLES — Récupérer l'utilisateur connecté
    // ==========================================
    const sessionRaw = localStorage.getItem("campusconnect_session");
    const currentUser = sessionRaw ? JSON.parse(sessionRaw) : null;

    // Si pas de session, rediriger vers login
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // Rôle actif : 'etudiant', 'recruteur' ou 'admin'
    const role = currentUser.role || "etudiant";

    // Définition des accès par rôle
    const ROLES = {
        etudiant: {
            label: "Étudiant",
            emoji: "🎓",
            badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
            tabs: [
                { id: "btnTabDashboard",  label: "📊 Mon Espace",     section: "sectionDashboard" },
                { id: "btnTabProjets",    label: "🚀 Espace Projets", section: "sectionEtudiant"  },
            ],
            defaultTab: "sectionEtudiant",
            showChatbot: true,
            showProfil: true,
        },
        recruteur: {
            label: "Formateur",
            emoji: "💼",
            badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
            tabs: [
                { id: "btnTabRecruteur", label: "💼 Espace Formateur", section: "sectionRecruteur" },
            ],
            defaultTab: "sectionRecruteur",
            showChatbot: true,
            showProfil: false,
        },
        admin: {
            label: "Administrateur",
            emoji: "⚙️",
            badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
            tabs: [
                { id: "btnTabAdmin",     label: "⚙️ Administration",  section: "sectionAdmin"    },
                { id: "btnTabRecruteur", label: "💼 Projets",          section: "sectionRecruteur"},
            ],
            defaultTab: "sectionAdmin",
            showChatbot: false,
            showProfil: false,
        }
    };

    const config = ROLES[role] || ROLES.etudiant;

    // ==========================================
    // 1. INITIALISATION DU THÈME
    // ==========================================
    const btnThemeToggle = document.getElementById("btnThemeToggle");
    const htmlElement = document.documentElement;
    const currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "dark") htmlElement.classList.add("dark");
    else htmlElement.classList.remove("dark");
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener("click", () => {
            htmlElement.classList.toggle("dark");
            localStorage.setItem("theme", htmlElement.classList.contains("dark") ? "dark" : "light");
        });
    }

    // ==========================================
    // 2. AFFICHAGE DU NOM + BADGE RÔLE DANS LA NAV
    // ==========================================
    const navUserName = document.getElementById("navUserName");
    const navRoleBadge = document.getElementById("navRoleBadge");
    if (navUserName) navUserName.textContent = currentUser.prenom || "Utilisateur";
    if (navRoleBadge) {
        navRoleBadge.textContent = `${config.emoji} ${config.label}`;
        navRoleBadge.className = `text-xs font-bold px-2.5 py-1 rounded-full ml-1 ${config.badgeClass}`;
        navRoleBadge.classList.remove("hidden");
    }

    // ==========================================
    // 3. CONSTRUCTION DES ONGLETS DE NAVIGATION (selon rôle)
    // ==========================================
    const navTabs = document.getElementById("navTabs");
    if (navTabs) {
        navTabs.innerHTML = "";
        config.tabs.forEach((tab, i) => {
            const btn = document.createElement("button");
            btn.id = tab.id;
            btn.dataset.section = tab.section;
            btn.className = "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
            btn.textContent = tab.label;
            navTabs.appendChild(btn);
        });
    }

    // ==========================================
    // 4. GESTION DE LA NAVIGATION ENTRE SECTIONS
    // ==========================================
    const allSections = ["sectionDashboard","sectionEtudiant","sectionRecruteur","sectionAdmin"];

    function showSection(sectionId) {
        allSections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.remove("hidden");
            target.classList.add("component-fade");
        }
        // Mettre à jour les onglets actifs
        if (navTabs) {
            navTabs.querySelectorAll("button").forEach(btn => {
                const isActive = btn.dataset.section === sectionId;
                btn.className = isActive
                    ? "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer role-btn-active"
                    : "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
            });
        }
        // Rafraîchir les vues dynamiques
        if (sectionId === "sectionDashboard") renderDashboard();
        if (sectionId === "sectionAdmin") renderAdmin();
        if (sectionId === "sectionRecruteur") renderRecruteur();
    }

    // Clic sur les onglets
    if (navTabs) {
        navTabs.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-section]");
            if (btn) showSection(btn.dataset.section);
        });
    }

    // Afficher la section par défaut
    showSection(config.defaultTab);

    // ==========================================
    // 5. CHATBOT & PROFIL — Visibilité selon rôle
    // ==========================================
    const btnChatbot = document.getElementById("btnChatbotToggle");
    if (btnChatbot) {
        if (config.showChatbot) btnChatbot.classList.remove("hidden");
        else btnChatbot.classList.add("hidden");
    }

    const btnProfil = document.getElementById("btnMonProfil");
    const sectionProfil = document.getElementById("sectionProfil");
    if (btnProfil) {
        if (config.showProfil) {
            // Remplir le profil
            const profilAvatar = document.getElementById("profilAvatar");
            const profilNom = document.getElementById("profilNom");
            const profilEcole = document.getElementById("profilEcole");
            const profilRoleBadge = document.getElementById("profilRoleBadge");
            const initiales = ((currentUser.prenom || "?")[0] + (currentUser.nom || "?")[0]).toUpperCase();
            if (profilAvatar) profilAvatar.textContent = initiales;
            if (profilNom) profilNom.textContent = `${currentUser.prenom || ""} ${currentUser.nom || ""}`;
            if (profilEcole) profilEcole.textContent = currentUser.ecole || "—";
            if (profilRoleBadge) profilRoleBadge.textContent = `${config.emoji} ${config.label}`;
            btnProfil.addEventListener("click", () => sectionProfil?.classList.remove("hidden"));
        } else {
            // Pas de drawer profil, désactiver le clic
            btnProfil.style.cursor = "default";
        }
    }
    const btnFermerProfil = document.getElementById("btnFermerProfil");
    if (btnFermerProfil && sectionProfil) {
        btnFermerProfil.addEventListener("click", () => sectionProfil.classList.add("hidden"));
        sectionProfil.addEventListener("click", (e) => { if (e.target === sectionProfil) sectionProfil.classList.add("hidden"); });
    }

    // ==========================================
    // 6. DÉCONNEXION
    // ==========================================
    const btnDeconnexion = document.getElementById("btnDeconnexion");
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener("click", () => {
            localStorage.removeItem("campusconnect_session");
            window.location.href = "login.html";
        });
    }

    // ==========================================
    // 7. DONNÉES (localStorage)
    // ==========================================
    const defaultProjects = [
        { id: 1, title: "Application Mobile d'Aide à l'Orientation Scolaire", desc: "Conception d'une application mobile connectée à une API Python pour guider les futurs bacheliers togolais.", tags: ["Développement Mobile","API Python"], participantsCount: 3, maxParticipants: 4, schools: "IPNET • ESGIS • UL", status: "En cours", progress: 75, badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
        { id: 2, title: "Application de Gestion pour Salon de Coiffure", desc: "Système de gestion des dossiers clients, planification des rendez-vous et encaissements avec modélisation UML.", tags: ["Génie Logiciel","SQL & Python"], participantsCount: 2, maxParticipants: 4, schools: "IPNET • UL", status: "Recrutement ouvert", progress: 40, badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
        { id: 3, title: "Prototype de Driver Monitoring System (Guardian AI)", desc: "Script Python d'analyse faciale pour détecter la somnolence au volant.", tags: ["Python","Intelligence Artificielle"], participantsCount: 1, maxParticipants: 4, schools: "UL", status: "Recrutement ouvert", progress: 10, badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" }
    ];

    const defaultUsers = [
        { id: 1, prenom: "Rosemonde", nom: "Adeyi",    email: "rosemonde@campus-tg.org", role: "etudiant",  ecole: "IPNET",     scoreIA: 82 },
        { id: 2, prenom: "Kofi",      nom: "Mensah",   email: "kofi@campus-tg.org",      role: "etudiant",  ecole: "ESGIS",     scoreIA: 74 },
        { id: 3, prenom: "Amina",     nom: "Kossivi",  email: "amina@campus-tg.org",     role: "etudiant",  ecole: "UL",        scoreIA: 91 },
        { id: 4, prenom: "Jean-Pierre",nom:"Agbodjan", email: "jpa@solveteck.tg",        role: "recruteur", ecole: "SolveTeck", scoreIA: 0  },
        { id: 5, prenom: "Sénamé",    nom: "Adjoa",    email: "admin@campusconnect.tg",  role: "admin",     ecole: "Système",   scoreIA: 100}
    ];

    let state = {
        projects:     JSON.parse(localStorage.getItem("campusconnect_projects"))     || defaultProjects,
        inscriptions: JSON.parse(localStorage.getItem("campusconnect_inscriptions")) || [1],
        users:        JSON.parse(localStorage.getItem("campusconnect_users"))        || defaultUsers,
        journal:      JSON.parse(localStorage.getItem("campusconnect_journal"))      || []
    };

    const saveState = () => {
        localStorage.setItem("campusconnect_projects",     JSON.stringify(state.projects));
        localStorage.setItem("campusconnect_inscriptions", JSON.stringify(state.inscriptions));
        localStorage.setItem("campusconnect_users",        JSON.stringify(state.users));
        localStorage.setItem("campusconnect_journal",      JSON.stringify(state.journal));
    };

    const logJournal = (msg) => {
        const now = new Date().toLocaleString("fr-FR");
        state.journal.unshift({ msg, time: now, user: currentUser.prenom });
        if (state.journal.length > 50) state.journal.pop();
        saveState();
    };

    // ==========================================
    // 8. VUE — DASHBOARD ÉTUDIANT
    // ==========================================
    const renderDashboard = () => {
        const projetsRejoints = state.projects.filter(p => state.inscriptions.includes(p.id));
        const dashCountProjets    = document.getElementById("dashCountProjets");
        const dashHours           = document.getElementById("dashHours");
        const dashSchools         = document.getElementById("dashSchools");
        const dashListeProjets    = document.getElementById("dashListeProjets");
        const dashAlgoProgress    = document.getElementById("dashAlgoProgress");
        const dashAlgoProgressBar = document.getElementById("dashAlgoProgressBar");
        const dashEquipeProgress  = document.getElementById("dashEquipeProgress");
        const dashEquipeProgressBar = document.getElementById("dashEquipeProgressBar");
        const dashGLProgress      = document.getElementById("dashGLProgress");
        const dashGLProgressBar   = document.getElementById("dashGLProgressBar");

        if (dashCountProjets) dashCountProjets.innerText = projetsRejoints.length;
        const totalH = projetsRejoints.reduce((a, p) => a + (p.progress || 0), 0);
        if (dashHours) dashHours.innerText = `${totalH} h`;
        const ecoles = [];
        projetsRejoints.forEach(p => p.schools.split("•").forEach(s => { const n = s.trim(); if (n && !ecoles.includes(n)) ecoles.push(n); }));
        if (dashSchools) dashSchools.innerText = ecoles.length;

        if (dashListeProjets) {
            dashListeProjets.innerHTML = "";
            if (projetsRejoints.length === 0) {
                dashListeProjets.innerHTML = `<div class="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-medium">Vous n'avez rejoint aucun projet. Allez dans <strong>Espace Projets</strong> !</div>`;
            } else {
                projetsRejoints.forEach(p => {
                    const item = document.createElement("div");
                    item.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-card component-fade";
                    item.innerHTML = `
                        <div class="flex-1 w-full">
                            <span class="${p.badgeClass} text-xs font-semibold px-2.5 py-0.5 rounded-md mb-2 inline-block">${p.tags[0]||"Projet"}</span>
                            <h4 class="font-bold text-slate-900 dark:text-white text-base">${p.title}</h4>
                            <p class="text-xs text-slate-400 mt-1">${p.schools}</p>
                            <div class="mt-3 w-full">
                                <div class="flex justify-between text-xs text-slate-400 mb-1"><span>Livrables</span><span>${p.progress||0}%</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full"><div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style="width:${p.progress||0}%"></div></div>
                            </div>
                        </div>`;
                    dashListeProjets.appendChild(item);
                });
            }
        }

        // Compétences
        const countP = projetsRejoints.filter(p => p.tags.some(t => /python|algo/i.test(t))).length;
        const pP = Math.min(100, 45 + countP * 15);
        const lvlP = pP >= 80 ? 4 : pP >= 60 ? 3 : 2;
        if (dashAlgoProgress) dashAlgoProgress.innerText = `Lvl ${lvlP} (${pP}%)`;
        if (dashAlgoProgressBar) dashAlgoProgressBar.style.width = `${pP}%`;

        const pE = Math.min(100, 70 + projetsRejoints.length * 10);
        const lvlE = pE >= 90 ? 5 : pE >= 80 ? 4 : 3;
        if (dashEquipeProgress) dashEquipeProgress.innerText = `Lvl ${lvlE} (${pE}%)`;
        if (dashEquipeProgressBar) dashEquipeProgressBar.style.width = `${pE}%`;

        const countG = projetsRejoints.filter(p => p.tags.some(t => /logiciel|uml|architecture/i.test(t))).length;
        const pG = Math.min(100, 15 + countG * 20);
        const lvlG = pG >= 75 ? 4 : pG >= 55 ? 3 : pG >= 35 ? 2 : 1;
        if (dashGLProgress) dashGLProgress.innerText = `Lvl ${lvlG} (${pG}%)`;
        if (dashGLProgressBar) dashGLProgressBar.style.width = `${pG}%`;

        // Barre profil
        const update = (id, barId, val, lbl) => { const e = document.getElementById(id); const b = document.getElementById(barId); if (e) e.innerText = lbl; if (b) b.style.width = `${val}%`; };
        update("profilAlgoProgress",  "profilAlgoProgressBar",  pP, `Lvl ${lvlP}`);
        update("profilEquipeProgress","profilEquipeProgressBar",pE, `Lvl ${lvlE}`);
        update("profilGLProgress",    "profilGLProgressBar",    pG, `Lvl ${lvlG}`);
    };

    // ==========================================
    // 9. VUE — ESPACE PROJETS ÉTUDIANT (renderProjects)
    // ==========================================
    const inputRechercheProjet = document.getElementById("inputRechercheProjet");
    const selectInstitution    = document.getElementById("selectInstitution");
    const conteneurProjets     = document.getElementById("conteneurProjetsEtudiants");

    const ajouterActu = (htmlMsg, dismiss = false) => {
        const filActualites = document.getElementById("filActualites");
        if (!filActualites) return;
        if (filActualites.innerText.includes("Aucune activité")) filActualites.innerHTML = "";
        const div = document.createElement("div");
        div.className = "flex items-start justify-between space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs component-fade group";
        div.innerHTML = `<div class="flex items-start space-x-3">${htmlMsg}</div>${dismiss?`<button class="btn-supprimer-actu text-slate-300 hover:text-rose-500 font-bold ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-sm">&times;</button>`:""}`;
        filActualites.prepend(div);
    };

    const renderProjects = () => {
        if (!conteneurProjets) return;
        const query      = inputRechercheProjet ? inputRechercheProjet.value.toLowerCase().trim() : "";
        const instFilter = selectInstitution ? selectInstitution.value : "";

        conteneurProjets.innerHTML = "";

        const filtered = state.projects.filter(p => {
            const mQ = p.title.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query) || p.tags.some(t => t.toLowerCase().includes(query));
            let mI = true;
            if (instFilter === "ipnet")  mI = p.schools.toLowerCase().includes("ipnet");
            else if (instFilter === "esgis") mI = p.schools.toLowerCase().includes("esgis");
            else if (instFilter === "ul")    mI = p.schools.toLowerCase().includes("ul");
            else if (instFilter === "uk")    mI = p.schools.toLowerCase().includes("uk");
            return mQ && mI;
        });

        if (filtered.length === 0) {
            conteneurProjets.innerHTML = `<div class="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-medium">Aucun projet ne correspond à votre recherche.</div>`;
            return;
        }

        filtered.forEach(p => {
            const estInscrit   = state.inscriptions.includes(p.id);
            const countInscrit = estInscrit ? p.participantsCount + 1 : p.participantsCount;
            const btnLabel     = estInscrit ? "Se désinscrire ✕" : "Rejoindre l'équipe →";
            const btnClass     = estInscrit
                ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer btn-action-projet"
                : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer btn-action-projet";
            const avatarColors = ["bg-indigo-600","bg-amber-500","bg-purple-500","bg-emerald-600","bg-blue-600"];
            const avatarHtml = Array.from({length:countInscrit}).map((_,i) => `<div class="w-7 h-7 rounded-full ${avatarColors[i%5]} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">${["M","S","B","R","A"][i%5]}</div>`).join("");

            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover-card component-fade";
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="${p.badgeClass} text-xs font-medium px-2.5 py-0.5 rounded-md">${p.tags[0]||"Projet"}</span>
                        <span class="text-xs text-slate-400 font-medium">${countInscrit}/${p.maxParticipants} Participants</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white text-lg mb-1">${p.title}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${p.desc}</p>
                    <div class="mb-4">
                        <div class="flex justify-between text-xs text-slate-400 mb-1"><span>Avancement</span><span class="font-semibold text-slate-600 dark:text-slate-300">${p.progress}%</span></div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full"><div class="bg-blue-500 h-2 rounded-full" style="width:${p.progress}%"></div></div>
                    </div>
                    <div class="flex items-center space-x-2 mb-4">
                        <span class="text-xs text-slate-400 mr-2">Équipe :</span>
                        <div class="flex -space-x-2">${avatarHtml}</div>
                        <span class="text-xs text-slate-500 pl-2">${p.schools}</span>
                    </div>
                </div>
                <div class="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                    <span class="text-xs text-slate-500">Statut : <span class="${p.status==="Recrutement ouvert"?"text-emerald-600 dark:text-emerald-400":"text-amber-600 dark:text-amber-400"} font-semibold">${p.status}</span></span>
                    <button class="${btnClass}" data-inscrit="${estInscrit}" data-id="${p.id}">${btnLabel}</button>
                </div>`;
            conteneurProjets.appendChild(card);
        });

        // Mettre à jour la liste des projets dans le CV
        const listeProjetsCV = document.getElementById("listeProjetsCV");
        if (listeProjetsCV) {
            listeProjetsCV.innerHTML = "";
            const inscrits = state.projects.filter(p => state.inscriptions.includes(p.id));
            if (inscrits.length === 0) {
                listeProjetsCV.innerHTML = `<li style="color:#94a3b8; font-style:italic;">Aucun projet. Rejoignez une équipe !</li>`;
            } else {
                inscrits.forEach(p => {
                    const li = document.createElement("li");
                    li.style.cssText = "margin-bottom:0.3rem; color:#334155;";
                    li.innerHTML = `${p.title} <span style="color:#059669; font-weight:600;">(${p.progress}% accompli)</span>`;
                    listeProjetsCV.appendChild(li);
                });
            }
        }
    };

    if (inputRechercheProjet) inputRechercheProjet.addEventListener("input", renderProjects);
    if (selectInstitution) {
        selectInstitution.addEventListener("change", () => {
            if (selectInstitution.value === "autre") {
                const nom = prompt("Nom de l'université partenaire :");
                if (nom && nom.trim()) {
                    const opt = document.createElement("option");
                    opt.value = nom.trim().toLowerCase().replace(/\s+/g, "-");
                    opt.text  = nom.trim();
                    selectInstitution.insertBefore(opt, selectInstitution.lastElementChild);
                    opt.selected = true;
                } else selectInstitution.selectedIndex = 0;
            }
            renderProjects();
        });
    }

    // Fil d'actualités - vider
    const btnViderActus = document.getElementById("btnViderActus");
    const filActualites = document.getElementById("filActualites");
    if (btnViderActus && filActualites) {
        btnViderActus.addEventListener("click", () => {
            filActualites.innerHTML = `<div class="text-center py-6 text-slate-400 italic">Aucune activité récente.</div>`;
        });
    }

    // Délégation clics (inscriptions + suppression actu)
    document.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("btn-supprimer-actu")) {
            const row = e.target.closest(".flex");
            if (row) { row.style.opacity = "0"; row.style.transition = "opacity 0.3s"; setTimeout(() => row.remove(), 300); }
            return;
        }
        if (e.target && e.target.classList.contains("btn-action-projet")) {
            const btn = e.target;
            const projectId = parseInt(btn.getAttribute("data-id"));
            const estInscrit = state.inscriptions.includes(projectId);
            const projet = state.projects.find(p => p.id === projectId);
            if (!estInscrit) {
                state.inscriptions.push(projectId);
                saveState(); renderProjects();
                if (!document.getElementById("sectionDashboard")?.classList.contains("hidden")) renderDashboard();
                ajouterActu(`<div class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div><div><p class="text-slate-700 dark:text-slate-300 font-medium">${currentUser.prenom} a rejoint <span class="font-semibold text-emerald-700 dark:text-emerald-400">${projet.title}</span>.</p><span class="text-slate-400 text-[10px]">À l'instant</span></div>`, true);
                logJournal(`${currentUser.prenom} a rejoint le projet "${projet.title}"`);
            } else {
                state.inscriptions = state.inscriptions.filter(id => id !== projectId);
                saveState(); renderProjects();
                if (!document.getElementById("sectionDashboard")?.classList.contains("hidden")) renderDashboard();
                ajouterActu(`<div class="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></div><div><p class="text-slate-700 dark:text-slate-300 font-medium">${currentUser.prenom} s'est désinscrit(e) de <span class="font-semibold">${projet.title}</span>.</p><span class="text-slate-400 text-[10px]">À l'instant</span></div>`, true);
                logJournal(`${currentUser.prenom} a quitté le projet "${projet.title}"`);
            }
            return;
        }
        if (e.target && e.target.classList.contains("btnEvaluerLivrables") && !e.target.disabled) {
            ouvrirEvaluationProjet(parseInt(e.target.getAttribute("data-id")));
        }
    });

    // ==========================================
    // 10. VUE — ESPACE FORMATEUR / RECRUTEUR
    // ==========================================
    const renderRecruteur = () => {
        const listeOffres = document.getElementById("listeOffres");
        if (!listeOffres) return;

        const inputR = document.getElementById("inputRechercheRecruteur");
        const filtreStatut = document.getElementById("filtreStatutRecruteur");
        const query  = inputR ? inputR.value.toLowerCase().trim() : "";
        const statut = filtreStatut ? filtreStatut.value : "";

        const filtered = state.projects.filter(p => {
            const mQ = p.title.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
            const mS = !statut || p.status === statut;
            return mQ && mS;
        });

        // Stats formateur
        const recruteurNbProjets    = document.getElementById("recruteurNbProjets");
        const recruteurNbEtudiants  = document.getElementById("recruteurNbEtudiants");
        const recruteurAvgProgress  = document.getElementById("recruteurAvgProgress");
        if (recruteurNbProjets)   recruteurNbProjets.innerText   = state.projects.length;
        if (recruteurNbEtudiants) recruteurNbEtudiants.innerText  = state.inscriptions.length;
        const avg = state.projects.length ? Math.round(state.projects.reduce((a,p) => a + (p.progress||0), 0) / state.projects.length) : 0;
        if (recruteurAvgProgress) recruteurAvgProgress.innerText = `${avg}%`;

        listeOffres.innerHTML = "";
        filtered.forEach(p => {
            const estInscrit = state.inscriptions.includes(p.id);
            const btnEvalClass = "btnEvaluerLivrables text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold text-sm border border-emerald-200 dark:border-emerald-800 hover:border-emerald-600 rounded-xl px-4 py-2 transition-all cursor-pointer shrink-0";
            const statusColor = p.status === "En cours" ? "text-amber-600 dark:text-amber-400" : p.status === "Recrutement ouvert" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400";

            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover-card component-fade";
            card.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-medium px-2.5 py-0.5 rounded-md">${p.status}</span>
                            <span class="text-xs text-slate-400">${p.schools}</span>
                        </div>
                        <h3 class="font-bold text-slate-900 dark:text-white text-base mb-1">${p.title}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">${p.desc}</p>
                        <div class="flex gap-2 flex-wrap mb-3">${p.tags.map(t => `<span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg font-medium">${t}</span>`).join("")}</div>
                        <div class="flex items-center gap-3">
                            <div class="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full"><div class="bg-emerald-500 h-1.5 rounded-full transition-all" style="width:${p.progress||0}%"></div></div>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">${p.progress||0}%</span>
                            <span class="text-xs text-slate-400">${p.participantsCount + (estInscrit?1:0)}/${p.maxParticipants} équipiers</span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 shrink-0">
                        <button class="${btnEvalClass}" data-id="${p.id}">Évaluer les livrables →</button>
                        <button class="btn-supprimer-projet text-xs text-red-400 hover:text-red-600 border border-red-100 dark:border-red-900/50 hover:border-red-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all" data-id="${p.id}">🗑️ Supprimer</button>
                    </div>
                </div>`;
            listeOffres.appendChild(card);
        });

        if (filtered.length === 0) {
            listeOffres.innerHTML = `<div class="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-medium">Aucun projet trouvé.</div>`;
        }
    };

    // Filtres formateur
    const inputRechercheRecruteur = document.getElementById("inputRechercheRecruteur");
    const filtreStatutRecruteur   = document.getElementById("filtreStatutRecruteur");
    if (inputRechercheRecruteur) inputRechercheRecruteur.addEventListener("input", renderRecruteur);
    if (filtreStatutRecruteur)   filtreStatutRecruteur.addEventListener("change", renderRecruteur);

    // Suppression projet (formateur)
    document.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("btn-supprimer-projet")) {
            const id = parseInt(e.target.getAttribute("data-id"));
            const p  = state.projects.find(x => x.id === id);
            if (!p) return;
            if (confirm(`Supprimer le projet "${p.title}" ?`)) {
                state.projects = state.projects.filter(x => x.id !== id);
                state.inscriptions = state.inscriptions.filter(x => x !== id);
                saveState(); renderRecruteur();
                logJournal(`Projet "${p.title}" supprimé par ${currentUser.prenom}`);
            }
        }
    });

    // ==========================================
    // 11. VUE — PANNEAU ADMINISTRATEUR
    // ==========================================
    const renderAdmin = () => {
        // KPIs
        const el = (id) => document.getElementById(id);
        if (el("adminNbUsers"))        el("adminNbUsers").innerText        = state.users.length;
        if (el("adminNbProjets"))      el("adminNbProjets").innerText      = state.projects.length;
        if (el("adminNbInscriptions")) el("adminNbInscriptions").innerText = state.inscriptions.length;
        const avgP = state.projects.length ? Math.round(state.projects.reduce((a,p) => a+(p.progress||0), 0) / state.projects.length) : 0;
        if (el("adminAvgProgress"))    el("adminAvgProgress").innerText    = `${avgP}%`;
        if (el("adminUserCount"))      el("adminUserCount").innerText      = state.users.length;

        // Liste utilisateurs
        const adminListeUsers = document.getElementById("adminListeUsers");
        if (adminListeUsers) {
            const query = el("inputRechercheAdmin") ? el("inputRechercheAdmin").value.toLowerCase() : "";
            const filteredUsers = state.users.filter(u => `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(query));
            adminListeUsers.innerHTML = "";
            const roleColors = { etudiant: "#059669", recruteur: "#2563eb", admin: "#d97706" };
            const roleLabels = { etudiant: "🎓 Étudiant", recruteur: "💼 Formateur", admin: "⚙️ Admin" };
            filteredUsers.forEach(u => {
                const color = roleColors[u.role] || "#64748b";
                const row = document.createElement("div");
                row.className = "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group";
                row.innerHTML = `
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:${color}20;color:${color};">${u.prenom[0]}${u.nom[0]}</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">${u.prenom} ${u.nom}</p>
                        <p class="text-xs text-slate-400 truncate">${u.email}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background:${color}20;color:${color};">${roleLabels[u.role]||u.role}</span>
                        <p class="text-[11px] text-slate-400 mt-0.5">${u.ecole||"—"}</p>
                    </div>`;
                adminListeUsers.appendChild(row);
            });
        }

        // Liste projets admin
        const adminListeProjets = document.getElementById("adminListeProjets");
        if (adminListeProjets) {
            adminListeProjets.innerHTML = "";
            state.projects.forEach(p => {
                const inscrits = state.inscriptions.filter(id => id === p.id).length;
                const card = document.createElement("div");
                card.className = "flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700";
                card.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">${p.title}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <div class="flex-1 bg-slate-200 dark:bg-slate-700 h-1 rounded-full"><div class="bg-emerald-500 h-1 rounded-full" style="width:${p.progress||0}%"></div></div>
                            <span class="text-[11px] text-slate-400 shrink-0">${p.progress||0}%</span>
                        </div>
                    </div>
                    <div class="shrink-0 text-right">
                        <p class="text-xs text-slate-400">${p.status}</p>
                        <p class="text-[11px] text-slate-300 dark:text-slate-500">${p.participantsCount} étudiant(s)</p>
                    </div>`;
                adminListeProjets.appendChild(card);
            });
        }

        // Journal admin
        const adminJournal = document.getElementById("adminJournal");
        if (adminJournal) {
            if (state.journal.length === 0) {
                adminJournal.innerHTML = `<div class="text-center py-4 text-slate-400 italic">Aucune activité récente.</div>`;
            } else {
                adminJournal.innerHTML = "";
                state.journal.slice(0, 20).forEach(entry => {
                    const row = document.createElement("div");
                    row.className = "flex items-start gap-2 pb-2 border-b border-slate-100 dark:border-slate-800";
                    row.innerHTML = `<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div><div><p class="text-slate-700 dark:text-slate-300">${entry.msg}</p><span class="text-[10px] text-slate-400">${entry.time}</span></div>`;
                    adminJournal.appendChild(row);
                });
            }
        }
    };

    // Recherche dans la liste admin
    const inputRechercheAdmin = document.getElementById("inputRechercheAdmin");
    if (inputRechercheAdmin) inputRechercheAdmin.addEventListener("input", renderAdmin);

    // Boutons zone danger admin
    const btnResetProjets = document.getElementById("btnResetProjets");
    if (btnResetProjets) {
        btnResetProjets.addEventListener("click", () => {
            if (confirm("Réinitialiser TOUS les projets ? Cette action est irréversible.")) {
                state.projects = [...defaultProjects];
                state.inscriptions = [1];
                saveState(); renderAdmin();
                logJournal(`Base de projets réinitialisée par ${currentUser.prenom}`);
            }
        });
    }
    const btnResetInscriptions = document.getElementById("btnResetInscriptions");
    if (btnResetInscriptions) {
        btnResetInscriptions.addEventListener("click", () => {
            if (confirm("Réinitialiser toutes les inscriptions ?")) {
                state.inscriptions = [];
                saveState(); renderAdmin();
                logJournal(`Inscriptions réinitialisées par ${currentUser.prenom}`);
            }
        });
    }
    const btnExportDonnees = document.getElementById("btnExportDonnees");
    if (btnExportDonnees) {
        btnExportDonnees.addEventListener("click", () => {
            const data = { projets: state.projects, inscriptions: state.inscriptions, utilisateurs: state.users, journal: state.journal };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `campusconnect_export_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
        });
    }
    const btnViderJournal = document.getElementById("btnViderJournal");
    if (btnViderJournal) {
        btnViderJournal.addEventListener("click", () => {
            state.journal = [];
            saveState(); renderAdmin();
        });
    }

    // ==========================================
    // 12. MODALE FORMULAIRE PROJET (partagée)
    // ==========================================
    const modalFormulaire = document.getElementById("modalFormulaire");
    const formProjet      = document.getElementById("formProjet");

    const toggleModal = () => {
        if (modalFormulaire) modalFormulaire.classList.toggle("hidden");
    };

    // On attache les listeners sur TOUS les boutons qui ouvrent la modale
    // (btnOuvrirModal pour le recruteur, btnAdminNouveauProjet pour l'admin)
    // via délégation globale pour éviter les problèmes d'ordre d'initialisation
    document.addEventListener("click", (e) => {
        if (
            e.target &&
            (e.target.id === "btnOuvrirModal" ||
             e.target.id === "btnAdminNouveauProjet" ||
             e.target.closest("#btnOuvrirModal") ||
             e.target.closest("#btnAdminNouveauProjet"))
        ) {
            toggleModal();
        }
    });

    const btnFermerModal  = document.getElementById("btnFermerModal");
    const btnAnnulerModal = document.getElementById("btnAnnulerModal");
    if (btnFermerModal)  btnFermerModal.addEventListener("click", toggleModal);
    if (btnAnnulerModal) btnAnnulerModal.addEventListener("click", toggleModal);

    if (formProjet) {
        formProjet.addEventListener("submit", (e) => {
            e.preventDefault();
            const titleVal = document.getElementById("jobTitle").value;
            const descVal  = document.getElementById("jobDesc").value;
            const tagsRaw  = document.getElementById("jobTags").value || "Génie Logiciel";
            const tagsArr  = tagsRaw.split(",").map(t => t.trim()).filter(t => t);
            const newId    = state.projects.length ? Math.max(...state.projects.map(p => p.id)) + 1 : 1;
            const newProj  = { id: newId, title: titleVal, desc: descVal, tags: tagsArr, participantsCount: 1, maxParticipants: 4, schools: "IPNET • UL • ESGIS", status: "Recrutement ouvert", progress: 0, badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" };
            state.projects.push(newProj);
            saveState();
            renderProjects();
            renderRecruteur();
            if (!document.getElementById("sectionAdmin")?.classList.contains("hidden")) renderAdmin();
            logJournal(`Nouveau projet "${titleVal}" créé par ${currentUser.prenom}`);
            ajouterActu(`<div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div><div><p class="text-slate-700 dark:text-slate-300">Nouveau projet <span class="font-semibold text-emerald-700 dark:text-emerald-400">${titleVal}</span> lancé.</p><span class="text-slate-400 text-[10px]">À l'instant</span></div>`, true);
            formProjet.reset();
            toggleModal();
        });
    }

    // ==========================================
    // 13. MODALE ÉVALUATION PROJET (formateur/admin)
    // ==========================================
    const ouvrirEvaluationProjet = (projectId) => {
        const p = state.projects.find(x => x.id === projectId);
        if (!p) return;
        const modale        = document.getElementById("modaleEvaluation");
        const evalTitle     = document.getElementById("evalTitle");
        const evalProjectName = document.getElementById("evalProjectName");
        const evalContent   = modale?.querySelector(".space-y-4");
        if (!modale || !evalContent) return;
        if (evalTitle)       evalTitle.innerText = "Évaluation du Projet";
        if (evalProjectName) evalProjectName.innerText = p.title;
        evalContent.innerHTML = `
            <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div class="text-xs"><label class="block font-bold uppercase text-slate-400 mb-1">Avancement actuel</label>
                <span class="text-emerald-600 font-extrabold text-sm" id="evalProgressLabel">${p.progress||0}%</span></div>
                <div><label class="block text-xs font-bold uppercase text-slate-400 mb-2">Ajuster l'avancement</label>
                <input type="range" id="evalProgressSlider" min="0" max="100" value="${p.progress||0}" class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"></div>
                <div><label class="block text-xs font-bold uppercase text-slate-400 mb-1">Commentaires</label>
                <textarea id="evalComment" rows="2" placeholder="Remarques pour l'équipe..." class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea></div>
            </div>`;
        const slider = document.getElementById("evalProgressSlider");
        const label  = document.getElementById("evalProgressLabel");
        if (slider && label) slider.addEventListener("input", (ev) => label.innerText = `${ev.target.value}%`);
        const footer = modale.querySelector(".flex.justify-end");
        if (footer) footer.innerHTML = `
            <button id="btnAnnulerEval" class="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer mr-2">Annuler</button>
            <button id="btnEnregistrerEval" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md">Enregistrer</button>`;
        modale.classList.remove("hidden");
        document.getElementById("btnAnnulerEval")?.addEventListener("click", () => modale.classList.add("hidden"));
        document.getElementById("btnEnregistrerEval")?.addEventListener("click", () => {
            const newProg = parseInt(slider.value);
            const feedbk  = document.getElementById("evalComment").value.trim() || "Aucun commentaire.";
            p.progress = newProg;
            saveState(); renderProjects(); renderRecruteur();
            if (!document.getElementById("sectionDashboard")?.classList.contains("hidden")) renderDashboard();
            if (!document.getElementById("sectionAdmin")?.classList.contains("hidden")) renderAdmin();
            ajouterActu(`<div class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div><div><p class="text-slate-700 dark:text-slate-300 font-medium">${p.title} évalué à <span class="font-bold text-emerald-600">${newProg}%</span>.<br><span class="italic text-[11px] text-slate-400">"${feedbk}"</span></p><span class="text-[10px] text-slate-400">À l'instant</span></div>`, true);
            logJournal(`"${p.title}" évalué à ${newProg}% par ${currentUser.prenom}`);
            modale.classList.add("hidden");
        });
    };

    const btnFermerEval    = document.getElementById("btnFermerEval");
    const btnValiderProjet = document.getElementById("btnValiderProjet");
    const modaleEval       = document.getElementById("modaleEvaluation");
    if (btnFermerEval)    btnFermerEval.addEventListener("click",    () => modaleEval?.classList.add("hidden"));
    if (btnValiderProjet) btnValiderProjet.addEventListener("click", () => modaleEval?.classList.add("hidden"));

    // ==========================================
    // 14. AUDIT IA (pour étudiant)
    // ==========================================
    const btnAnalyseIA = document.getElementById("btnAnalyseIA");
    if (btnAnalyseIA && modaleEval) {
        let auditEnCours = false;
        const evalContent = modaleEval.querySelector(".space-y-4");
        const baseHTML    = evalContent?.innerHTML || "";
        btnAnalyseIA.addEventListener("click", () => {
            if (auditEnCours) return;
            sectionProfil?.classList.add("hidden");
            const evalTitle = document.getElementById("evalTitle");
            const evalPName = document.getElementById("evalProjectName");
            if (evalTitle) evalTitle.innerText = "Audit de compétences IA";
            if (evalPName) evalPName.innerText = "Analyse en cours...";
            const footer = modaleEval.querySelector(".flex.justify-end");
            if (footer) {
                footer.innerHTML = `<button id="btnCloseAudit" class="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md">Fermer l'audit</button>`;
                document.getElementById("btnCloseAudit")?.addEventListener("click", () => modaleEval.classList.add("hidden"));
            }
            modaleEval.classList.remove("hidden");
            auditEnCours = true;
            evalContent.innerHTML = `<div class="flex flex-col items-center py-10 animate-pulse"><div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-slate-600 dark:text-slate-400 font-bold text-sm">SolveTeck Engine analyse votre profil...</p></div>`;
            setTimeout(() => {
                evalContent.innerHTML = baseHTML;
                auditEnCours = false;
                if (evalPName) evalPName.innerText = "Analyse complète • Recommandations IA";
            }, 1800);
        });
    }

    // ==========================================
    // 15. GÉNÉRATEUR CV + PDF (étudiant)
    // ==========================================
    let cvAnimInterval = null;

    // ── Ouvrir / Fermer la modale (style.display = fiable, pas classList) ──
    const ouvrirModalCV = () => {
        const overlay = document.getElementById("modalCVOverlay");
        const modal   = document.getElementById("modalCV");
        if (overlay) overlay.style.display = "block";
        if (modal)   modal.style.display   = "flex";
    };

    const fermerModalCV = () => {
        // 1. Arrêter l'animation si elle tourne encore
        if (cvAnimInterval) { clearInterval(cvAnimInterval); cvAnimInterval = null; }

        // 2. Cacher la modale et l'overlay
        const overlay = document.getElementById("modalCVOverlay");
        const modal   = document.getElementById("modalCV");
        if (overlay) overlay.style.display = "none";
        if (modal)   modal.style.display   = "none";

        // 3. Remettre dans l'état initial pour la prochaine ouverture
        const cvLoadingState = document.getElementById("cvLoadingState");
        const cvContent      = document.getElementById("cvContent");
        if (cvLoadingState) cvLoadingState.style.display = "flex";
        if (cvContent)      cvContent.style.display      = "none";
    };

    // ── Bouton "Générer mon CV" ──
    const btnGenererCV = document.getElementById("btnGenererCV");
    if (btnGenererCV) {
        btnGenererCV.addEventListener("click", () => {
            // Remplir les infos utilisateur
            const cvNom   = document.getElementById("cvNom");
            const cvEcole = document.getElementById("cvEcole");
            if (cvNom)   cvNom.textContent  = `${currentUser.prenom || ""} ${currentUser.nom || ""}`.trim();
            if (cvEcole) cvEcole.textContent = `Licence 1 (${currentUser.ecole || "IPNET"})`;

            // Remettre l'état de chargement visible
            const cvLoadingState = document.getElementById("cvLoadingState");
            const cvLoadingText  = document.getElementById("cvLoadingText");
            const cvContent      = document.getElementById("cvContent");
            if (cvLoadingState) cvLoadingState.style.display = "flex";
            if (cvContent)      cvContent.style.display      = "none";

            // Ouvrir la modale
            ouvrirModalCV();

            // Lancer l'animation de chargement
            const etapes = [
                `🤖 Lecture du profil de ${currentUser.prenom}...`,
                "🎯 Extraction des compétences clés...",
                "🚀 Agrégation des projets réalisés...",
                "📄 Compilation du Portfolio IA..."
            ];
            let i = 0;
            if (cvLoadingText) cvLoadingText.textContent = etapes[0];

            cvAnimInterval = setInterval(() => {
                i++;
                if (i < etapes.length) {
                    if (cvLoadingText) cvLoadingText.textContent = etapes[i];
                } else {
                    clearInterval(cvAnimInterval);
                    cvAnimInterval = null;
                    // Afficher le contenu final
                    if (cvLoadingState) cvLoadingState.style.display = "none";
                    if (cvContent)      cvContent.style.display      = "block";
                }
            }, 700);
        });
    }

    // ── Bouton croix — attaché directement par ID ──
    const btnFermerCV = document.getElementById("btnFermerModalCV");
    if (btnFermerCV) {
        btnFermerCV.onclick = fermerModalCV;
    }

    // ── Clic sur l'overlay (fond sombre) ──
    const modalCVOverlay = document.getElementById("modalCVOverlay");
    if (modalCVOverlay) {
        modalCVOverlay.onclick = fermerModalCV;
    }

    // ── Bouton "Télécharger en PDF" ──
    const btnTelechargerPDF = document.getElementById("btnTelechargerPDF");
    if (btnTelechargerPDF) {
        btnTelechargerPDF.onclick = () => {
            const cvContent = document.getElementById("cvContent");
            // Vérifier que le contenu est visible (animation terminée)
            if (!cvContent || cvContent.style.display === "none" || cvContent.style.display === "") {
                alert("⏳ Attendez la fin de la compilation IA avant de télécharger.");
                return;
            }
            lancerTelechargementPDF();
        };
    }

    function lancerTelechargementPDF(tentative = 0) {
        const btnPDF    = document.getElementById("btnTelechargerPDF");
        const cvContent = document.getElementById("cvContent");
        const cvNom     = document.getElementById("cvNom");

        if (!cvContent) return;

        // Feedback visuel
        if (btnPDF) { btnPDF.textContent = "⏳ Préparation..."; btnPDF.disabled = true; }

        // Récupérer le contenu HTML du CV avec les styles inline déjà présents
        const nomFichier = `CV_${currentUser.prenom || "Etudiant"}_${currentUser.nom || ""}_CampusConnect`;

        // Construire une page HTML autonome propre pour l'impression
        const htmlPage = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${nomFichier}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #ffffff;
    color: #0f172a;
    padding: 32px 40px;
    font-size: 13px;
    line-height: 1.6;
  }

  /* En-tête du CV */
  .cv-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 3px solid #059669;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .cv-nom   { font-size: 22px; font-weight: 800; color: #0f172a; }
  .cv-ecole { font-size: 12px; font-weight: 700; color: #059669; }

  /* Sections */
  .cv-section-title {
    font-size: 10px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 16px 0 8px;
  }

  /* Tags compétences */
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    border: 1px solid #d1fae5;
    background: #f0fdf4;
    color: #065f46;
  }
  .tag.primary { background: #059669; color: #ffffff; border-color: #059669; }
  .tag.blue    { background: #eff6ff; color: #1e40af; border-color: #dbeafe; }

  /* Liste projets */
  .projets { padding-left: 18px; }
  .projets li { margin-bottom: 5px; color: #334155; }
  .projets .pct { color: #059669; font-weight: 600; }

  /* Pied de page */
  .cv-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    margin-top: 20px;
    padding-top: 10px;
    font-size: 10px;
    color: #94a3b8;
  }
  .cv-footer .annee { color: #059669; font-weight: 700; }

  /* Score IA */
  .score-box {
    background: #f0fdf4;
    border: 1px solid #d1fae5;
    border-radius: 8px;
    padding: 10px 16px;
    margin-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .score-label { font-size: 11px; color: #64748b; }
  .score-val   { font-size: 20px; font-weight: 800; color: #059669; }

  @media print {
    body { padding: 20px 28px; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head>
<body>

<div class="cv-header">
  <span class="cv-nom">${currentUser.prenom || ""} ${currentUser.nom || ""}</span>
  <span class="cv-ecole">Licence 1 &mdash; ${currentUser.ecole || "IPNET"}</span>
</div>

<div class="cv-section-title">🎯 Compétences clés</div>
<div class="tags">
  <span class="tag">Python</span>
  <span class="tag primary">Algorithmique</span>
  <span class="tag blue">Travail d'équipe</span>
  <span class="tag">Génie Logiciel</span>
</div>

<div class="cv-section-title">🚀 Projets réalisés</div>
<ul class="projets">
${state.projects
    .filter(p => state.inscriptions.includes(p.id))
    .map(p => `  <li>${p.title} <span class="pct">(${p.progress}% accompli)</span></li>`)
    .join("\n") || "  <li style='color:#94a3b8;font-style:italic;'>Aucun projet rejoint pour le moment.</li>"}
</ul>

<div class="score-box">
  <span class="score-label">Score Global IA · SolveTeck Engine</span>
  <span class="score-val">${currentUser.scoreIA || 82} <span style="font-size:13px;color:#64748b;">/100</span></span>
</div>

<div class="cv-footer">
  <span>Généré par CampusConnect.tg &bull; SolveTeck Engine IA</span>
  <span class="annee">2025</span>
</div>

<script>
  // Lancer l'impression automatiquement dès que la page est prête
  window.onload = function() {
    // Petit délai pour s'assurer que le rendu est complet
    setTimeout(function() {
      window.print();
      // Fermer la fenêtre après impression (optionnel)
      setTimeout(function() { window.close(); }, 1000);
    }, 300);
  };
<\/script>
</body>
</html>`;

        // Ouvrir dans une nouvelle fenêtre et déclencher l'impression
        const win = window.open("", "_blank", "width=800,height=900,scrollbars=yes");
        if (!win) {
            // Si le popup est bloqué, proposer une alternative
            if (btnPDF) {
                btnPDF.textContent = "⚠️ Popup bloqué — voir instructions";
                btnPDF.disabled = false;
                setTimeout(() => { btnPDF.textContent = "Télécharger en PDF"; }, 4000);
            }
            alert(
                "⚠️ Votre navigateur a bloqué la fenêtre d'impression.\n\n" +
                "Pour débloquer :\n" +
                "1. Cliquez sur l'icône 🚫 dans la barre d'adresse\n" +
                "2. Sélectionnez 'Toujours autoriser les popups'\n" +
                "3. Recliquez sur le bouton PDF"
            );
            return;
        }

        win.document.open();
        win.document.write(htmlPage);
        win.document.close();

        // Retour visuel bouton
        if (btnPDF) {
            btnPDF.textContent = "✅ Fenêtre d'impression ouverte !";
            btnPDF.style.background = "#047857";
            btnPDF.disabled = false;
            setTimeout(() => {
                btnPDF.textContent = "Télécharger en PDF";
                btnPDF.style.background = "#059669";
            }, 4000);
        }
    }

    // ==========================================
    // 16. CHATBOT
    // ==========================================
    const btnChatbotToggle = document.getElementById("btnChatbotToggle");
    const btnFermerChatbot = document.getElementById("btnFermerChatbot");
    const chatbotContainer = document.getElementById("chatbotContainer");
    const btnEnvoyerChat   = document.getElementById("btnEnvoyerChat");
    const chatInput        = document.getElementById("chatInput");
    const chatBoxMessages  = document.getElementById("chatBoxMessages");

    if (btnChatbotToggle && chatbotContainer) {
        btnChatbotToggle.addEventListener("click", () => chatbotContainer.classList.toggle("hidden"));
        btnFermerChatbot?.addEventListener("click", () => chatbotContainer.classList.add("hidden"));
    }

    const repondre = (txt) => {
        const msg = txt.toLowerCase();
        let rep = "";
        if (msg.includes("python")) {
            const pp = state.projects.filter(p => p.tags.some(t => /python/i.test(t)));
            rep = pp.length > 0 ? `🤖 J'ai trouvé ${pp.length} projet(s) Python :<br>` + pp.map(p => `• <b>${p.title}</b>`).join("<br>") : "🤖 Aucun projet Python actif. Proposez-en un !";
        } else if (msg.includes("cv") || msg.includes("portfolio")) {
            rep = "🤖 Cliquez sur le bouton <b>'Générer mon CV Portfolio via IA'</b> pour créer votre CV automatiquement depuis vos projets !";
        } else if (msg.includes("rejoindre") || msg.includes("participer")) {
            rep = "🤖 Sur chaque carte de projet, cliquez sur <b>'Rejoindre l'équipe →'</b> pour intégrer l'équipe instantanément !";
        } else if (msg.includes("dashboard") || msg.includes("tableau")) {
            rep = "🤖 Allez dans <b>'📊 Mon Espace'</b> pour voir votre tableau de bord, vos compétences et vos projets actifs.";
        } else {
            rep = "🤖 Notre moteur SolveTeck vous recommande de rejoindre des projets en Python ou en Génie Logiciel pour booster votre score IA !";
        }
        const div = document.createElement("div");
        div.className = "bg-white/10 p-2.5 rounded-lg rounded-tl-none max-w-[85%] leading-relaxed";
        div.innerHTML = rep;
        chatBoxMessages?.appendChild(div);
        if (chatBoxMessages) chatBoxMessages.scrollTop = chatBoxMessages.scrollHeight;
    };

    const envoyerMsg = () => {
        const txt = chatInput?.value.trim();
        if (!txt) return;
        const u = document.createElement("div");
        u.className = "bg-emerald-600 text-white p-2.5 rounded-lg rounded-tr-none max-w-[85%] self-end leading-relaxed";
        u.innerText = txt;
        chatBoxMessages?.appendChild(u);
        if (chatInput) chatInput.value = "";
        if (chatBoxMessages) chatBoxMessages.scrollTop = chatBoxMessages.scrollHeight;
        setTimeout(() => repondre(txt), 800);
    };
    if (btnEnvoyerChat) btnEnvoyerChat.addEventListener("click", envoyerMsg);
    if (chatInput) chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") envoyerMsg(); });

    // ==========================================
    // 17. CHARGEMENT INITIAL
    // ==========================================
    renderProjects();
});
