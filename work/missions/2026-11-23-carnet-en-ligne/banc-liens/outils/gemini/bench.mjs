// Banc Gemini sur les liens du Carnet : chaque modèle lit la page à partir de son seul lien (url_context).
// Appels RÉELS et payants : lancer à la main, depuis le dépôt Brasserie (readLocalKey lit functions/.secret.local relatif au dossier courant).
//   cd Brasserie && node <ce fichier> --confirm-paid-ai [--liens 26,27] [--max 8]
// Jamais dans npm test. La clé n'est jamais affichée ni écrite (redact sur tout texte d'erreur).
// Reprise : un appel déjà écrit dans reponses/<config>/NN.json n'est pas refait ; le budget compte ces fichiers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const BANC = path.join(ICI, '..', '..');
const MISSION = path.join(BANC, '..');
const JOURNAL = path.join(MISSION, 'ia-journal.jsonl');
const REP = path.join(ICI, 'reponses');
const GUARD = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/scripts/gemini-usage-bench-guard.mjs';
const { readLocalKey, redact } = await import(pathToFileURL(GUARD).href);

if (!process.argv.includes('--confirm-paid-ai')) { console.log('Refus : appels Gemini payants. Ajouter --confirm-paid-ai pour les lancer volontairement.'); process.exit(2); }
const KEY = readLocalKey();
if (!KEY) { console.log('AUCUNE CLE : ni GEMINI_API_KEY ni fichier de clé lu par readLocalKey. Aucun appel.'); process.exit(2); }

const BUDGET_CHF = 0.8;
const CHF_PAR_USD = 1.25; // provision du dépôt (functions/src/geminiCosts.ts), pas un cours de change
const CHF_PAR_REQUETE_SEARCH = 0.0175; // 14 USD / 1000 requêtes × 1,25
const PARALLELE = 8;
const TIMEOUT_MS = 90_000;

// tarifs USD par million de jetons (entrée / sortie, réflexion comprise) : geminiCosts.ts, lu le 23.11
const CONFIGS = {
  lite: { modele: 'gemini-3.5-flash-lite', outil: 'url_context', niveau: 'MINIMAL', usd: [0.30, 2.50] },
  f38: { modele: 'gemini-3.8-flash', outil: 'url_context', niveau: 'LOW', usd: [1.50, 7.50] },
  f38s: { modele: 'gemini-3.8-flash', outil: 'google_search', niveau: 'LOW', usd: [1.50, 7.50], repli: true },
  hyd: { modele: 'gemini-4-hydrogen', outil: 'url_context', niveau: 'LOW', usd: [1.50, 7.50] },
  neon: { modele: 'gemini-4-neon', outil: 'url_context', niveau: 'LOW', usd: [3.00, 15.00] }
};
const PRINCIPALES = ['lite', 'f38', 'hyd', 'neon'];

const arg = (nom) => { const i = process.argv.indexOf(nom); return i >= 0 ? process.argv[i + 1] : undefined; };
const liens = JSON.parse(fs.readFileSync(path.join(ICI, 'liens.json'), 'utf8')); // [{n, lien}]
const ordre = arg('--liens') ? arg('--liens').split(',').map(Number) : liens.map((l) => l.n);
const max = Number(arg('--max') || 999);
const cibles = ordre.slice(0, max).map((n) => liens.find((l) => l.n === n)).filter(Boolean);

const nn = (n) => String(n).padStart(2, '0');
const fichier = (cfg, n) => path.join(REP, cfg, nn(n) + '.json');
const lire = (cfg, n) => (fs.existsSync(fichier(cfg, n)) ? JSON.parse(fs.readFileSync(fichier(cfg, n), 'utf8')) : null);

function prompt(url) {
  return `Lis la page produit à cette adresse avec l'outil de lecture d'URL, puis réponds par UN SEUL objet JSON, sans texte autour ni balise de code.
Adresse : ${url}

Forme exacte :
{"nom": texte, "marque": texte, "prix": nombre, "devise": "CHF|EUR|GBP|AUD|USD…", "ttc": true|false|null, "fraisSuisse": texte, "photos": [adresses], "caracteristiques": [{"nom": texte, "valeur": texte}]}

Règles :
- Rien n'est inventé : un champ que la page ne donne pas vaut null (une liste vide []). Jamais 0 pour un prix inconnu.
- prix : le prix de l'article affiché ou choisi par défaut sur la page, en nombre (pas de symbole), sans le prix barré, sans les accessoires ni les autres formats. Si la page ne montre aucun prix, null.
- devise : le code ISO de la devise lue sur la page.
- ttc : true si la page dit que le prix inclut la TVA, false s'il est hors taxes ou net, null si elle ne le dit pas.
- fraisSuisse : les frais de livraison vers la Suisse tels que la page les donne (texte court, par exemple « gratuite », « 13,38 CHF », « livraison refusée »), sinon null.
- photos : jusqu'à 3 adresses absolues de photos du produit lues sur la page ; jamais une adresse devinée.
- caracteristiques : jusqu'à 8 paires lues sur la page (capacité, dimensions, puissance, matière…), sinon [].`;
}

function coutChf(cfg, usage, requetes) {
  const [e, s] = CONFIGS[cfg].usd;
  const entree = (usage?.promptTokenCount ?? 0) + (usage?.toolUsePromptTokenCount ?? 0);
  const sortie = (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
  return { entree, sortie, chf: (entree * e + sortie * s) / 1e6 * CHF_PAR_USD + requetes * CHF_PAR_REQUETE_SEARCH };
}

function extraireJson(texte) {
  const a = texte.indexOf('{'), b = texte.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(texte.slice(a, b + 1)); } catch { return null; }
}

async function appeler(cfg, lien) {
  const c = CONFIGS[cfg];
  const corps = {
    contents: [{ role: 'user', parts: [{ text: prompt(lien) }] }],
    tools: [{ [c.outil]: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 4000, thinkingConfig: { thinkingLevel: c.niveau } }
  };
  let derniere;
  for (let essai = 0; essai < 2; essai++) {
    const t0 = Date.now();
    const ctl = new AbortController();
    const minuteur = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${c.modele}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(corps), signal: ctl.signal
      });
      const j = await r.json().catch(() => ({}));
      const ms = Date.now() - t0;
      if (!r.ok) {
        derniere = { http: r.status, ms, erreur: redact(String(j?.error?.message ?? '').slice(0, 300), KEY) };
        if (r.status === 429 || r.status >= 500) { await new Promise((ok) => setTimeout(ok, 3000)); continue; }
        return derniere;
      }
      const cand = j.candidates?.[0];
      const texte = (cand?.content?.parts ?? []).filter((p) => !p.thought && p.text).map((p) => p.text).join('');
      const requetes = (cand?.groundingMetadata?.webSearchQueries ?? []).length;
      const statuts = (cand?.urlContextMetadata?.urlMetadata ?? []).map((u) => u.urlRetrievalStatus);
      return { http: 200, ms, usage: j.usageMetadata, requetes, statuts, finish: cand?.finishReason, texte, json: extraireJson(texte) };
    } catch (e) {
      derniere = { http: 0, ms: Date.now() - t0, erreur: redact(String(e?.name === 'AbortError' ? 'délai de 90 s dépassé' : e?.message ?? e).slice(0, 200), KEY) };
      return derniere;
    } finally { clearTimeout(minuteur); }
  }
  return derniere;
}

// ---- budget, coupe de Neon, pool ----
const toutes = () => Object.keys(CONFIGS).flatMap((cfg) => (fs.existsSync(path.join(REP, cfg)) ? fs.readdirSync(path.join(REP, cfg)).map((f) => JSON.parse(fs.readFileSync(path.join(REP, cfg, f), 'utf8')).chf ?? 0) : []));
let depense = toutes().reduce((a, b) => a + b, 0);
const pireParCfg = {}; // coût du pire appel mesuré par configuration
const pireActif = () => Math.max(0.005, ...Object.entries(pireParCfg).filter(([c]) => !(c === 'neon' && neonCoupe)).map(([, v]) => v));
const mediane = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const msDe = (cfg) => (fs.existsSync(path.join(REP, cfg)) ? fs.readdirSync(path.join(REP, cfg)).map((f) => JSON.parse(fs.readFileSync(path.join(REP, cfg, f), 'utf8'))).filter((x) => x.http === 200).map((x) => x.ms) : []);
let neonCoupe = false;
const neonEtat = () => {
  if (neonCoupe) return true;
  const n = msDe('neon'), f = msDe('f38');
  if (n.length >= 3 && f.length >= 3 && mediane(n) > mediane(f)) { neonCoupe = true; console.log(`NEON COUPE : médiane ${mediane(n)} ms > 3.8 Flash ${mediane(f)} ms`); }
  return neonCoupe;
};

let enVol = 0;
let arret = false;
const file = [];
for (const c of cibles) for (const cfg of PRINCIPALES) file.push({ n: c.n, lien: c.lien, cfg });
const fait = { appels: 0 };

function ecrireJournal(cfg, n, r, entree, sortie, chf) {
  const ligne = { heure: new Date().toISOString(), methode: 'banc-liens-gemini', geste: `Lien n° ${n} lu par ${CONFIGS[cfg].modele} (${CONFIGS[cfg].outil}, ${(r.ms / 1000).toFixed(1)} s, http ${r.http})`, modele: CONFIGS[cfg].modele, jetons_entree: entree, jetons_sortie: sortie, estimation_chf: Math.round(chf * 1e5) / 1e5 };
  fs.appendFileSync(JOURNAL, JSON.stringify(ligne) + '\n');
}

async function tache(t) {
  if (lire(t.cfg, t.n)) return;
  if (t.cfg === 'neon' && neonEtat()) return;
  enVol++;
  try {
    const r = await appeler(t.cfg, t.lien);
    const { entree, sortie, chf } = coutChf(t.cfg, r.usage, r.requetes ?? 0);
    pireParCfg[t.cfg] = Math.max(pireParCfg[t.cfg] ?? 0, chf);
    depense += chf;
    fs.mkdirSync(path.join(REP, t.cfg), { recursive: true });
    fs.writeFileSync(fichier(t.cfg, t.n), JSON.stringify({ n: t.n, cfg: t.cfg, modele: CONFIGS[t.cfg].modele, ...r, entree, sortie, chf }, null, 1));
    ecrireJournal(t.cfg, t.n, r, entree, sortie, chf);
    fait.appels++;
    console.log(`${nn(t.n)} ${t.cfg.padEnd(5)} http ${r.http} ${(r.ms / 1000).toFixed(1)}s  ${entree}→${sortie} jetons  ${chf.toFixed(4)} CHF  prix=${r.json?.prix ?? '-'} ${r.json?.devise ?? ''}  total ${depense.toFixed(3)} CHF${r.erreur ? '  ERR ' + r.erreur.slice(0, 120) : ''}`);
    // repli google_search pour 3.8 Flash quand url_context n'a pas rendu de prix
    if (t.cfg === 'f38' && (r.json?.prix == null) && !arret) file.push({ n: t.n, lien: t.lien, cfg: 'f38s' });
  } finally { enVol--; }
}

async function ouvrier() {
  while (!arret) {
    const t = file.shift();
    if (!t) { if (enVol === 0) return; await new Promise((ok) => setTimeout(ok, 200)); continue; }
    if (t.cfg === 'neon' && neonEtat()) continue;
    if (lire(t.cfg, t.n)) continue;
    if (depense + (enVol + 1) * pireActif() * 1.2 > BUDGET_CHF) { arret = true; console.log(`BUDGET : ${depense.toFixed(3)} CHF dépensés, arrêt net avant d'atteindre ${BUDGET_CHF} CHF`); return; }
    await tache(t);
  }
}

console.log(`Départ : ${cibles.length} liens × ${PRINCIPALES.length} configurations, déjà dépensé ${depense.toFixed(3)} CHF, parallèle ${PARALLELE}`);
await Promise.all(Array.from({ length: PARALLELE }, () => ouvrier()));
console.log(`FIN : ${fait.appels} appels, ${depense.toFixed(3)} CHF au total${arret ? ' (budget atteint)' : ''}`);
