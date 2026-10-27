// Voie ia3 : le callable `hopReclasserIA` (mode « suggerer ») dans l'émulateur des fonctions, appelé par l'app en `?dev-local` (Vite dev, Chrome 390 × 844).
// Sur le modèle de work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/emulateur/emulateur.ts.
//
//   npx vite-node scripts/eval-hop/ia3-emulateur.ts -- --mode=simule
//   npx vite-node scripts/eval-hop/ia3-emulateur.ts -- --mode=reel --confirm-paid-ai
//
// Ce qui tourne : les émulateurs Auth, Firestore et Functions (projet démo `demo-ia3`, jamais les données réelles), le callable compilé dans un dossier
// temporaire (jamais le functions/lib du dépôt), un « fournisseur » local sur 127.0.0.1:5199 qui tient la place de l'API Gemini (l'émulateur seul peut
// détourner l'adresse : HOP_RECLASS_ENDPOINT_EMULATEUR, ignorée hors émulateur), Vite en dev, Chrome.
//  - simule : le fournisseur répond une liste fixe marquée « Simulé » ; aucun réseau, aucun coût, aucun appel Gemini.
//  - reel   : le fournisseur transmet la requête du callable à Gemini par les garde-fous de scripts/gemini38LiveCore.ts (hôte et modèle de la liste blanche,
//             ligne de journal par appel parti, compteur réservé avant l'envoi : 30 appels et 0,5 CHF au plus, section « ia3 » de gemini-journal.md ; arrêt au
//             premier dépassement ou à la première erreur répétée). La clé n'est lue que dans functions/.secret.local ou GEMINI_API_KEY, ici seulement : elle
//             n'est jamais transmise aux émulateurs ni écrite. functions/.env n'est jamais lu.
import { spawn, spawnSync } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardLiveFetch, liveEndpoint, liveJournalRow, withJournalLock, type LiveCall } from '../gemini38LiveCore';
import { requirePaidAiTestOptIn } from '../paid-ai-test-guard.mjs';
import { analyserReponseSuggerer, contexteDe, chiffresInventes } from '../../functions/src/hopReclassCore';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const SELF = fileURLToPath(import.meta.url);
const SORTIE = resolve(ROOT, 'work/missions/2026-10-25-integration-houblons/voies/ia3-ia-suggerer/img');
const PROJECT = 'demo-ia3';
const USER = { sub: 'brasseur-demo-ia3', email: 'brasseur@demo-ia3.test' };
const PORTS = { auth: 9099, firestore: 8080, functions: 5001, hub: 4400, logging: 4500 };
const PORT_FOURNISSEUR = 5199, PORT_VITE = 5254;
const JAVA_HOME = process.env.EMU_JAVA_HOME || 'C:\\Program Files\\Microsoft\\jdk-21.0.12.101-hotspot';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const MODE = (args.find((a) => a.startsWith('--mode='))?.split('=')[1] ?? 'simule') as 'simule' | 'reel';
const JOURNAL = resolve(ROOT, 'work/finalisation-tickets-2026-10-08/gemini-journal.md');
const VERROU = resolve(ROOT, 'work/finalisation-tickets-2026-10-08/locks/gemini-journal');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const portOpen = (port: number) => new Promise<boolean>((ok) => { const s = createConnection({ port, host: '127.0.0.1' }); s.once('connect', () => { s.destroy(); ok(true); }); s.once('error', () => ok(false)); });

// ============================ Mode externe : dossier temporaire, fonctions compilées, emulators:exec ============================
async function externe() {
  if (MODE === 'reel') requirePaidAiTestOptIn({ label: 'Gemini réel · ia3 · callable hopReclasserIA, mode suggérer, sur émulateur', command: 'npx vite-node scripts/eval-hop/ia3-emulateur.ts -- --mode=reel --confirm-paid-ai' });
  for (const p of [...Object.values(PORTS), PORT_FOURNISSEUR, PORT_VITE]) if (await portOpen(p)) throw new Error(`Port ${p} déjà occupé : rien n'est lancé.`);
  mkdirSync(SORTIE, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'affinee-ia3-emu-'));
  let code = 1;
  try {
    const cible = join(tmp, 'functions'), lib = join(cible, 'lib');
    mkdirSync(lib, { recursive: true });
    const tsc = join(ROOT, 'node_modules/typescript/bin/tsc');
    const c = spawnSync(process.execPath, [tsc, '-p', join(ROOT, 'functions/tsconfig.json'), '--outDir', lib], { cwd: ROOT, encoding: 'utf8' });
    console.log(`tsc functions → ${lib} : exit ${c.status} ${c.stdout}${c.stderr}`);
    if (c.status !== 0) throw new Error('Compilation des fonctions en échec.');
    // Seul le callable de cette voie est chargé : l'index complet attend cinq paquets que ce banc n'a pas à fabriquer.
    writeFileSync(join(lib, 'index.js'), ["import { initializeApp } from 'firebase-admin/app';", "import { setGlobalOptions } from 'firebase-functions/v2';", 'initializeApp();', "setGlobalOptions({ region: 'europe-west6' });", "export { hopReclasserIA } from './hopReclasserIA.js';", ''].join('\n'));
    copyFileSync(join(ROOT, 'functions/package.json'), join(cible, 'package.json'));
    symlinkSync(join(ROOT, 'functions/node_modules'), join(cible, 'node_modules'), 'junction');
    // Le .env du dossier TEMPORAIRE (jamais functions/.env du dépôt) : le seul compte autorisé, et le détour vers le fournisseur local.
    writeFileSync(join(cible, '.env'), `AUTHORIZED_ACCOUNTS=${USER.email}\nHOP_RECLASS_ENDPOINT_EMULATEUR=http://127.0.0.1:${PORT_FOURNISSEUR}/v1beta/models\n`);
    // Une clé factice dans le .secret.local du dossier TEMPORAIRE : l'émulateur n'ira pas la chercher dans Secret Manager (403 et délai).
    writeFileSync(join(cible, '.secret.local'), 'GEMINI_API_KEY=cle-factice-emulateur\n');
    writeFileSync(join(tmp, 'firestore.rules'), "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }\n");
    writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({ firestore: { rules: 'firestore.rules' }, functions: [{ source: 'functions', codebase: 'default' }],
      emulators: { auth: { port: PORTS.auth }, firestore: { port: PORTS.firestore }, functions: { port: PORTS.functions }, hub: { port: PORTS.hub }, logging: { port: PORTS.logging }, ui: { enabled: false }, singleProjectMode: true } }, null, 2));
    const env: NodeJS.ProcessEnv = { ...process.env, JAVA_HOME, PATH: `${join(JAVA_HOME, 'bin')};${process.env.PATH}`, IA3_INNER: '1', IA3_MODE: MODE, IA3_TMP: tmp };
    for (const s of ['GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_API_KEY']) delete env[s];
    const vn = join(ROOT, 'node_modules/vite-node/vite-node.mjs');
    const interne = `"${process.execPath}" "${vn}" --root "${ROOT}" "${SELF}" -- --mode=${MODE}${args.includes('--confirm-paid-ai') ? ' --confirm-paid-ai' : ''}`;
    code = await new Promise<number>((fin) => {
      const child = spawn(process.execPath, [join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'emulators:exec', '--project', PROJECT, '--config', join(tmp, 'firebase.json'), '--only', 'auth,firestore,functions', interne], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
      const puits = (b: Buffer) => { appendFileSync(join(SORTIE, `emulateur-${MODE}.log`), b); process.stdout.write(b); };
      child.stdout.on('data', puits); child.stderr.on('data', puits);
      child.on('exit', (s) => fin(s ?? 1));
    });
  } finally {
    await sleep(1500);
    const occupes: number[] = [];
    for (const p of [...Object.values(PORTS), PORT_FOURNISSEUR, PORT_VITE]) if (await portOpen(p)) occupes.push(p);
    console.log(occupes.length ? `PORTS ENCORE OCCUPÉS : ${occupes.join(', ')}` : 'ports libérés');
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(code === 0 ? (MODE === 'simule' ? 'IA3-EMULATEUR-OK' : 'IA3-REEL-OK') : `ÉCHEC (exit ${code})`);
  process.exit(code);
}

// ============================ Le fournisseur local : simulé, ou transmis à Gemini par les garde-fous ============================
const ENVELOPPE = { appels: 30, micro: 500_000 };
const SECTION = '## Essai de bout en bout du callable hopReclasserIA, mode suggérer, sur l\'émulateur (ia3) — enveloppe séparée';
const COMPTEUR = new RegExp(`\\*\\*Compteur ia3 : (\\d+) \\/ ${ENVELOPPE.appels} · (\\d+(?:\\.\\d+)?) CHF \\/ ${ENVELOPPE.micro / 1e6}\\*\\*`);
const texteCompteur = (n: number | string, micro: number) => `**Compteur ia3 : ${n} / ${ENVELOPPE.appels} · ${(micro / 1e6).toFixed(4)} CHF / ${ENVELOPPE.micro / 1e6}**`;
const EN_TETE = [SECTION, '', `- Accord de l'utilisateur (D100) : essai réel de la voie ia3, l'IA dans Suggérer (Flash-Lite, invite \`suggerer-v1\`, 30 candidats par appel). Enveloppe : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.micro / 1e6} CHF estimés**. Arrêt au premier dépassement ou à la première erreur répétée.`,
  '- Chemin : app (?dev-local) → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue et recettes d\'essai, aucune donnée réelle du brasseur. Clé jamais journalisée. Jamais dans `npm test`.',
  '- Lanceur : `scripts/eval-hop/ia3-emulateur.ts`.', '', texteCompteur(0, 0), '',
  '| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |', '|---|---|---|---|---|---|---|---|'].join('\n');
function reserver(): number {
  return withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    if (!t.includes(SECTION)) t = `${t.replace(/\n*$/, '\n')}\n${EN_TETE}\n`;
    const c = COMPTEUR.exec(t);
    if (!c) throw new Error('Compteur ia3 illisible : aucun appel.');
    const n = Number(c[1]), micro = Math.round(Number(c[2]) * 1e6);
    if (n + 1 > ENVELOPPE.appels) throw new Error(`Enveloppe ia3 atteinte (${n} / ${ENVELOPPE.appels}) : requête refusée avant l'envoi.`);
    if (micro >= ENVELOPPE.micro) throw new Error(`Budget ia3 atteint (${(micro / 1e6).toFixed(4)} CHF) : requête refusée avant l'envoi.`);
    writeFileSync(JOURNAL, t.replace(COMPTEUR, () => texteCompteur(n + 1, micro)));
    return n + 1;
  });
}
function ligne(call: LiveCall, test: string, resultat: string) {
  withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    const c = COMPTEUR.exec(t)!;
    t = t.replace(COMPTEUR, () => texteCompteur(c[1], Math.round(Number(c[2]) * 1e6) + (call.costMicroChf ?? 0)));
    const debut = t.indexOf(SECTION), suite = t.indexOf('\n## ', debut + SECTION.length), fin = suite < 0 ? t.length : suite;
    const bloc = t.slice(debut, fin).replace(/\n*$/, '\n') + liveJournalRow(call, '#ia3', test, resultat) + '\n';
    writeFileSync(JOURNAL, t.slice(0, debut) + bloc + (suite < 0 ? '' : '\n' + t.slice(suite + 1)));
  });
}
function cleLocale(): string | undefined {
  const env = process.env.GEMINI_API_KEY?.trim();
  if (env) return env;
  const f = resolve(ROOT, 'functions/.secret.local');
  if (!existsSync(f)) return undefined;
  const l = readFileSync(f, 'utf8').split(/\r?\n/).find((x) => /^\s*GEMINI_API_KEY\s*=/.test(x));
  return l?.slice(l.indexOf('=') + 1).trim().replace(/^(["'])(.*)\1$/, '$2') || undefined;
}
function cleLocaleOuArret(): string {
  const c = cleLocale();
  if (!c) { console.error('Aucune clé Gemini locale (GEMINI_API_KEY ou functions/.secret.local) : aucun appel.'); process.exit(2); }
  return c;
}
const SANS_ACCENT = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Ce que le fournisseur retient de chaque appel, pour le rapport : les noms dans l'ordre du moteur, ceux de l'ordre de l'IA, la validité. */
interface Appel { cas: string; modele: string; ms: number; reel: boolean; candidats: number; moteur: string[]; ia: string[]; valide: boolean | null; retirees: number | null; erreurs: string[]; phrases: string[]; entreeTokens: number; sortieTokens: number | null; message: string }
interface Fournisseur { appels: Appel[]; delai: number; cas: string; erreurs: number; arret: boolean; fermer: () => void }
async function demarrerFournisseur(): Promise<Fournisseur> {
  const etat: Fournisseur = { appels: [], delai: 1500, cas: '', erreurs: 0, arret: false, fermer: () => {} };
  let reel: ReturnType<typeof guardLiveFetch> | null = null, cle: string | undefined;
  if (MODE === 'reel') {
    cle = cleLocaleOuArret();
    reel = guardLiveFetch(fetch, { cap: ENVELOPPE.appels, reserve: reserver, onCall: (call) => ligne(call, `ia3-emulateur.ts · app → callable → fournisseur local → Gemini · suggerer-v1 · ${etat.cas}`, call.error ? `échec réseau (${call.error})` : `HTTP ${call.status}, ${call.latencyMs} ms, demandé ${call.model}, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}`) });
  }
  const serveur = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const corps: Buffer[] = [];
    for await (const b of req) corps.push(b as Buffer);
    const t0 = Date.now(), modele = /\/models\/([^:/?]+):generateContent$/.exec(req.url ?? '')?.[1] ?? '?';
    const brut = Buffer.concat(corps).toString('utf8'), body = JSON.parse(brut || '{}');
    const texte: string = body.contents?.[0]?.parts?.[0]?.text ?? '';
    const lignes = [...texte.matchAll(/^(c\d{2}) · (.+) \([^()]*\) · usage/gm)].map((x) => ({ id: x[1], nom: x[2] }));
    const ids = lignes.map((l) => l.id), nomDe = (id: string) => lignes.find((l) => l.id === id)?.nom ?? id;
    let statut = 200, json: unknown;
    if (etat.arret) { statut = 503; json = { error: { code: 503, status: 'UNAVAILABLE', message: 'ia3 : arrêt (budget ou erreur répétée)' } }; }
    else if (reel) {
      try {
        const r = await reel.fetch(liveEndpoint(modele), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! }, body: brut, signal: AbortSignal.timeout(30_000) });
        statut = r.status; json = await r.json();
      } catch (e) { statut = 502; json = { error: { code: 502, status: 'UNAVAILABLE', message: (e as Error).message.slice(0, 120) } }; etat.arret = /Budget|Enveloppe/.test((e as Error).message); }
    } else {
      await sleep(etat.delai);
      // L'ordre simulé : c09 d'abord, puis l'ordre du moteur. Chaque phrase dit qu'elle est simulée, sans chiffre (la garde des valeurs chiffrées les retirerait).
      const ordre = ['c09', ...ids.filter((i) => i !== 'c09')].filter((i) => ids.includes(i));
      const sortie = JSON.stringify({ classement: ordre.map((id, i) => ({ id, phrase: `Simulé (essai local) : ${i === 0 ? 'remonté en tête, ses arômes d’agrumes sont les plus nets pour cette demande' : 'rangé dans l’ordre du moteur, sans jugement'}.` })) });
      json = { modelVersion: modele, candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: sortie }] } }],
        usageMetadata: { promptTokenCount: Math.ceil(texte.length / 3.5), candidatesTokenCount: Math.ceil(sortie.length / 3.5), totalTokenCount: Math.ceil(texte.length / 3.5) + Math.ceil(sortie.length / 3.5) } };
    }
    // Le rapport : ce que Gemini a rendu, lu par la même règle que le callable.
    const j: any = json; const sortieTexte: string | undefined = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    const a = sortieTexte ? analyserReponseSuggerer(sortieTexte, ids, texte) : null;
    let phrases: string[] = [];
    try { phrases = (JSON.parse(String(sortieTexte ?? '{}').replace(/```json|```/g, '')).classement ?? []).slice(0, 4).map((x: any) => `${nomDe(String(x.id))} : ${x.phrase}`); } catch { /* sortie illisible : la liste reste vide */ }
    if (statut !== 200 || (a && !a.valide)) etat.erreurs++;
    if (etat.erreurs >= 2 && MODE === 'reel') etat.arret = true;
    etat.appels.push({ cas: etat.cas, modele, ms: Date.now() - t0, reel: MODE === 'reel', candidats: ids.length, moteur: lignes.map((l) => l.nom), ia: a ? a.ordre.map(nomDe) : [], valide: a ? a.valide : null, retirees: a ? a.retirees.length : null, erreurs: a?.erreurs ?? (statut === 200 ? [] : [`HTTP ${statut}`]), phrases,
      entreeTokens: j?.usageMetadata?.promptTokenCount ?? Math.ceil(texte.length / 3.5), sortieTokens: j?.usageMetadata?.candidatesTokenCount ?? null, message: texte });
    void contexteDe; void chiffresInventes;
    res.writeHead(statut, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(json));
  });
  await new Promise<void>((ok) => serveur.listen(PORT_FOURNISSEUR, '127.0.0.1', ok));
  etat.fermer = () => serveur.close();
  return etat;
}

// ============================ Mode interne : Firestore semé, Vite, Chrome, parcours ============================
const SIX = ['El Dorado', 'Mosaic', 'Mandarina', 'Calypso', 'Pacific Jade', 'Idaho 7'];
const rangDe = (liste: string[], nom: string) => { const i = liste.findIndex((x) => SANS_ACCENT(x).startsWith(SANS_ACCENT(nom))); return i < 0 ? null : i + 1; };

// Les recettes d'essai (brouillons de l'app, comme m6) : sa neipa v3 (export du brasseur, allégée aux houblons), le stout, la 21C.
const CAS = [
  { nom: 'neipa v3', style: '22A', volume: 24, og: 1.081, ebc: 8, yeast: { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
    hops: [{ name: 'Lotus', alpha: 15, weightG: 78, stage: 'boil', timeMin: 20 }, { name: 'Lotus', alpha: 15, weightG: 144, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }] },
  { nom: 'stout S1', style: '16D', volume: 20, og: 1.066, ebc: 70, yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
    hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }] },
  { nom: '21C Hazy du jeudi', style: '21C', volume: 20, og: 1.058, ebc: 8, yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
    hops: [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }] },
];

async function interne() {
  const sortie = (nom: string) => join(SORTIE, `${MODE}-${nom}`);
  mkdirSync(SORTIE, { recursive: true });
  const rapport: { mode: string; etapes: Record<string, unknown>[]; erreurs: string[]; appels?: unknown } = { mode: MODE, etapes: [], erreurs: [] };
  const etape = (nom: string, d: Record<string, unknown> = {}) => { rapport.etapes.push({ nom, ...d }); console.log(`· ${nom} ${JSON.stringify(d)}`); };
  const fournisseur = await demarrerFournisseur();
  // Le budget : sans limite mensuelle choisie, `runWithMonthlyAiBudget` refuse (comme en production).
  const doc = `http://127.0.0.1:${PORTS.firestore}/v1/projects/${PROJECT}/databases/(default)/documents`;
  const sem = await fetch(`${doc}/brewerAiControls/current`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { paused: { booleanValue: false }, monthlyLimitMicroChf: { integerValue: '5000000' } } }) });
  etape('budget semé dans Firestore émulé', { statut: sem.status, limite: '5 CHF (émulateur)' });

  const viteEnv = { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_HOP_V4: 'on', VITE_IA_SUGGERER: 'on', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-ia3-key', VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`,
    VITE_FIREBASE_STORAGE_BUCKET: `${PROJECT}.appspot.com`, VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000', VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000', VITE_FIREBASE_MEASUREMENT_ID: '',
    VITE_RECAPTCHA_SITE_KEY: '', VITE_APPCHECK_DEBUG_TOKEN: '', VITE_AUTHORIZED_ACCOUNTS: USER.email };
  delete (viteEnv as NodeJS.ProcessEnv).GEMINI_API_KEY;
  const vite = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(PORT_VITE), '--strictPort'], { cwd: ROOT, env: viteEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  vite.stdout.on('data', (b) => appendFileSync(join(SORTIE, `vite-${MODE}.log`), b)); vite.stderr.on('data', (b) => appendFileSync(join(SORTIE, `vite-${MODE}.log`), b));
  const base = `http://127.0.0.1:${PORT_VITE}`;
  let browser: any, echec = false;
  try {
    for (let i = 0; i < 120; i++) { try { if ((await fetch(base)).ok) break; } catch { /* pas encore */ } await sleep(1000); }
    const puppeteer = (await import('puppeteer-core')).default;
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio', '--disable-dev-shm-usage'] });
    // Une page neuve par recette d'essai : l'app réécrit son brouillon en quittant une page, ce qui effacerait la recette posée. La connexion émulée
    // (IndexedDB) est celle du profil : elle passe d'une page à l'autre.
    const bloques: string[] = [];
    const configurer = async (p: any) => {
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await p.setRequestInterception(true);
      p.on('request', (r: any) => { const u = r.url(); if (/^(data|blob):/.test(u) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u)) r.continue(); else { bloques.push(u.slice(0, 120)); r.abort(); } });
      p.on('pageerror', (e: Error) => rapport.erreurs.push(`pageerror: ${e.message.slice(0, 200)}`));
      p.on('console', (m: any) => { if (m.type() === 'error') console.log(`console.error: ${m.text().slice(0, 240)}`); });
    };
    let page: any = await browser.newPage();
    await configurer(page);
    const photo = async (nom: string) => { await page.screenshot({ path: sortie(`${nom}.png`) }); etape(`capture ${nom}.png`); };
    const attendreSel = (sel: string, ms = 60_000) => page.waitForSelector(sel, { timeout: ms });
    const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';

    // Le code du navigateur est une chaîne : vite-node transformerait un `import()` écrit dans une fonction.
    const CONNEXION = String.raw`(async (u) => {
      const source = await (await fetch('/src/services/firebase.ts')).text();
      const m = source.match(/["'](\/node_modules\/\.vite\/deps\/firebase_auth\.js\?v=[\w-]+)["']/);
      if (!m) throw new Error('Module firebase/auth de l’app introuvable.');
      const sdk = await import(m[1]);
      const { auth, isUsingEmulators } = await import('/src/services/firebase.ts');
      if (!isUsingEmulators()) throw new Error('L’app ne vise pas les émulateurs : connexion refusée.');
      const r = await sdk.signInWithCredential(auth, sdk.GoogleAuthProvider.credential(JSON.stringify({ sub: u.sub, email: u.email, email_verified: true })));
      return r.user.uid;
    })`;
    // Les mesures dans la page : la section de la puce (le groupe rangé par l'IA), ses rangées, ses positions.
    const SECTION_JS = `(() => { const p = document.querySelector('[data-role="puce-ia"], [data-role="puce-ia-place"]'); return p ? p.closest('section') : null; })()`;
    const rangees = (): Promise<string[]> => page.evaluate(`(() => { const s = ${SECTION_JS}; return s ? [...s.querySelectorAll('[data-role="ligne-houblon"]')].map((li) => li.querySelector('[data-houblon]').getAttribute('data-houblon')) : []; })()`);
    const noms = (): Promise<string[]> => page.evaluate(`(() => { const s = ${SECTION_JS}; return s ? [...s.querySelectorAll('[data-role="ligne-houblon"] [data-houblon]')].map((e) => e.textContent) : []; })()`);
    const puceEtat = (): Promise<string | null> => page.evaluate(`document.querySelector('[data-role="puce-ia"]')?.getAttribute('data-ia') ?? null`);
    const place = (): Promise<boolean> => page.evaluate(`!!document.querySelector('[data-role="puce-ia-place"]')`);
    const attendrePuce = async (voulu: string, ms: number) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const e = await puceEtat(); if (e === voulu || (voulu === '*' && e !== null)) return Date.now() - t0; await sleep(100); } return -1; };
    const positions = (): Promise<Record<string, number | null>> => page.evaluate(`(() => { const s = ${SECTION_JS}; if (!s) return null; const y = (e) => (e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null);
      return { titre: y(s.querySelector('h3')), premiereRangee: y(s.querySelector('li')), groupeBas: Math.round(s.getBoundingClientRect().bottom + window.scrollY), levure: y(document.querySelector('[data-groupe="levure"]')), hauteurGroupe: Math.round(s.getBoundingClientRect().height), page: document.documentElement.scrollHeight }; })()`);
    const defiler = async (dy = -90) => { await page.evaluate(`(() => { const s = ${SECTION_JS}; if (s) window.scrollTo(0, Math.max(0, s.getBoundingClientRect().top + window.scrollY + (${dy}))); })()`); await sleep(350); };
    const poserVisee = (v: Record<string, number> | null) => page.evaluate(`(async () => { const V = await import('/src/ui/hopIndex/parcours/visee.ts'); V.poserVisee(${JSON.stringify(v)}); })()`);
    const taille = (sel: string): Promise<number | null> => page.evaluate(`(() => { const e = document.querySelector('${sel}'); return e ? parseFloat(getComputedStyle(e).fontSize) : null; })()`);

    // Le brouillon d'un cas, comme m6 : un premier passage crée le stockage, puis la recette d'essai y est posée et l'écran rechargé.
    await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'domcontentloaded' });
    await attendreSel('[data-ecran="ma-biere"]', 180_000); await sleep(1500);
    await page.click('[data-role="dose-plus"]'); await sleep(1500);
    const brouillonBase: string = await page.evaluate(`localStorage.getItem(${JSON.stringify(CLE)})`);
    let premierCas = true;
    const ouvrirCas = async (c: typeof CAS[number]) => {
      const e = JSON.parse(brouillonBase);
      for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: c.nom, style: c.style, hops: c.hops, ogTarget: c.og, colorEbc: c.ebc });
      e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-IA3';
      if (!premierCas) { const ancienne = page; page = await browser.newPage(); await configurer(page); await ancienne.close(); }
      premierCas = false;
      // Posé avant tout script de l'app : rien ne peut l'écraser.
      await page.evaluateOnNewDocument((cle: string, v: string) => { localStorage.setItem(cle, v); }, CLE.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
      await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'domcontentloaded' });
      await attendreSel('[data-role="ligne-houblon"]', 120_000); await sleep(1500);
      const verifie: { ibu: string | null; nom: string | null } = await page.evaluate(`({ ibu: document.querySelector('[data-ecran="ma-biere"]')?.textContent?.slice(0, 60) ?? null, nom: document.body.innerText.slice(0, 0) })`);
      etape(`recette posée : ${c.nom}`, { style: c.style, ma_biere: verifie.ibu });
    };
    const ouvrirSuggerer = async (v: Record<string, number>) => {
      await poserVisee(v); await sleep(500);
      await page.evaluate(`window.__hopPile.open({ view: 'hopSuggest' })`);
      await attendreSel('[data-ecran="suggerer"] [data-groupe]:not([data-groupe="levure"]) li', 120_000); await sleep(800);
    };

    await ouvrirCas(CAS[0]);
    const uid: string = await page.evaluate(`${CONNEXION}(${JSON.stringify(USER)})`);
    etape('connexion émulée (Auth)', { uid: uid.slice(0, 6) + '…' });

    // ---------- Chauffe : le premier appel tombe sur une fonction froide (émulateur : démarrage du worker, plusieurs secondes). Une visée de plus,
    // qui a un groupe à ranger, le chauffe ; la mesure de la réponse rapide (moins de 3 s) se fait ensuite, comme i2, sur la fonction chaude. ----------
    fournisseur.cas = 'neipa v3 · chauffe de la fonction (visée à part)'; fournisseur.delai = 300;
    await ouvrirSuggerer({ tropical: 2.5 });
    let chauffe: Record<string, number | string> = { visee: 'aucune visée de chauffe n\'a de groupe à ranger' };
    for (const v of [{ tropical: 2.5 }, { floral: 2.5 }, { resin: 2.5 }]) {
      await poserVisee(v); await sleep(2000);
      if ((await place()) || (await puceEtat())) { chauffe = { visee: JSON.stringify(v), msJusquALaPuce: await attendrePuce('*', 60_000) }; break; }
    }
    etape('chauffe de la fonction (appel froid, hors mesure)', chauffe);
    // ---------- A. neipa v3, « plus d'agrumes » : l'ouverture, la puce, l'ordre appliqué, la phrase, la puce touchée ----------
    fournisseur.cas = 'neipa v3 · agrumes · dry hop actif'; fournisseur.delai = 2000;
    const tDemande = Date.now();
    await poserVisee({ citrus: 2.5 }); await sleep(250);
    await page.evaluate(`window.scrollTo(0, 0)`);
    const rangeesMoteur = await rangees(); const nomsMoteur = await noms();
    const placeOuverture = await place(), puceOuverture = await puceEtat();
    const p0 = await positions(); await defiler(); await photo('1-ouverture-liste-du-moteur');
    etape('ouverture : le moteur, sans puce, place tenue', { rangees: nomsMoteur, puce: puceOuverture, placeInvisible: placeOuverture, positions: p0 });
    const t0 = tDemande; const ms = await attendrePuce('*', MODE === 'reel' ? 40_000 : 15_000);
    const etatArrivee = await puceEtat(); await sleep(500);
    const p1 = await positions(); let nomsIA = await noms(); let rangeesIA = await rangees();
    // Réel : si Gemini a répondu après la fenêtre de 3 s, l'ordre attend ; un toucher sur la puce l'applique (c'est le comportement voulu).
    if (MODE === 'reel' && etatArrivee === 'prete') { await page.evaluate(`document.querySelector('[data-role="puce-ia"]').click()`); await sleep(500); nomsIA = await noms(); rangeesIA = await rangees(); }
    const decalage = p0 && p1 ? { titre: (p1.titre ?? 0) - (p0.titre ?? 0), premiereRangee: (p1.premiereRangee ?? 0) - (p0.premiereRangee ?? 0), levure: (p1.levure ?? 0) - (p0.levure ?? 0), hauteurGroupe: (p1.hauteurGroupe ?? 0) - (p0.hauteurGroupe ?? 0) } : null;
    etape('réponse de l’IA', { msJusquALaPuce: ms, depuisOuvertureMs: Date.now() - t0, etatALArrivee: etatArrivee, rangees: nomsIA, decalagePx: decalage });
    await defiler(); await photo('2-puce-ia');
    await defiler(-200); await photo('3-ordre-ia-applique');
    const taillePuce = await taille('[data-role="puce-ia"]');
    // un toucher sur une rangée : la phrase de l'IA
    await page.evaluate(`(() => { const s = ${SECTION_JS}; s.querySelector('[data-role="ligne-houblon"]').click(); })()`); await sleep(400);
    const phrase: string | null = await page.evaluate(`document.querySelector('[data-role="phrase-ia"]')?.textContent ?? null`);
    const taillePhrase = await taille('[data-role="phrase-ia"]');
    await defiler(-120); await photo('4-phrase-au-toucher');
    etape('phrase de l’IA au toucher d’une rangée', { phrase, taillePxPhrase: taillePhrase, taillePxPuce: taillePuce });
    // un toucher sur la puce : l'ordre du moteur
    await page.evaluate(`document.querySelector('[data-role="puce-ia"]').click()`); await sleep(500);
    const apresToucher = await rangees(); const etatApres = await puceEtat();
    await defiler(); await photo('5-puce-touchee-ordre-du-moteur');
    etape('puce touchée : l’ordre du moteur rendu', { identique: JSON.stringify(apresToucher) === JSON.stringify(rangeesMoteur), puce: etatApres });
    const budget1 = await (await fetch(`${doc}/brewerAiCosts`, { headers: { Authorization: 'Bearer owner' } })).json().catch(() => null);
    etape('budget mensuel après les appels (Firestore émulé)', { documents: (budget1?.documents ?? []).map((d: any) => ({ nom: String(d.name).split('/').pop(), champs: Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]: [string, any]) => [k, v.integerValue ?? v.stringValue ?? v.doubleValue])) })) });

    let tardiveOk = true, horsLigneOk = true;
    if (MODE === 'simule') {
      // ---------- B. réponse tardive (3,6 s) : la liste ne bouge pas, « appliquer l'ordre IA » ----------
      fournisseur.cas = 'neipa v3 · tropicaux · réponse tardive'; fournisseur.delai = 3600;
      // une visée qui a un groupe à ranger et qu'on n'a pas encore demandée
      for (const v of [{ citrus: 2.5, tropical: 2.5 }, { citrus: 2.5, floral: 2.5 }, { tropical: 2.5, floral: 2.5 }, { citrus: 2.5, resin: 2.5 }]) { await poserVisee(v); await sleep(900); if ((await place()) && !(await puceEtat())) break; }
      await page.evaluate(`window.scrollTo(0, 0)`); await sleep(300);
      const avantT = await rangees(); const msT = await attendrePuce('prete', 15_000); await sleep(300);
      const apresT = await rangees();
      tardiveOk = msT >= 0 && JSON.stringify(avantT) === JSON.stringify(apresT);
      etape('réponse tardive : la liste ne bouge pas, la puce offre l’ordre', { msAvantPuce: msT, identique: JSON.stringify(avantT) === JSON.stringify(apresT), puce: await puceEtat() });
      await defiler(); await photo('6-reponse-tardive-ordre-ia-pret');
      await page.evaluate(`document.querySelector('[data-role="puce-ia"]').click()`); await sleep(500); await defiler(); await photo('6b-tardive-ordre-applique');
      // ---------- C. hors ligne : aucun appel, aucune puce, aucun message ----------
      const avantHL = fournisseur.appels.length;
      await page.evaluate(`Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true })`);
      await poserVisee({ citrus: 1.5 }); await sleep(2500);
      const puceHL = await puceEtat(), placeHL = await place();
      horsLigneOk = fournisseur.appels.length === avantHL && puceHL === null && !placeHL;
      await page.evaluate(`window.scrollTo(0, 0)`); await sleep(300);
      await page.evaluate(`(() => { const e = document.querySelector('[data-groupe]:not([data-groupe="levure"])'); if (e) window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 80)); })()`); await sleep(300);
      await photo('7-hors-ligne-ordre-du-moteur');
      etape('hors ligne : aucun appel, aucune puce', { appelsAvant: avantHL, appelsApres: fournisseur.appels.length, puce: puceHL, placeInvisible: placeHL, messageVisible: await page.evaluate(`/hors ligne|erreur|échec/i.test(document.body.innerText)`) });
    } else {
      // ---------- Réel : le cas tropicaux de sa neipa v3, puis le stout S1 et la 21C ----------
      fournisseur.cas = 'neipa v3 · tropicaux · dry hop actif'; await poserVisee({ tropical: 2.5 }); await attendrePuce('*', 40_000); await sleep(600); await defiler(); await photo('8-neipa-tropicaux');
      for (const [i, c] of CAS.slice(1).entries()) {
        if (fournisseur.arret) break;
        fournisseur.cas = `${c.nom} · ${c.style === '16D' ? 'plus floral' : 'plus d’agrumes'}`;
        await ouvrirCas(c); await ouvrirSuggerer(c.style === '16D' ? { floral: 2.5 } : { citrus: 2.5 });
        const m = await attendrePuce('*', 40_000); await sleep(500); await defiler(); await photo(`${9 + i}-${c.nom.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`);
        etape(`réel : ${c.nom}`, { bandeau: await page.evaluate(`document.querySelector('[data-element="q2b-bandeau-ibu"]')?.textContent ?? null`), msJusquALaPuce: m, puce: await puceEtat(), rangees: await noms() });
      }
    }
    // ---------- Le rapport : les rangs de ses six, l'ordre IA contre l'ordre du moteur ----------
    const neipa = fournisseur.appels.filter((a) => a.cas.startsWith('neipa v3'));
    etape('rangs de ses six dans le pool (moteur) et dans l’ordre IA', { parAppel: neipa.map((a) => ({ cas: a.cas, candidats: a.candidats, six: SIX.map((n) => ({ houblon: n, moteur: rangDe(a.moteur, n), ia: rangDe(a.ia, n) })) })) });
    etape('requêtes reçues par le fournisseur', { n: fournisseur.appels.length, detail: fournisseur.appels.map((a) => ({ cas: a.cas, ms: a.ms, candidats: a.candidats, valide: a.valide, retirees: a.retirees, erreurs: a.erreurs, entreeTokens: a.entreeTokens, sortieTokens: a.sortieTokens, moteurTete: a.moteur.slice(0, 6), iaTete: a.ia.slice(0, 6), phrases: a.phrases })) });
    etape('hôtes bloqués par le banc', { n: bloques.length, exemples: bloques.slice(0, 3) });
    rapport.appels = fournisseur.appels.map((a) => ({ ...a, message: undefined }));
    writeFileSync(sortie('message-exemple.txt'), fournisseur.appels[0]?.message ?? '');
    const pas0 = decalage ? Math.abs(decalage.titre) + Math.abs(decalage.premiereRangee) + Math.abs(decalage.levure) + Math.abs(decalage.hauteurGroupe) : -1;
    etape('décalage à l’arrivée de l’ordre IA (px, 390 × 844)', { ...(decalage ?? {}), total: pas0 });
    if (MODE === 'simule' && (puceOuverture !== null || !placeOuverture || ms < 0 || etatArrivee !== 'appliquee' || !phrase || JSON.stringify(apresToucher) !== JSON.stringify(rangeesMoteur) || etatApres !== 'prete' || JSON.stringify(rangeesIA) === JSON.stringify(rangeesMoteur) || !tardiveOk || !horsLigneOk || (taillePhrase ?? 0) < 14 || (taillePuce ?? 0) < 12 || fournisseur.appels.some((a) => !a.valide))) echec = true;
    if (MODE === 'reel' && (ms < 0 || !phrase)) echec = true;
  } catch (e) {
    echec = true; rapport.erreurs.push(`banc: ${(e as Error).stack?.slice(0, 600)}`); console.error(e);
  } finally {
    rapport.appels ??= fournisseur.appels.map((a) => ({ ...a, message: undefined }));
    console.log(`requêtes reçues par le fournisseur : ${fournisseur.appels.length}`);
    writeFileSync(join(SORTIE, `rapport-${MODE}.json`), JSON.stringify(rapport, null, 1) + '\n');
    await browser?.close().catch(() => {});
    vite.kill(); fournisseur.fermer();
  }
  console.log(rapport.erreurs.length ? `erreurs de page : ${rapport.erreurs.slice(0, 4).join(' | ')}` : 'aucune erreur de page');
  process.exit(echec ? 1 : 0);
}

if (process.env.IA3_INNER === '1') await interne(); else await externe();
