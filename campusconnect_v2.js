const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, PageBreak
} = require('docx');
const fs = require('fs');

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  emerald:     "059669", emeraldDk:  "065F46", emeraldLt: "D1FAE5",
  blue:        "1D4ED8", blueDk:     "1E3A8A", blueLt:    "DBEAFE",
  purple:      "7C3AED", purpleDk:   "4C1D95", purpleLt:  "EDE9FE",
  amber:       "D97706", amberDk:    "92400E", amberLt:   "FEF3C7",
  red:         "DC2626", redLt:      "FEE2E2",
  teal:        "0D9488", tealLt:     "CCFBF1",
  pink:        "DB2777", pinkLt:     "FCE7F3",
  slate900:    "0F172A", slate700:   "334155", slate500:  "64748B",
  slate300:    "CBD5E1", slate200:   "E2E8F0", slate100:  "F1F5F9",
  white:       "FFFFFF",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: nb, bottom: nb, left: nb, right: nb };
const b  = (c="CBD5E1") => ({ style: BorderStyle.SINGLE, size: 4, color: c });
const brd = (c="CBD5E1") => ({ top: b(c), bottom: b(c), left: b(c), right: b(c) });

const sp = (pts=6) => new Paragraph({ children: [new TextRun("")], spacing: { after: pts*20 } });
const hr = () => new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.emerald, space: 1 } }, spacing: { before: 100, after: 100 } });

const cell = (children, opts={}) => new TableCell({
  borders: opts.noBorder ? noBorders : brd(opts.bc || "CBD5E1"),
  width: { size: opts.w || 4680, type: WidthType.DXA },
  shading: { fill: opts.fill || C.white, type: ShadingType.CLEAR },
  margins: { top: opts.mt||100, bottom: opts.mb||100, left: opts.ml||160, right: opts.mr||160 },
  children: Array.isArray(children) ? children : [children],
  verticalAlign: opts.va || "top",
});

const hcell = (text, fill=C.slate900, w=4680, color=C.white) => cell(
  new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color })] }),
  { fill, w, bc: fill }
);

const t = (text, opts={}) => new TextRun({ text, bold: opts.b, italic: opts.i, size: opts.sz||22, color: opts.c||C.slate700, font: opts.font, underline: opts.u ? {} : undefined });

const p = (children, opts={}) => new Paragraph({
  children: Array.isArray(children) ? children : [typeof children === 'string' ? t(children) : children],
  alignment: opts.align,
  spacing: { before: (opts.before||0)*20, after: (opts.after||4)*20 },
  heading: opts.h,
  numbering: opts.num,
  pageBreakBefore: opts.pb,
});

const bullet = (text, sub=false) => p(t(text, { sz: 21 }), {
  num: { reference: sub?"subbullets":"bullets", level: 0 }, after: 3
});

const num = (text) => p(t(text, { sz: 21 }), { num: { reference: "numbers", level: 0 }, after: 3 });

// ── Banner section title ──────────────────────────────────────────────────────
const banner = (emoji, title, sub, fill=C.emerald, w=9506) => new Table({
  width: { size: w, type: WidthType.DXA }, columnWidths: [w],
  rows: [new TableRow({ children: [new TableCell({
    borders: noBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 180, bottom: 160, left: 280, right: 280 },
    children: [
      new Paragraph({ children: [new TextRun({ text: `${emoji}  ${title}`, bold: true, size: 34, color: C.white, font: "Arial" })] }),
      ...(sub ? [new Paragraph({ children: [new TextRun({ text: sub, size: 20, color: "D1FAE5" })] })] : [])
    ]
  })]})]
});

// ── Info box ──────────────────────────────────────────────────────────────────
const infoBox = (text, fill=C.blueLt, bc=C.blue, icon="i") => new Table({
  width: { size: 9506, type: WidthType.DXA }, columnWidths: [480, 9026],
  rows: [new TableRow({ children: [
    new TableCell({
      borders: { top: b(bc), bottom: b(bc), left: b(bc), right: nb },
      width: { size: 480, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 120, right: 0 },
      children: [new Paragraph({ children: [new TextRun({ text: icon, bold: true, size: 24, color: bc })] })]
    }),
    new TableCell({
      borders: { top: b(bc), bottom: b(bc), right: b(bc), left: nb },
      width: { size: 9026, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 100, right: 160 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 20, color: C.slate700 })] })]
    })
  ]})]
});

// ── Code block ────────────────────────────────────────────────────────────────
const code = (lines) => new Table({
  width: { size: 9506, type: WidthType.DXA }, columnWidths: [9506],
  rows: [
    new TableRow({ children: [new TableCell({
      borders: noBorders,
      width: { size: 9506, type: WidthType.DXA },
      shading: { fill: "1E293B", type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 0, left: 200, right: 200 },
      children: [new Paragraph({ children: [new TextRun(" ")] })]
    })]}),
    ...lines.map(line => new TableRow({ children: [new TableCell({
      borders: noBorders,
      width: { size: 9506, type: WidthType.DXA },
      shading: { fill: "1E293B", type: ShadingType.CLEAR },
      margins: { top: 0, bottom: 0, left: 200, right: 200 },
      children: [new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: line||" ", font: "Courier New", size: 18, color: "86EFAC" })] })]
    })} )),
    new TableRow({ children: [new TableCell({
      borders: noBorders,
      width: { size: 9506, type: WidthType.DXA },
      shading: { fill: "1E293B", type: ShadingType.CLEAR },
      margins: { top: 0, bottom: 80, left: 200, right: 200 },
      children: [new Paragraph({ children: [new TextRun(" ")] })]
    })]})
  ]
});

// ── KPI card row ──────────────────────────────────────────────────────────────
const kpiRow = (items) => new Table({
  width: { size: 9506, type: WidthType.DXA },
  columnWidths: items.map(() => Math.floor(9506/items.length)),
  rows: [new TableRow({ children: items.map(({val,label,fill,color}) => new TableCell({
    borders: noBorders,
    width: { size: Math.floor(9506/items.length), type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 180, bottom: 180, left: 180, right: 180 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val, bold: true, size: 52, color: color||C.white, font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, size: 18, color: "D1FAE5" })] }),
    ]
  }))})]
});

// ─────────────────────────────────────────────────────────────────────────────
//  DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level:0, format: LevelFormat.BULLET, text:"•", alignment: AlignmentType.LEFT,
          style:{paragraph:{indent:{left:640,hanging:320}}}}]},
      { reference: "subbullets", levels: [{ level:0, format: LevelFormat.BULLET, text:"◦", alignment: AlignmentType.LEFT,
          style:{paragraph:{indent:{left:1060,hanging:320}}}}]},
      { reference: "numbers", levels: [{ level:0, format: LevelFormat.DECIMAL, text:"%1.", alignment: AlignmentType.LEFT,
          style:{paragraph:{indent:{left:640,hanging:320}}}}]},
      { reference: "steps", levels: [{ level:0, format: LevelFormat.DECIMAL, text:"%1.", alignment: AlignmentType.LEFT,
          style:{paragraph:{indent:{left:640,hanging:320}}}}]},
    ]
  },
  styles: {
    default: { document: { run: { font:"Arial", size:22, color: C.slate700 } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{size:40,bold:true,font:"Arial",color:C.slate900}, paragraph:{spacing:{before:400,after:200},outlineLevel:0}},
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{size:30,bold:true,font:"Arial",color:C.slate900}, paragraph:{spacing:{before:280,after:160},outlineLevel:1}},
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{size:24,bold:true,font:"Arial",color:C.emeraldDk}, paragraph:{spacing:{before:200,after:100},outlineLevel:2}},
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 }
      }
    },
    headers: { default: new Header({ children: [
      new Table({ width:{size:9706,type:WidthType.DXA}, columnWidths:[4853,4853],
        rows:[new TableRow({children:[
          new TableCell({ borders:{top:nb,bottom:b(C.emerald),left:nb,right:nb}, width:{size:4853,type:WidthType.DXA}, margins:{top:60,bottom:60,left:0,right:0},
            children:[new Paragraph({children:[new TextRun({text:"CampusConnect.tg — v2.0",bold:true,size:20,color:C.emerald})]})] }),
          new TableCell({ borders:{top:nb,bottom:b(C.emerald),left:nb,right:nb}, width:{size:4853,type:WidthType.DXA}, margins:{top:60,bottom:60,left:0,right:0},
            children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Plan Stratégique de Transformation — 2025",size:18,color:C.slate500})]})] }),
        ]})]})
    ]})},
    footers: { default: new Footer({ children: [
      new Table({ width:{size:9706,type:WidthType.DXA}, columnWidths:[6000,3706],
        rows:[new TableRow({children:[
          new TableCell({ borders:{top:b(C.slate200),bottom:nb,left:nb,right:nb}, width:{size:6000,type:WidthType.DXA}, margins:{top:60,bottom:0,left:0,right:0},
            children:[new Paragraph({children:[new TextRun({text:"Plateforme Collaborative d'Insertion Professionnelle — IPNET · ESGIS · UL · Togo",size:16,color:C.slate500})]})] }),
          new TableCell({ borders:{top:b(C.slate200),bottom:nb,left:nb,right:nb}, width:{size:3706,type:WidthType.DXA}, margins:{top:60,bottom:0,left:0,right:0},
            children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[
              new TextRun({text:"Page ",size:16,color:C.slate500}),
              new TextRun({children:[PageNumber.CURRENT],size:16,color:C.slate500}),
              new TextRun({text:" / ",size:16,color:C.slate500}),
              new TextRun({children:[PageNumber.TOTAL_PAGES],size:16,color:C.slate500}),
            ]})] }),
        ]})]})
    ]})},

    children: [

// ══════════════════════════════════════════════════════════════════
//  PAGE DE GARDE
// ══════════════════════════════════════════════════════════════════
new Table({ width:{size:9706,type:WidthType.DXA}, columnWidths:[9706],
  rows:[new TableRow({children:[new TableCell({
    borders:noBorders, width:{size:9706,type:WidthType.DXA},
    shading:{fill:"0F172A",type:ShadingType.CLEAR},
    margins:{top:600,bottom:500,left:480,right:480},
    children:[
      new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"C",bold:true,size:140,color:C.emerald,font:"Arial"})]}),
      sp(4),
      new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"CampusConnect.tg",bold:true,size:60,color:C.white,font:"Arial"})]}),
      new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Plateforme v2.0 — Plan Stratégique de Transformation",size:26,color:"94A3B8"})]}),
      sp(8),
      new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Intelligence Artificielle · Collaboration · Insertion Professionnelle",size:22,color:C.emerald})]}),
      sp(6),
      new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:"Document présenté devant jury universitaire, investisseurs et recruteurs",size:19,color:"64748B",italic:true})]}),
    ]
  })]})]
}),
sp(8),
new Table({ width:{size:9706,type:WidthType.DXA}, columnWidths:[2426,2427,2426,2427],
  rows:[new TableRow({children:[
    ...[
      {k:"Version",v:"2.0.0"},
      {k:"Année",v:"2025"},
      {k:"Statut",v:"Roadmap Active"},
      {k:"Équipes",v:"IPNET · ESGIS · UL"},
    ].map(({k,v})=>new TableCell({
      borders:brd(C.emeraldLt), width:{size:2426,type:WidthType.DXA},
      shading:{fill:C.emeraldLt,type:ShadingType.CLEAR},
      margins:{top:140,bottom:140,left:160,right:160},
      children:[
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:k,size:17,color:C.slate500,bold:true})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:v,size:22,color:C.emeraldDk,bold:true})]}),
      ]
    }))
  ]})]
}),
sp(12),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  RÉSUMÉ EXÉCUTIF
// ══════════════════════════════════════════════════════════════════
banner("📋","RÉSUMÉ EXÉCUTIF","Vision stratégique et synthèse du plan de transformation",C.slate900),
sp(6),
p([t("CampusConnect.tg v2.0",{b:true,sz:24,c:C.slate900}),t(" est la transformation d'une plateforme de collaboration étudiante en un ",{sz:22}),t("écosystème intelligent d'insertion professionnelle",{b:true,sz:22,c:C.emerald}),t(" intégrant l'Intelligence Artificielle, la messagerie temps réel et un système de scoring avancé. Ce document constitue le plan complet de développement destiné au jury universitaire, aux investisseurs et aux recruteurs.",{sz:22})]),
sp(4),
kpiRow([
  {val:"9",label:"Modules IA",fill:C.emerald},
  {val:"8",label:"Axes d'amélioration",fill:C.blue},
  {val:"3",label:"Rôles utilisateurs",fill:C.purple},
  {val:"4",label:"Phases de dev.",fill:C.amber},
]),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 1 — ANALYSE DU PROJET ACTUEL
// ══════════════════════════════════════════════════════════════════
banner("1","ANALYSE DU PROJET ACTUEL","Forces, faiblesses, opportunités et menaces (SWOT)",C.emerald),
sp(6),
p("CampusConnect.tg v1.0 est une application web développée en HTML5/CSS3/JavaScript vanilla avec un backend Node.js/Express et une base de données MySQL. Elle est actuellement fonctionnelle avec un système de rôles (étudiant, formateur, administrateur), des projets collaboratifs inter-écoles et une page de connexion sécurisée par JWT.",{after:6}),

p("1.1  Architecture actuelle",{h:HeadingLevel.HEADING_2}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[2000,3853,3853],
  rows:[
    new TableRow({children:[hcell("Couche",C.slate900,2000),hcell("Technologies",C.slate900,3853),hcell("Fichiers",C.slate900,3853)]}),
    ...[
      ["Présentation","HTML5, Tailwind CSS (CDN), CSS3 custom","index.html, login.html, style.css"],
      ["Logique client","JavaScript vanilla (ES6+)","script.js (1000+ lignes), api.js"],
      ["Serveur","Node.js 22, Express 4, CORS, dotenv","server.js"],
      ["Authentification","JWT (jsonwebtoken), bcrypt (10 rounds)","server.js — /api/auth/*"],
      ["Base de données","MySQL 8, mysql2/promise, pool de connexions","database.sql, seed.js"],
      ["Stockage session","localStorage (frontend)","login.html — campusconnect_session"],
    ].map(([a,b_,c],i)=>new TableRow({children:[
      cell(p(t(a,{b:true,sz:19})),{fill:i%2?"F8FAFC":C.white,w:2000}),
      cell(p(t(b_,{sz:19})),{fill:i%2?"F8FAFC":C.white,w:3853}),
      cell(p(t(c,{sz:18,font:"Courier New",c:C.purple})),{fill:i%2?"F8FAFC":C.white,w:3853}),
    ]}))
  ]
}),
sp(8),

p("1.2  Analyse SWOT",{h:HeadingLevel.HEADING_2}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[4853,4853],
  rows:[
    new TableRow({children:[hcell("FORCES (Strengths)",C.emerald,4853),hcell("FAIBLESSES (Weaknesses)",C.red,4853)]}),
    new TableRow({children:[
      cell([
        p(t("Architecture modulaire claire avec séparation des rôles",{sz:20}),{after:3}),
        p(t("Système JWT robuste avec bcrypt 10 rounds",{sz:20}),{after:3}),
        p(t("Interface moderne (dark mode, animations CSS)",{sz:20}),{after:3}),
        p(t("Base MySQL structurée avec FK et contraintes",{sz:20}),{after:3}),
        p(t("Seed script avec données réelles togolaises",{sz:20}),{after:3}),
      ],{fill:"F0FDF4",w:4853,bc:C.emerald}),
      cell([
        p(t("Pas de chatbot IA réel (réponses codées en dur)",{sz:20}),{after:3}),
        p(t("Pas de messagerie temps réel (Socket.io absent)",{sz:20}),{after:3}),
        p(t("Score IA non calculé dynamiquement",{sz:20}),{after:3}),
        p(t("Pas de gestion documentaire (upload fichiers)",{sz:20}),{after:3}),
        p(t("Pas de tableaux de bord analytiques",{sz:20}),{after:3}),
      ],{fill:"FEF2F2",w:4853,bc:C.red}),
    ]}),
    new TableRow({children:[hcell("OPPORTUNITÉS (Opportunities)",C.blue,4853),hcell("MENACES (Threats)",C.amber,4853)]}),
    new TableRow({children:[
      cell([
        p(t("Écosystème numérique togolais en expansion rapide",{sz:20}),{after:3}),
        p(t("Demande forte pour l'insertion professionnelle locale",{sz:20}),{after:3}),
        p(t("LLM API (Anthropic Claude) accessibles et peu coûteuses",{sz:20}),{after:3}),
        p(t("Marché hackathon / projets inter-écoles sous-exploité",{sz:20}),{after:3}),
      ],{fill:"EFF6FF",w:4853,bc:C.blue}),
      cell([
        p(t("Connectivité internet variable en zones rurales togolaises",{sz:20}),{after:3}),
        p(t("Concurrence de plateformes internationales (LinkedIn)",{sz:20}),{after:3}),
        p(t("Coût des API LLM en production à grande échelle",{sz:20}),{after:3}),
        p(t("Sécurité des données personnelles étudiantes",{sz:20}),{after:3}),
      ],{fill:"FFFBEB",w:4853,bc:C.amber}),
    ]}),
  ]
}),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 2 — AMÉLIORATIONS PRIORITAIRES
// ══════════════════════════════════════════════════════════════════
banner("2","AMÉLIORATIONS PRIORITAIRES","Classées par impact et faisabilité",C.blue),
sp(6),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[400,2700,2200,1200,1200,2006],
  rows:[
    new TableRow({children:[
      hcell("#",C.slate900,400),
      hcell("Amélioration",C.slate900,2700),
      hcell("Impact",C.slate900,2200),
      hcell("Effort",C.slate900,1200),
      hcell("Priorité",C.slate900,1200),
      hcell("Phase",C.slate900,2006),
    ]}),
    ...[
      ["1","CampusBot IA (LLM)","Engagement utilisateur +60%","Moyen","CRITIQUE","Phase 1",C.red],
      ["2","Scoring dynamique","Crédibilité plateforme","Faible","HAUTE","Phase 1",C.red],
      ["3","Générateur CV IA","Valeur ajoutée directe","Moyen","HAUTE","Phase 1",C.red],
      ["4","Messagerie temps réel","Rétention utilisateur","Élevé","HAUTE","Phase 2",C.amber],
      ["5","Tableau de bord analytics","Décision encadreurs","Moyen","MOYENNE","Phase 2",C.amber],
      ["6","Recommandation intelligente","Personnalisation","Élevé","MOYENNE","Phase 2",C.amber],
      ["7","Gestion documentaire","Livraisons projets","Moyen","NORMALE","Phase 3",C.blue],
      ["8","Sécurité renforcée","Conformité RGPD","Faible","HAUTE","Phase 1",C.red],
      ["9","Architecture mobile-ready","Évolutivité","Faible","NORMALE","Phase 4",C.purple],
    ].map(([n,am,imp,ef,pri,ph,pc],i)=>new TableRow({children:[
      cell(p(t(n,{b:true,sz:19,c:C.white})),{fill:pc,w:400,bc:pc}),
      cell(p(t(am,{b:true,sz:19})),{fill:i%2?"F8FAFC":C.white,w:2700}),
      cell(p(t(imp,{sz:18,i:true})),{fill:i%2?"F8FAFC":C.white,w:2200}),
      cell(p(t(ef,{sz:18})),{fill:i%2?"F8FAFC":C.white,w:1200}),
      cell(p(t(pri,{b:true,sz:17,c:pc})),{fill:i%2?"F8FAFC":C.white,w:1200}),
      cell(p(t(ph,{sz:18,c:C.slate500})),{fill:i%2?"F8FAFC":C.white,w:2006}),
    ]}))
  ]
}),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 3 — NOUVELLE ARCHITECTURE
// ══════════════════════════════════════════════════════════════════
banner("3","NOUVELLE ARCHITECTURE PROPOSÉE","Architecture 3-tiers évolutive et microservices-ready",C.purple),
sp(6),
p("3.1  Vue d'ensemble",{h:HeadingLevel.HEADING_2}),
p("La nouvelle architecture adopte une approche en couches claires avec séparation des responsabilités, compatible avec une migration future vers des microservices. Elle est conçue pour évoluer de 100 à 10 000 utilisateurs sans refactoring majeur.",{after:6}),

new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[9706],
  rows:[
    ...[
      {label:"COUCHE PRÉSENTATION (Frontend)",fill:C.emeraldLt,bc:C.emerald,items:[
        "React.js 18 (migration depuis HTML vanilla) — composants réutilisables et state management",
        "Tailwind CSS 3 + shadcn/ui — design system cohérent",
        "Socket.io Client — connexion temps réel bidirectionnelle",
        "API Client (axios) — intercepteurs JWT automatiques",
        "PWA (Progressive Web App) — expérience mobile sans app store",
      ]},
      {label:"COUCHE API GATEWAY",fill:C.blueLt,bc:C.blue,items:[
        "Express.js 4 — routeur principal avec middleware chain",
        "rate-limiter-flexible — limitation 100 req/min par IP",
        "helmet.js — headers de sécurité HTTP",
        "express-validator — validation et sanitisation des entrées",
        "morgan — logging structuré JSON",
      ]},
      {label:"COUCHE SERVICES MÉTIER",fill:C.purpleLt,bc:C.purple,items:[
        "AuthService — JWT RS256, refresh tokens, blacklist",
        "AIService — proxy vers Anthropic Claude API + cache Redis",
        "ScoringService — calcul dynamique du score étudiant",
        "NotificationService — push notifications + emails",
        "DocumentService — upload, compression, génération PDF",
      ]},
      {label:"COUCHE DONNÉES",fill:C.amberLt,bc:C.amber,items:[
        "MySQL 8 — données relationnelles (utilisateurs, projets, scores)",
        "Redis 7 — cache sessions, rate limiting, pub/sub temps réel",
        "Multer + Cloudinary — stockage fichiers et documents",
        "Socket.io (Redis adapter) — messagerie temps réel scalable",
      ]},
    ].map(({label,fill,bc,items})=>[
      new TableRow({children:[new TableCell({
        borders:brd(bc), width:{size:9706,type:WidthType.DXA},
        shading:{fill,type:ShadingType.CLEAR},
        margins:{top:120,bottom:60,left:220,right:220},
        children:[new Paragraph({children:[new TextRun({text:label,bold:true,size:22,color:bc})]})]
      })]}),
      new TableRow({children:[new TableCell({
        borders:brd(bc), width:{size:9706,type:WidthType.DXA},
        shading:{fill:C.white,type:ShadingType.CLEAR},
        margins:{top:60,bottom:100,left:220,right:220},
        children: items.map(item=>bullet(item))
      })]}),
    ]).flat()
  ]
}),
sp(8),

p("3.2  Stack technique complète",{h:HeadingLevel.HEADING_2}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[2000,3853,3853],
  rows:[
    new TableRow({children:[hcell("Domaine",C.slate900,2000),hcell("Technologie",C.slate900,3853),hcell("Justification",C.slate900,3853)]}),
    ...[
      ["IA / LLM","Anthropic Claude 3.5 Sonnet API","Meilleure balance coût/qualité pour le contexte éducatif"],
      ["Temps réel","Socket.io 4 + Redis Pub/Sub","Standard industrie, scalable horizontalement"],
      ["Cache","Redis 7 (ioredis)","< 1ms latence pour sessions et recommandations"],
      ["Fichiers","Multer + Cloudinary","Gratuit jusqu'à 25GB, CDN global intégré"],
      ["PDF","Puppeteer (headless Chrome)","Rendu fidèle HTML→PDF, aucune dépendance externe"],
      ["Email","Nodemailer + SMTP Togolais","Notifications, confirmations, rappels"],
      ["Validation","Zod (TypeScript-first)","Validation isomorphe frontend/backend"],
      ["Tests","Jest + Supertest","Coverage 80% minimum obligatoire"],
      ["CI/CD","GitHub Actions","Déploiement automatique sur push main"],
      ["Monitoring","Prometheus + Grafana","Métriques temps réel, alertes"],
    ].map(([a,b_,c],i)=>new TableRow({children:[
      cell(p(t(a,{b:true,sz:19})),{fill:i%2?"F8FAFC":C.white,w:2000}),
      cell(p(t(b_,{sz:19,c:C.blue,b:true})),{fill:i%2?"F8FAFC":C.white,w:3853}),
      cell(p(t(c,{sz:18,i:true})),{fill:i%2?"F8FAFC":C.white,w:3853}),
    ]}))
  ]
}),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 4 — SCHÉMA BASE DE DONNÉES V2
// ══════════════════════════════════════════════════════════════════
banner("4","NOUVEAU SCHÉMA DE BASE DE DONNÉES","MySQL 8 — 15 tables — Relations normalisées 3NF",C.teal),
sp(6),

p("4.1  Schéma SQL complet",{h:HeadingLevel.HEADING_2}),
code([
  "-- ============================================================",
  "--  CampusConnect.tg v2.0 — Schéma MySQL 8 complet",
  "--  15 tables — Normalisé 3NF — UTF8MB4",
  "-- ============================================================",
  "",
  "CREATE DATABASE IF NOT EXISTS campusconnect_v2",
  "  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
  "USE campusconnect_v2;",
  "",
  "-- TABLE 1 : utilisateurs (étendue)",
  "CREATE TABLE utilisateurs (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  prenom         VARCHAR(100) NOT NULL,",
  "  nom            VARCHAR(100) NOT NULL,",
  "  email          VARCHAR(255) NOT NULL UNIQUE,",
  "  mot_de_passe   VARCHAR(255) NOT NULL,",
  "  role           ENUM('etudiant','formateur','admin') DEFAULT 'etudiant',",
  "  ecole_id       INT,",
  "  niveau         VARCHAR(50)  DEFAULT 'Licence 1',",
  "  bio            TEXT,",
  "  avatar_url     VARCHAR(500),",
  "  linkedin_url   VARCHAR(500),",
  "  github_url     VARCHAR(500),",
  "  score_global   INT DEFAULT 0,",
  "  actif          TINYINT(1) DEFAULT 1,",
  "  email_verifie  TINYINT(1) DEFAULT 0,",
  "  derniere_connexion DATETIME,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
  ");",
  "",
  "-- TABLE 2 : ecoles",
  "CREATE TABLE ecoles (",
  "  id          INT AUTO_INCREMENT PRIMARY KEY,",
  "  nom         VARCHAR(200) NOT NULL,",
  "  sigle       VARCHAR(20)  NOT NULL,",
  "  ville       VARCHAR(100) DEFAULT 'Lomé',",
  "  pays        VARCHAR(100) DEFAULT 'Togo',",
  "  logo_url    VARCHAR(500),",
  "  partenaire  TINYINT(1) DEFAULT 1",
  ");",
  "",
  "-- TABLE 3 : projets (étendue)",
  "CREATE TABLE projets (",
  "  id              INT AUTO_INCREMENT PRIMARY KEY,",
  "  titre           VARCHAR(300) NOT NULL,",
  "  description     TEXT,",
  "  objectifs       TEXT,",
  "  tags            JSON,",
  "  technologies    JSON,",
  "  max_participants INT DEFAULT 4,",
  "  statut          ENUM('brouillon','ouvert','en_cours','termine','archive') DEFAULT 'ouvert',",
  "  avancement      INT DEFAULT 0,",
  "  date_debut      DATE,",
  "  date_fin        DATE,",
  "  createur_id     INT NOT NULL,",
  "  formateur_id    INT,",
  "  visible         TINYINT(1) DEFAULT 1,",
  "  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (createur_id)  REFERENCES utilisateurs(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (formateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL",
  ");",
  "",
  "-- TABLE 4 : inscriptions",
  "CREATE TABLE inscriptions (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  projet_id      INT NOT NULL,",
  "  role_projet    ENUM('chef','membre','observateur') DEFAULT 'membre',",
  "  joined_at      DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  UNIQUE KEY uq_inscription (utilisateur_id, projet_id),",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (projet_id)      REFERENCES projets(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 5 : competences",
  "CREATE TABLE competences (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  nom            VARCHAR(150) NOT NULL,",
  "  categorie      ENUM('technique','soft','langue','metier') DEFAULT 'technique',",
  "  niveau_pct     INT DEFAULT 0,",
  "  valide_par     INT,",
  "  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (valide_par)     REFERENCES utilisateurs(id) ON DELETE SET NULL",
  ");",
  "",
  "-- TABLE 6 : evaluations",
  "CREATE TABLE evaluations (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  projet_id      INT NOT NULL,",
  "  evaluateur_id  INT NOT NULL,",
  "  etudiant_id    INT NOT NULL,",
  "  note_technique INT DEFAULT 0,   -- /20",
  "  note_travail   INT DEFAULT 0,   -- /20",
  "  note_livraison INT DEFAULT 0,   -- /20",
  "  note_global    DECIMAL(5,2),",
  "  commentaire    TEXT,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (projet_id)     REFERENCES projets(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (evaluateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (etudiant_id)   REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 7 : scores (historique)",
  "CREATE TABLE scores (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  score          INT NOT NULL,",
  "  composantes    JSON NOT NULL,   -- détail du calcul",
  "  raison         VARCHAR(200),",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 8 : messages",
  "CREATE TABLE messages (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  expediteur_id  INT NOT NULL,",
  "  destinataire_id INT,            -- NULL si message de groupe",
  "  projet_id      INT,             -- NULL si message privé",
  "  contenu        TEXT NOT NULL,",
  "  type           ENUM('texte','fichier','notification') DEFAULT 'texte',",
  "  fichier_url    VARCHAR(500),",
  "  lu             TINYINT(1) DEFAULT 0,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (expediteur_id)   REFERENCES utilisateurs(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,",
  "  FOREIGN KEY (projet_id)       REFERENCES projets(id) ON DELETE SET NULL",
  ");",
  "",
  "-- TABLE 9 : documents",
  "CREATE TABLE documents (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  projet_id      INT,",
  "  utilisateur_id INT NOT NULL,",
  "  nom            VARCHAR(300) NOT NULL,",
  "  type           ENUM('rapport','presentation','code','autre') DEFAULT 'autre',",
  "  url_cloudinary VARCHAR(500) NOT NULL,",
  "  taille_ko      INT,",
  "  public_id      VARCHAR(300),",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (projet_id)      REFERENCES projets(id) ON DELETE SET NULL,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 10 : notifications",
  "CREATE TABLE notifications (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  type           VARCHAR(100) NOT NULL,",
  "  titre          VARCHAR(200) NOT NULL,",
  "  corps          TEXT,",
  "  lu             TINYINT(1) DEFAULT 0,",
  "  lien           VARCHAR(500),",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 11 : conversations_ia",
  "CREATE TABLE conversations_ia (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  session_id     VARCHAR(100) NOT NULL,",
  "  role           ENUM('user','assistant') NOT NULL,",
  "  contenu        TEXT NOT NULL,",
  "  tokens_utilises INT DEFAULT 0,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 12 : livrables",
  "CREATE TABLE livrables (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  projet_id      INT NOT NULL,",
  "  titre          VARCHAR(300) NOT NULL,",
  "  description    TEXT,",
  "  date_echeance  DATE,",
  "  statut         ENUM('en_attente','soumis','valide','refuse') DEFAULT 'en_attente',",
  "  document_id    INT,",
  "  valide_par     INT,",
  "  valide_le      DATETIME,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (projet_id)   REFERENCES projets(id) ON DELETE CASCADE,",
  "  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,",
  "  FOREIGN KEY (valide_par)  REFERENCES utilisateurs(id) ON DELETE SET NULL",
  ");",
  "",
  "-- TABLE 13 : opportunites",
  "CREATE TABLE opportunites (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  titre          VARCHAR(300) NOT NULL,",
  "  entreprise     VARCHAR(200) NOT NULL,",
  "  description    TEXT,",
  "  type           ENUM('stage','emploi','freelance','bourse') DEFAULT 'stage',",
  "  competences    JSON,",
  "  lien           VARCHAR(500),",
  "  date_limite    DATE,",
  "  publie_par     INT,",
  "  actif          TINYINT(1) DEFAULT 1,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (publie_par) REFERENCES utilisateurs(id) ON DELETE SET NULL",
  ");",
  "",
  "-- TABLE 14 : refresh_tokens",
  "CREATE TABLE refresh_tokens (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT NOT NULL,",
  "  token          VARCHAR(500) NOT NULL UNIQUE,",
  "  expires_at     DATETIME NOT NULL,",
  "  revoque        TINYINT(1) DEFAULT 0,",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE",
  ");",
  "",
  "-- TABLE 15 : audit_log",
  "CREATE TABLE audit_log (",
  "  id             INT AUTO_INCREMENT PRIMARY KEY,",
  "  utilisateur_id INT,",
  "  action         VARCHAR(200) NOT NULL,",
  "  entite         VARCHAR(100),",
  "  entite_id      INT,",
  "  details        JSON,",
  "  ip_adresse     VARCHAR(45),",
  "  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP",
  ");",
]),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 5 — MODIFICATIONS BACKEND
// ══════════════════════════════════════════════════════════════════
banner("5","MODIFICATIONS BACKEND","Node.js/Express — Nouveaux services et routes",C.blue),
sp(6),

p("5.1  Service de Scoring Intelligent",{h:HeadingLevel.HEADING_2}),
p("Le scoring est calculé dynamiquement selon 5 composantes pondérées, mis à jour en temps réel à chaque action utilisateur.",{after:5}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[3500,2200,4006],
  rows:[
    new TableRow({children:[hcell("Composante",C.slate900,3500),hcell("Poids",C.slate900,2200),hcell("Critères de calcul",C.slate900,4006)]}),
    ...[
      ["Participation projets","30%","Nb projets rejoints × rôle (chef=3pts, membre=2pts, obs=1pt)"],
      ["Évaluations encadreurs","25%","Moyenne pondérée note_technique + note_travail + note_livraison"],
      ["Compétences validées","20%","Nb compétences × niveau_pct × (1 + bonus_validation_formateur)"],
      ["Livrables validés","15%","Nb livrables_validés / nb_livrables_total × 100"],
      ["Activité plateforme","10%","Connexions × 0.5 + messages × 0.3 + documents × 0.2 (max 30j)"],
    ].map(([a,b_,c],i)=>new TableRow({children:[
      cell(p(t(a,{b:true,sz:19})),{fill:i%2?"F8FAFC":C.white,w:3500}),
      cell(p(t(b_,{b:true,sz:20,c:C.emerald})),{fill:C.emeraldLt,w:2200}),
      cell(p(t(c,{sz:18,i:true})),{fill:i%2?"F8FAFC":C.white,w:4006}),
    ]}))
  ]
}),
sp(6),
code([
  "// services/scoringService.js",
  "class ScoringService {",
  "  async calculerScore(userId) {",
  "    const [user, projets, evaluations, competences, livrables, activite] =",
  "      await Promise.all([",
  "        db.query('SELECT * FROM utilisateurs WHERE id=?', [userId]),",
  "        db.query(`SELECT i.role_projet, COUNT(*) as nb",
  "                  FROM inscriptions i WHERE i.utilisateur_id=?`,  [userId]),",
  "        db.query('SELECT AVG(note_global) as moy FROM evaluations WHERE etudiant_id=?', [userId]),",
  "        db.query('SELECT SUM(niveau_pct) as total FROM competences WHERE utilisateur_id=?', [userId]),",
  "        db.query(`SELECT COUNT(*) as valides FROM livrables l",
  "                  JOIN inscriptions i ON i.projet_id=l.projet_id",
  "                  WHERE i.utilisateur_id=? AND l.statut='valide'`, [userId]),",
  "        this._getActiviteScore(userId),",
  "      ]);",
  "",
  "    const composantes = {",
  "      participation: Math.min(30, projets[0]?.nb * 5 || 0),",
  "      evaluations:   Math.min(25, (evaluations[0]?.moy || 0) * 1.25),",
  "      competences:   Math.min(20, (competences[0]?.total || 0) / 50),",
  "      livrables:     Math.min(15, (livrables[0]?.valides || 0) * 3),",
  "      activite:      Math.min(10, activite),",
  "    };",
  "",
  "    const scoreTotal = Object.values(composantes).reduce((a,b) => a+b, 0);",
  "",
  "    // Sauvegarder l'historique",
  "    await db.query(",
  "      'INSERT INTO scores (utilisateur_id, score, composantes) VALUES (?,?,?)',",
  "      [userId, Math.round(scoreTotal), JSON.stringify(composantes)]",
  "    );",
  "    await db.query(",
  "      'UPDATE utilisateurs SET score_global=? WHERE id=?',",
  "      [Math.round(scoreTotal), userId]",
  "    );",
  "    return { score: Math.round(scoreTotal), composantes };",
  "  }",
  "}",
]),
sp(8),

p("5.2  Service IA — CampusBot (Anthropic Claude)",{h:HeadingLevel.HEADING_2}),
code([
  "// services/aiService.js",
  "const Anthropic = require('@anthropic-ai/sdk');",
  "const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });",
  "",
  "class AIService {",
  "",
  "  // Contexte système personnalisé pour CampusConnect",
  "  _buildSystemPrompt(user, historique) {",
  "    return `Tu es CampusBot, l'assistant IA de CampusConnect.tg, la plateforme",
  "collaborative étudiante du Togo. Tu aides les étudiants togolais en français.",
  "",
  "Utilisateur actuel : ${user.prenom} ${user.nom} (${user.ecole}, ${user.niveau})",
  "Score actuel : ${user.score_global}/100",
  "",
  "Tu peux :",
  "- Conseiller sur les projets et compétences à développer",
  "- Aider à rédiger un CV professionnel",
  "- Préparer aux entretiens d'embauche togolais et africains",
  "- Expliquer les projets disponibles sur la plateforme",
  "- Recommander des ressources d'apprentissage gratuites",
  "",
  "Réponds toujours en français, avec empathie et précision.`,",
  "  }",
  "",
  "  async chat(userId, message, sessionId) {",
  "    // Récupérer l'historique de la session",
  "    const [user] = await db.query(",
  "      'SELECT u.*, e.nom as ecole FROM utilisateurs u LEFT JOIN ecoles e ON e.id=u.ecole_id WHERE u.id=?',",
  "      [userId]",
  "    );",
  "    const historique = await db.query(",
  "      'SELECT role, contenu FROM conversations_ia WHERE utilisateur_id=? AND session_id=? ORDER BY created_at LIMIT 20',",
  "      [userId, sessionId]",
  "    );",
  "",
  "    // Appel Claude API",
  "    const response = await client.messages.create({",
  "      model:      'claude-sonnet-4-5',",
  "      max_tokens: 1024,",
  "      system:     this._buildSystemPrompt(user[0], historique),",
  "      messages: [",
  "        ...historique.map(h => ({ role: h.role, content: h.contenu })),",
  "        { role: 'user', content: message }",
  "      ]",
  "    });",
  "",
  "    const reponse = response.content[0].text;",
  "",
  "    // Sauvegarder en base",
  "    await db.query(",
  "      'INSERT INTO conversations_ia (utilisateur_id, session_id, role, contenu, tokens_utilises) VALUES (?,?,?,?,?),(?,?,?,?,?)',",
  "      [userId, sessionId, 'user',      message,  0,",
  "       userId, sessionId, 'assistant', reponse,  response.usage.output_tokens]",
  "    );",
  "",
  "    return { reponse, tokens: response.usage.output_tokens };",
  "  }",
  "",
  "  async genererCV(userId) {",
  "    const [user]        = await db.query('SELECT * FROM utilisateurs WHERE id=?', [userId]);",
  "    const competences   = await db.query('SELECT * FROM competences WHERE utilisateur_id=?', [userId]);",
  "    const projets       = await db.query(`",
  "      SELECT p.titre, p.description, p.tags, i.role_projet, p.avancement",
  "      FROM inscriptions i JOIN projets p ON p.id=i.projet_id",
  "      WHERE i.utilisateur_id=?`, [userId]);",
  "    const evaluations   = await db.query('SELECT AVG(note_global) as moy FROM evaluations WHERE etudiant_id=?', [userId]);",
  "",
  "    const prompt = `Génère un CV professionnel complet en JSON pour :",
  "Nom: ${user[0].prenom} ${user[0].nom}",
  "École: (ecole), Niveau: ${user[0].niveau}",
  "Bio: ${user[0].bio}",
  "Compétences: ${competences.map(c=>c.nom+' ('+c.niveau_pct+'%)').join(', ')}",
  "Projets: ${projets.map(p=>p.titre+' — '+p.role_projet).join(', ')}",
  "Score IA: ${user[0].score_global}/100`,",
  "",
  "    const response = await client.messages.create({",
  "      model: 'claude-sonnet-4-5', max_tokens: 2000,",
  "      messages: [{ role: 'user', content: prompt }]",
  "    });",
  "    return JSON.parse(response.content[0].text);",
  "  }",
  "}",
]),
sp(8),

p("5.3  Messagerie temps réel (Socket.io)",{h:HeadingLevel.HEADING_2}),
code([
  "// services/socketService.js",
  "const { Server } = require('socket.io');",
  "const jwt = require('jsonwebtoken');",
  "",
  "function initSocket(httpServer) {",
  "  const io = new Server(httpServer, {",
  "    cors: { origin: process.env.FRONTEND_URL, credentials: true }",
  "  });",
  "",
  "  // Middleware d'authentification",
  "  io.use((socket, next) => {",
  "    const token = socket.handshake.auth.token;",
  "    try {",
  "      socket.user = jwt.verify(token, process.env.JWT_SECRET);",
  "      next();",
  "    } catch { next(new Error('Non autorisé')); }",
  "  });",
  "",
  "  io.on('connection', (socket) => {",
  "    console.log(`Connecté: ${socket.user.email}`);",
  "",
  "    // Rejoindre les rooms de ses projets",
  "    socket.on('joinProjets', async (projetIds) => {",
  "      projetIds.forEach(id => socket.join(`projet_${id}`));",
  "    });",
  "",
  "    // Message privé",
  "    socket.on('messagePrive', async ({ destinataireId, contenu }) => {",
  "      await db.query(",
  "        'INSERT INTO messages (expediteur_id, destinataire_id, contenu) VALUES (?,?,?)',",
  "        [socket.user.id, destinataireId, contenu]",
  "      );",
  "      io.to(`user_${destinataireId}`).emit('nouveauMessage', {",
  "        expediteur: socket.user, contenu, timestamp: new Date()",
  "      });",
  "    });",
  "",
  "    // Message de groupe (projet)",
  "    socket.on('messageProjet', async ({ projetId, contenu }) => {",
  "      await db.query(",
  "        'INSERT INTO messages (expediteur_id, projet_id, contenu) VALUES (?,?,?)',",
  "        [socket.user.id, projetId, contenu]",
  "      );",
  "      io.to(`projet_${projetId}`).emit('nouveauMessageProjet', {",
  "        expediteur: socket.user, contenu, projetId, timestamp: new Date()",
  "      });",
  "    });",
  "",
  "    socket.on('disconnect', () => {",
  "      console.log(`Déconnecté: ${socket.user.email}`);",
  "    });",
  "  });",
  "  return io;",
  "}",
]),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 6 — SÉCURITÉ
// ══════════════════════════════════════════════════════════════════
banner("6","SÉCURITÉ RENFORCÉE","JWT RS256 · Validation · Protection XSS/SQLi · Rate limiting",C.red),
sp(6),

p("6.1  Middlewares de sécurité",{h:HeadingLevel.HEADING_2}),
code([
  "// middleware/security.js",
  "const helmet       = require('helmet');",
  "const { RateLimiterMemory } = require('rate-limiter-flexible');",
  "const { body, validationResult } = require('express-validator');",
  "const DOMPurify   = require('isomorphic-dompurify');",
  "",
  "// 1. Headers sécurité HTTP",
  "app.use(helmet({",
  "  contentSecurityPolicy: {",
  "    directives: {",
  "      defaultSrc: [\"'self'\"],",
  "      scriptSrc:  [\"'self'\", 'cdnjs.cloudflare.com'],",
  "      styleSrc:   [\"'self'\", \"'unsafe-inline'\", 'fonts.googleapis.com'],",
  "    }",
  "  }",
  "}));",
  "",
  "// 2. Rate limiting — 100 req/min par IP, 10 req/min sur /auth",
  "const limiterGlobal = new RateLimiterMemory({ points: 100, duration: 60 });",
  "const limiterAuth   = new RateLimiterMemory({ points: 10,  duration: 60 });",
  "",
  "app.use(async (req, res, next) => {",
  "  try {",
  "    const limiter = req.path.startsWith('/api/auth') ? limiterAuth : limiterGlobal;",
  "    await limiter.consume(req.ip);",
  "    next();",
  "  } catch {",
  "    res.status(429).json({ error: 'Trop de requêtes. Réessayez dans 1 minute.' });",
  "  }",
  "});",
  "",
  "// 3. Validation et sanitisation (exemple login)",
  "const validateLogin = [",
  "  body('email').isEmail().normalizeEmail().trim(),",
  "  body('mot_de_passe').isLength({ min:6, max:100 }).trim(),",
  "  (req, res, next) => {",
  "    const errors = validationResult(req);",
  "    if (!errors.isEmpty())",
  "      return res.status(400).json({ errors: errors.array() });",
  "    // Sanitiser contre XSS",
  "    req.body.email = DOMPurify.sanitize(req.body.email);",
  "    next();",
  "  }",
  "];",
  "",
  "// 4. Protection SQL Injection — utiliser UNIQUEMENT des requêtes paramétrées",
  "// JAMAIS : db.query('SELECT * FROM users WHERE email=' + email)",
  "// TOUJOURS : db.query('SELECT * FROM users WHERE email=?', [email])",
]),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 7 — INTÉGRATION IA COMPLÈTE
// ══════════════════════════════════════════════════════════════════
banner("7","INTÉGRATION IA — CAMPUSBOT","Module complet : Chat · CV · Recommandations · Entretiens",C.purple),
sp(6),

p("7.1  Fonctionnalités IA détaillées",{h:HeadingLevel.HEADING_2}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[2500,3353,3853],
  rows:[
    new TableRow({children:[hcell("Fonctionnalité",C.purple,2500),hcell("Prompt Strategy",C.purple,3353),hcell("Output",C.purple,3853)]}),
    ...[
      ["Chat conseiller","Contexte utilisateur + historique 20 messages","Réponse textuelle enrichie en markdown"],
      ["Générateur CV","Profil complet + projets + compétences","JSON structuré → PDF Puppeteer"],
      ["Lettre motivation","Poste cible + compétences + projets réalisés","Texte formel adapté au marché togolais"],
      ["Prépa entretien","Poste + compétences + questions classiques","Q&A avec score et conseils"],
      ["Recommandations","Score + gaps de compétences + projets similaires","Liste projets et compétences prioritaires"],
      ["Analyse livrable","Contenu document + critères du formateur","Note /20 + commentaire détaillé"],
    ].map(([a,b_,c],i)=>new TableRow({children:[
      cell(p(t(a,{b:true,sz:19,c:C.purple})),{fill:i%2?C.purpleLt:C.white,w:2500}),
      cell(p(t(b_,{sz:18,i:true})),{fill:i%2?"F8FAFC":C.white,w:3353}),
      cell(p(t(c,{sz:18})),{fill:i%2?"F8FAFC":C.white,w:3853}),
    ]}))
  ]
}),
sp(6),
infoBox("Coût estimé API Claude : environ 0,003$ par conversation de 10 échanges. Pour 500 étudiants actifs/mois : ~15$/mois. Le cache Redis réduit ce coût de 40% sur les questions répétitives.", C.amberLt, C.amber, "$"),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 8 — PLAN DE DÉVELOPPEMENT
// ══════════════════════════════════════════════════════════════════
banner("8","PLAN DE DÉVELOPPEMENT ÉTAPE PAR ÉTAPE","4 phases · 16 semaines · Méthode Agile Sprint",C.amber),
sp(6),

...[
  {phase:"PHASE 1 — Fondations IA & Sécurité",dur:"Semaines 1–4",fill:C.red,steps:[
    ["S1","Mise à jour BDD","Exécuter database_v2.sql — 15 tables — Migrer données existantes vers nouvelle structure"],
    ["S1","Sécurité","Intégrer helmet, rate-limiter, express-validator, DOMPurify dans server.js"],
    ["S2","Auth V2","Implémenter refresh tokens, email vérification, blacklist JWT dans AuthService"],
    ["S2","Scoring service","Développer ScoringService avec les 5 composantes et trigger automatique"],
    ["S3","CampusBot","Créer AIService connecté à Anthropic Claude API avec gestion historique"],
    ["S3","Route /api/ia/chat","Endpoint POST sécurisé avec validation, rate limiting spécifique IA"],
    ["S4","Générateur CV IA","Intégrer Puppeteer, genererCV() dans AIService, route /api/ia/cv"],
    ["S4","Tests Phase 1","Jest + Supertest — coverage > 80% sur tous les nouveaux services"],
  ]},
  {phase:"PHASE 2 — Temps réel & Analytics",dur:"Semaines 5–8",fill:C.amber,steps:[
    ["S5","Socket.io","Installer socket.io, initSocket(), authentification middleware JWT"],
    ["S5","Messagerie","Tables messages, routes REST + événements temps réel"],
    ["S6","Notifications","NotificationService, table notifications, push events Socket.io"],
    ["S6","Redis","Intégrer Redis pour cache sessions, pub/sub Socket.io, cache recommandations"],
    ["S7","Recommandations IA","Service analyse profil → recommandations projets et compétences"],
    ["S7","Dashboard analytics","Agrégations SQL pour stats personnelles et globales"],
    ["S8","Opportunités","Module offres de stage/emploi, matching par compétences"],
    ["S8","Tests Phase 2","Tests d'intégration Socket.io, tests de charge (100 connexions simultanées)"],
  ]},
  {phase:"PHASE 3 — Documents & Livrables",dur:"Semaines 9–12",fill:C.blue,steps:[
    ["S9","Upload fichiers","Multer + validation MIME + Cloudinary SDK"],
    ["S9","Gestion documents","CRUD complet table documents, livrables, soumission par étudiant"],
    ["S10","Évaluations","Interface notation formateur, déclenchement automatique scoring"],
    ["S10","Gestion livrables","Workflow soumission → validation → refus avec notifications"],
    ["S11","Analyse IA docs","analyserLivrable() dans AIService — note automatique + commentaire"],
    ["S11","PDF Puppeteer","Génération rapports PDF projets, CV complets"],
    ["S12","Tests Phase 3","Tests upload 50 fichiers simultanés, validation formats"],
  ]},
  {phase:"PHASE 4 — Mobile & Production",dur:"Semaines 13–16",fill:C.purple,steps:[
    ["S13","API versioning","Préfixer /api/v1/ pour compatibilité future mobile"],
    ["S13","Documentation","Swagger/OpenAPI 3.0 complet pour toutes les routes"],
    ["S14","PWA","Service Worker, manifest.json, mode offline basique"],
    ["S14","CI/CD","GitHub Actions — tests auto + déploiement Railway/Render"],
    ["S15","Monitoring","Prometheus métriques, Grafana dashboard, alertes Slack"],
    ["S15","Sécurité audit","OWASP ZAP scan, correction vulnérabilités"],
    ["S16","Beta test","50 étudiants IPNET — collecte feedback — corrections"],
    ["S16","Lancement","Déploiement production + communication hackathon"],
  ]},
].map(({phase,dur,fill,steps})=>[
  new Table({
    width:{size:9706,type:WidthType.DXA}, columnWidths:[7000,2706],
    rows:[new TableRow({children:[
      new TableCell({ borders:noBorders, width:{size:7000,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR}, margins:{top:140,bottom:140,left:240,right:240},
        children:[new Paragraph({children:[new TextRun({text:phase,bold:true,size:26,color:C.white,font:"Arial"})]})] }),
      new TableCell({ borders:noBorders, width:{size:2706,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR}, margins:{top:140,bottom:140,left:240,right:240},
        children:[new Paragraph({alignment:AlignmentType.RIGHT, children:[new TextRun({text:dur,size:20,color:"FEF3C7"})]})] }),
    ]})]
  }),
  new Table({
    width:{size:9706,type:WidthType.DXA}, columnWidths:[800,2000,6906],
    rows:[
      new TableRow({children:[hcell("Sprint",C.slate900,800),hcell("Tâche",C.slate900,2000),hcell("Description",C.slate900,6906)]}),
      ...steps.map(([s,tache,desc],i)=>new TableRow({children:[
        cell(p(t(s,{b:true,sz:18,c:C.white})),{fill,w:800,bc:fill}),
        cell(p(t(tache,{b:true,sz:18})),{fill:i%2?"F8FAFC":C.white,w:2000}),
        cell(p(t(desc,{sz:18})),{fill:i%2?"F8FAFC":C.white,w:6906}),
      ]}))
    ]
  }),
  sp(8),
]).flat(),

p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  PARTIE 9 — CODE COMPLET MODULES CLÉS
// ══════════════════════════════════════════════════════════════════
banner("9","CODE COMPLET — MODULES CLÉS","Extraits de production prêts à intégrer",C.emerald),
sp(6),

p("9.1  Routes API complètes v2",{h:HeadingLevel.HEADING_2}),
code([
  "// routes/ia.js — Routes CampusBot",
  "const router = require('express').Router();",
  "const aiService = require('../services/aiService');",
  "const { authMiddleware } = require('../middleware/auth');",
  "const { body } = require('express-validator');",
  "",
  "// POST /api/ia/chat — Conversation avec CampusBot",
  "router.post('/chat', authMiddleware, [",
  "  body('message').isString().isLength({min:1,max:2000}).trim(),",
  "  body('sessionId').isString().isLength({min:10,max:100}),",
  "], async (req, res) => {",
  "  try {",
  "    const { message, sessionId } = req.body;",
  "    const result = await aiService.chat(req.user.id, message, sessionId);",
  "    res.json(result);",
  "  } catch (err) {",
  "    console.error('Erreur IA Chat:', err);",
  "    res.status(500).json({ error: 'Service IA temporairement indisponible.' });",
  "  }",
  "});",
  "",
  "// POST /api/ia/cv — Générer un CV",
  "router.post('/cv', authMiddleware, async (req, res) => {",
  "  try {",
  "    const cvData = await aiService.genererCV(req.user.id);",
  "    const pdfBuffer = await pdfService.genererPDF(cvData);",
  "    res.set('Content-Type', 'application/pdf');",
  "    res.set('Content-Disposition', `attachment; filename=CV_${req.user.id}.pdf`);",
  "    res.send(pdfBuffer);",
  "  } catch (err) {",
  "    res.status(500).json({ error: err.message });",
  "  }",
  "});",
  "",
  "// POST /api/ia/preparer-entretien — Simulation entretien",
  "router.post('/preparer-entretien', authMiddleware, [",
  "  body('poste').isString().isLength({min:3,max:200}).trim(),",
  "], async (req, res) => {",
  "  try {",
  "    const result = await aiService.preparerEntretien(req.user.id, req.body.poste);",
  "    res.json(result);",
  "  } catch (err) {",
  "    res.status(500).json({ error: err.message });",
  "  }",
  "});",
  "",
  "// GET /api/ia/recommandations — Projets et compétences recommandés",
  "router.get('/recommandations', authMiddleware, async (req, res) => {",
  "  try {",
  "    const reco = await aiService.genererRecommandations(req.user.id);",
  "    res.json(reco);",
  "  } catch (err) {",
  "    res.status(500).json({ error: err.message });",
  "  }",
  "});",
  "",
  "module.exports = router;",
]),
sp(6),

p("9.2  Variables d'environnement complètes (.env v2)",{h:HeadingLevel.HEADING_2}),
code([
  "# ============================================================",
  "#  CampusConnect v2.0 — Configuration complète",
  "# ============================================================",
  "",
  "# Serveur",
  "PORT=3001",
  "NODE_ENV=production",
  "FRONTEND_URL=http://localhost:5500",
  "",
  "# Base de données MySQL",
  "DB_HOST=localhost",
  "DB_PORT=3306",
  "DB_USER=root",
  "DB_PASSWORD=votre_mot_de_passe",
  "DB_NAME=campusconnect_v2",
  "",
  "# JWT",
  "JWT_SECRET=clé_secrète_très_longue_et_aléatoire_minimum_64_caractères",
  "JWT_EXPIRES_IN=15m",
  "JWT_REFRESH_SECRET=autre_clé_secrète_pour_refresh_tokens",
  "JWT_REFRESH_EXPIRES_IN=7d",
  "",
  "# Anthropic Claude API",
  "ANTHROPIC_API_KEY=sk-ant-...",
  "AI_MAX_TOKENS=1024",
  "AI_MODEL=claude-sonnet-4-5",
  "",
  "# Redis",
  "REDIS_URL=redis://localhost:6379",
  "",
  "# Cloudinary",
  "CLOUDINARY_CLOUD_NAME=votre_cloud",
  "CLOUDINARY_API_KEY=votre_api_key",
  "CLOUDINARY_API_SECRET=votre_api_secret",
  "",
  "# Email",
  "SMTP_HOST=smtp.gmail.com",
  "SMTP_PORT=587",
  "SMTP_USER=votre_email@gmail.com",
  "SMTP_PASS=votre_mot_de_passe_application",
  "",
  "# Sécurité",
  "BCRYPT_ROUNDS=12",
  "RATE_LIMIT_GLOBAL=100",
  "RATE_LIMIT_AUTH=10",
]),
sp(6),

p("9.3  Architecture de fichiers v2 complète",{h:HeadingLevel.HEADING_2}),
code([
  "campusconnect-v2/",
  "  |",
  "  |-- frontend/                      (React.js — migration future)",
  "  |    |-- src/",
  "  |    |    |-- components/          (Button, Card, Modal, ChatBot...)",
  "  |    |    |-- pages/               (Dashboard, Projets, Profil...)",
  "  |    |    |-- hooks/               (useAuth, useSocket, useScore...)",
  "  |    |    |-- services/            (api.js, socket.js)",
  "  |    |    +-- store/               (Zustand — state management)",
  "  |    +-- public/",
  "  |         +-- manifest.json        (PWA)",
  "  |",
  "  +-- backend/",
  "       |-- server.js                 (Point d'entrée — Express + Socket.io)",
  "       |-- database.sql              (Schéma v2 — 15 tables)",
  "       |-- seed.js                   (Données initiales)",
  "       |-- .env                      (Variables d'environnement)",
  "       |",
  "       |-- routes/",
  "       |    |-- auth.js              (POST /register, /login, /refresh, /logout)",
  "       |    |-- projets.js           (CRUD projets + inscriptions)",
  "       |    |-- utilisateurs.js      (Profils, compétences, scores)",
  "       |    |-- ia.js                (Chat, CV, entretien, recommandations)",
  "       |    |-- messages.js          (CRUD messages + historique)",
  "       |    |-- documents.js         (Upload, liste, téléchargement)",
  "       |    |-- opportunites.js      (Stages, emplois, bourses)",
  "       |    +-- admin.js             (Gestion plateforme)",
  "       |",
  "       |-- services/",
  "       |    |-- aiService.js         (Anthropic Claude — Chat + CV + Reco)",
  "       |    |-- scoringService.js    (Calcul score 5 composantes)",
  "       |    |-- socketService.js     (Socket.io — messagerie temps réel)",
  "       |    |-- pdfService.js        (Puppeteer — génération PDF)",
  "       |    |-- notificationService.js (Push + email notifications)",
  "       |    +-- documentService.js   (Cloudinary upload/delete)",
  "       |",
  "       |-- middleware/",
  "       |    |-- auth.js              (JWT verify, rôles)",
  "       |    |-- security.js          (Helmet, rate limit, sanitize)",
  "       |    +-- upload.js            (Multer config + validation MIME)",
  "       |",
  "       +-- tests/",
  "            |-- auth.test.js",
  "            |-- projets.test.js",
  "            |-- scoring.test.js",
  "            +-- ia.test.js",
]),
sp(10),
p([],{pb:true}),

// ══════════════════════════════════════════════════════════════════
//  CONCLUSION
// ══════════════════════════════════════════════════════════════════
banner("CONCLUSION","CampusConnect.tg v2.0 — Vision et Impact","Présenté devant jury universitaire, investisseurs et recruteurs",C.slate900),
sp(6),
p("CampusConnect.tg v2.0 représente une transformation profonde d'une plateforme collaborative en un écosystème complet d'insertion professionnelle. En intégrant l'Intelligence Artificielle, la messagerie temps réel et un système de scoring transparent, la plateforme répond aux besoins réels des étudiants togolais tout en offrant aux formateurs des outils de suivi puissants.",{after:6}),
new Table({
  width:{size:9706,type:WidthType.DXA}, columnWidths:[3235,3235,3236],
  rows:[new TableRow({children:[
    ...[
      {ico:"🎓",t:"Pour les Étudiants",d:"IA coach personnalisé · CV automatique · Scoring transparent · Projets recommandés",fill:C.emerald},
      {ico:"💼",t:"Pour les Formateurs",d:"Évaluation simplifiée · Analytics équipes · Livrables validés · Rapports auto",fill:C.blue},
      {ico:"🏢",t:"Pour les Recruteurs",d:"Profils certifiés · Scores vérifiables · Portfolio projets · Matching compétences",fill:C.purple},
    ].map(({ico,t:tt,d,fill})=>new TableCell({
      borders:noBorders,
      width:{size:3235,type:WidthType.DXA},
      shading:{fill,type:ShadingType.CLEAR},
      margins:{top:200,bottom:200,left:180,right:180},
      children:[
        new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:ico,size:40})]}),
        new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:tt,bold:true,size:22,color:C.white})]}),
        sp(2),
        new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text:d,size:18,color:"D1FAE5"})]}),
      ]
    }))
  ]})]
}),
sp(8),
hr(),
sp(4),
p(t("CampusConnect.tg · IPNET · ESGIS · Université de Lomé · Togo · 2025 · Tous droits réservés",{sz:18,c:C.slate500,i:true}),{align:AlignmentType.CENTER,after:2}),

    ] // end children
  }] // end sections
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/CampusConnect_v2_Plan_Strategique.docx', buf);
  console.log('Document genere avec succes !');
}).catch(err => { console.error(err); process.exit(1); });
