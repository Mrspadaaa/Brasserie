// Voie i2 : le callable `hopReclasserIA` dans l'émulateur des fonctions, appelé par l'app en `?dev-local` (Vite dev, Chrome 390 × 844).
//
//   npx vite-node work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/emulateur/emulateur.ts -- --mode=simule
//   npx vite-node work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/emulateur/emulateur.ts -- --mode=reel --confirm-paid-ai
//
// Ce qui tourne : les émulateurs Auth, Firestore et Functions (projet démo `demo-i2`, jamais les données réelles), le callable compilé
// dans un dossier temporaire (jamais le functions/lib du dépôt), un « fournisseur » local sur 127.0.0.1:5199 qui tient la place de
// l'API Gemini (l'émulateur seul peut détourner l'adresse : HOP_RECLASS_ENDPOINT_EMULATEUR, ignorée hors émulateur), Vite en dev, Chrome.
//  - simule : le fournisseur répond une liste fixe marquée « Simulé » ; aucun réseau, aucun coût.
//  - reel   : le fournisseur transmet la requête du callable à Gemini par les garde-fous de scripts/gemini38LiveCore.ts (hôte et modèle de
//             la liste blanche, ligne de journal par appel parti, compteur réservé avant l'envoi : 3 appels au plus, section « i2 » de
//             gemini-journal.md). La clé n'est lue que dans functions/.secret.local ou GEMINI_API_KEY, ici seulement : elle n'est jamais
//             transmise aux émulateurs ni écrite. functions/.env n'est jamais lu.
import { spawn, spawnSync } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardLiveFetch, liveEndpoint, liveJournalRow, withJournalLock, type LiveCall } from '../../../../../../scripts/gemini38LiveCore';
import { requirePaidAiTestOptIn } from '../../../../../../scripts/paid-ai-test-guard.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../../../../../..');
const SELF = fileURLToPath(import.meta.url);
const SORTIE = resolve(ICI, '..', 'img');
const PROJECT = 'demo-i2';
const USER = { sub: 'brasseur-demo-i2', email: 'brasseur@demo-i2.test' };
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
  if (MODE === 'reel') requirePaidAiTestOptIn({ label: 'Gemini réel · i2 · callable hopReclasserIA sur émulateur', command: 'npx vite-node …/emulateur.ts -- --mode=reel --confirm-paid-ai' });
  for (const p of [...Object.values(PORTS), PORT_FOURNISSEUR, PORT_VITE]) if (await portOpen(p)) throw new Error(`Port ${p} déjà occupé : rien n'est lancé.`);
  mkdirSync(SORTIE, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'affinee-i2-emu-'));
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
    // Une clé factice dans le .secret.local du dossier TEMPORAIRE : l'émulateur n'ira pas la chercher dans Secret Manager (403 et délai). Le vrai appel n'en a pas besoin : le fournisseur local met la sienne.
    writeFileSync(join(cible, '.secret.local'), 'GEMINI_API_KEY=cle-factice-emulateur\n');
    writeFileSync(join(tmp, 'firestore.rules'), "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }\n");
    writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({ firestore: { rules: 'firestore.rules' }, functions: [{ source: 'functions', codebase: 'default' }],
      emulators: { auth: { port: PORTS.auth }, firestore: { port: PORTS.firestore }, functions: { port: PORTS.functions }, hub: { port: PORTS.hub }, logging: { port: PORTS.logging }, ui: { enabled: false }, singleProjectMode: true } }, null, 2));
    const env: NodeJS.ProcessEnv = { ...process.env, JAVA_HOME, PATH: `${join(JAVA_HOME, 'bin')};${process.env.PATH}`, I2_INNER: '1', I2_MODE: MODE, I2_TMP: tmp };
    // Aucune clé dans l'environnement des émulateurs : le fournisseur local la lit lui-même, ailleurs.
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
  console.log(code === 0 ? 'I2-EMULATEUR-OK' : `ÉCHEC (exit ${code})`);
  process.exit(code);
}

// ============================ Le fournisseur local : simulé, ou transmis à Gemini par les garde-fous ============================
const ENVELOPPE = { appels: 3, micro: 50_000 };
const SECTION = '## Essai de bout en bout du callable hopReclasserIA sur l\'émulateur (i2, #181) — enveloppe séparée';
const COMPTEUR = new RegExp(`\\*\\*Compteur i2 : (\\d+) \\/ ${ENVELOPPE.appels} · (\\d+(?:\\.\\d+)?) CHF \\/ ${ENVELOPPE.micro / 1e6}\\*\\*`);
const texteCompteur = (n: number | string, micro: number) => `**Compteur i2 : ${n} / ${ENVELOPPE.appels} · ${(micro / 1e6).toFixed(4)} CHF / ${ENVELOPPE.micro / 1e6}**`;
const EN_TETE = [SECTION, '', `- Accord du brasseur (D80, 26.10) : Gemini facturé en production pour l'IA de Substituer, environ 0,003 CHF par recherche, Flash-Lite. Enveloppe de cet essai : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.micro / 1e6} CHF estimés**.`,
  '- Chemin : app (?dev-local) → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue, aucune donnée du brasseur. Clé jamais journalisée. Jamais dans `npm test`.',
  '- Lanceur : `work/missions/2026-10-25-integration-houblons/voies/i2-ia-substituer/emulateur/emulateur.ts`.', '', texteCompteur(0, 0), '',
  '| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |', '|---|---|---|---|---|---|---|---|'].join('\n');
function reserver(): number {
  return withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    if (!t.includes(SECTION)) t = `${t.replace(/\n*$/, '\n')}\n${EN_TETE}\n`;
    const c = COMPTEUR.exec(t);
    if (!c) throw new Error('Compteur i2 illisible : aucun appel.');
    const n = Number(c[1]), micro = Math.round(Number(c[2]) * 1e6);
    if (n + 1 > ENVELOPPE.appels) throw new Error(`Enveloppe i2 atteinte (${n} / ${ENVELOPPE.appels}) : requête refusée avant l'envoi.`);
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
    const bloc = t.slice(debut, fin).replace(/\n*$/, '\n') + liveJournalRow(call, '#181 (i2)', test, resultat) + '\n';
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
interface Fournisseur { demandes: { modele: string; ms: number; cle: string; entreeTokens: number; sortie: string; reel: boolean }[]; delai: number; fermer: () => void }
async function demarrerFournisseur(): Promise<Fournisseur> {
  const etat: Fournisseur = { demandes: [], delai: 1500, fermer: () => {} };
  let reel: ReturnType<typeof guardLiveFetch> | null = null, cle: string | undefined;
  if (MODE === 'reel') {
    cle = cleLocaleOuArret();
    reel = guardLiveFetch(fetch, { cap: ENVELOPPE.appels, reserve: reserver, onCall: (call) => ligne(call, 'emulateur.ts · app → callable → fournisseur local → Gemini · invite v1', call.error ? `échec réseau (${call.error})` : `HTTP ${call.status}, ${call.latencyMs} ms, demandé ${call.model}, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}`) });
  }
  const serveur = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const corps: Buffer[] = [];
    for await (const b of req) corps.push(b as Buffer);
    const t0 = Date.now(), modele = /\/models\/([^:/?]+):generateContent$/.exec(req.url ?? '')?.[1] ?? '?';
    const brut = Buffer.concat(corps).toString('utf8'), body = JSON.parse(brut || '{}');
    const texte: string = body.contents?.[0]?.parts?.[0]?.text ?? '';
    const note = { modele, ms: 0, cle: String(req.headers['x-goog-api-key'] ?? '').slice(0, 6) + '…', entreeTokens: Math.ceil(texte.length / 3.5), sortie: '', reel: MODE === 'reel' };
    let statut = 200, json: unknown;
    if (reel) {
      try {
        const r = await reel.fetch(liveEndpoint(modele), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! }, body: brut, signal: AbortSignal.timeout(30_000) });
        statut = r.status; json = await r.json();
      } catch (e) { statut = 502; json = { error: { code: 502, status: 'UNAVAILABLE', message: (e as Error).message.slice(0, 120) } }; }
    } else {
      await sleep(etat.delai);
      const ids = [...texte.matchAll(/^(c\d{2}) · /gm)].map((x) => x[1]);
      // L'ordre simulé : c07 d'abord, puis c03, puis l'ordre du moteur. Chaque phrase dit qu'elle est simulée.
      const ordre = ['c07', 'c03', ...ids.filter((i) => i !== 'c07' && i !== 'c03')].filter((i) => ids.includes(i)).slice(0, 10);
      const sortie = JSON.stringify({ classement: ordre.map((id, i) => ({ id, phrase: `Simulé (essai local) : ${i === 0 ? 'remonté en tête, ses mots fruités sont proches de l’original' : `rang ${i + 1} selon la liste simulée`}.` })) });
      json = { modelVersion: modele, candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: sortie }] } }],
        usageMetadata: { promptTokenCount: note.entreeTokens, candidatesTokenCount: Math.ceil(sortie.length / 3.5), totalTokenCount: note.entreeTokens + Math.ceil(sortie.length / 3.5) } };
    }
    note.ms = Date.now() - t0; note.sortie = JSON.stringify(json).slice(0, 160); etat.demandes.push(note);
    res.writeHead(statut, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(json));
  });
  await new Promise<void>((ok) => serveur.listen(PORT_FOURNISSEUR, '127.0.0.1', ok));
  etat.fermer = () => serveur.close();
  return etat;
}
function cleLocaleOuArret(): string {
  const c = cleLocale();
  if (!c) { console.error('Aucune clé Gemini locale (GEMINI_API_KEY ou functions/.secret.local) : aucun appel.'); process.exit(2); }
  return c;
}

// ============================ Mode interne : Firestore semé, Vite, Chrome, parcours ============================
async function interne() {
  const sortie = (nom: string) => join(SORTIE, `${MODE}-${nom}`);
  mkdirSync(SORTIE, { recursive: true });
  const rapport: { mode: string; etapes: Record<string, unknown>[]; erreurs: string[] } = { mode: MODE, etapes: [], erreurs: [] };
  const etape = (nom: string, d: Record<string, unknown> = {}) => { rapport.etapes.push({ nom, ...d }); console.log(`· ${nom} ${JSON.stringify(d)}`); };
  const fournisseur = await demarrerFournisseur();
  // Le budget : sans limite mensuelle choisie, `runWithMonthlyAiBudget` refuse (comme en production).
  const doc = `http://127.0.0.1:${PORTS.firestore}/v1/projects/${PROJECT}/databases/(default)/documents`;
  const sem = await fetch(`${doc}/brewerAiControls/current`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { paused: { booleanValue: false }, monthlyLimitMicroChf: { integerValue: '5000000' } } }) });
  etape('budget semé dans Firestore émulé', { statut: sem.status, limite: '5 CHF (émulateur)' });

  const viteEnv = { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_HOP_V4: 'on', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-i2-key', VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`,
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
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    const bloques: string[] = [];
    page.on('request', (r: any) => { const u = r.url(); if (/^(data|blob):/.test(u) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u)) r.continue(); else { bloques.push(u.slice(0, 120)); r.abort(); } });
    page.on('pageerror', (e: Error) => rapport.erreurs.push(`pageerror: ${e.message.slice(0, 200)}`));
    const photo = async (nom: string) => { await page.screenshot({ path: sortie(`${nom}.png`) }); etape(`capture ${nom}.png`); };
    const attendreSel = (sel: string, ms = 60_000) => page.waitForSelector(sel, { timeout: ms });

    await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'domcontentloaded' });
    await attendreSel('[data-ecran="ma-biere"]', 180_000); await sleep(1500);
    // Connexion émulée, par l'instance Firebase de l'app (graphe de modules de Vite) : le callable reçoit un vrai jeton de l'émulateur Auth.
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
    const uid: string = await page.evaluate(`${CONNEXION}(${JSON.stringify(USER)})`);
    etape('connexion émulée (Auth)', { uid: uid.slice(0, 6) + '…' });

    const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
    await attendreSel(champ, 30_000); await page.type(champ, 'Nelson Sauvin', { delay: 15 });
    const plus = '[data-role="ajout-rapide"][data-houblon-ajout="beermaverick-nelson-sauvin"] [data-role="ajout-rapide-plus"]';
    await attendreSel(plus, 30_000); await page.click(plus); await sleep(1000);

    const lignes = () => page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((e) => `${e.getAttribute('data-houblon-rang')} ${e.getAttribute('data-min')}-${e.getAttribute('data-max')}`));
    const puceEtat = () => page.evaluate(() => document.querySelector('[data-role="puce-ia"]')?.getAttribute('data-ia') ?? null);
    const attendrePuce = async (voulu: string, ms: number) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await puceEtat()) === voulu || (voulu === '*' && (await puceEtat()) !== null)) return Date.now() - t0; await sleep(100); } return -1; };

    // --- A. réponse rapide (simulé : 1,5 s ; réel : celle de Gemini), liste intacte ---
    fournisseur.delai = 1500;
    await page.evaluate((k: string) => (window as any).__hopPile.open({ view: 'hopSubstitute', hopKey: k }), 'beermaverick-nelson-sauvin');
    await attendreSel('[data-ecran="substituer"] [data-remplacant]', 90_000); await sleep(150);
    // L'ouverture : la liste du moteur, sans puce. Le premier appel tombe sur une fonction froide (émulateur : démarrage du worker).
    const puceOuverture = await puceEtat();
    await photo('1-ouverture-liste-du-moteur');
    const msA = await attendrePuce('*', 30_000);
    etape('ouverture : premier appel (fonction froide)', { puceALOuverture: puceOuverture, msJusquALaPuce: msA, puceALArrivee: await puceEtat() });
    // Un second appel, fonction chaude : le dry hop. C'est lui qui prouve la réponse rapide.
    await page.click('[data-ecran="substituer"] .pq-substituer-moments [data-moment="dryhop"]');
    const t0 = Date.now();
    await attendreSel('[data-ecran="substituer"] [data-remplacant]', 20_000); await sleep(250);
    const avant = await lignes(); const puceAvant = await puceEtat();
    await photo('2-dryhop-liste-du-moteur');
    etape('liste du moteur affichée tout de suite', { apresMs: Date.now() - t0, lignes: avant, puce: puceAvant });
    const attente = await attendrePuce('*', MODE === 'reel' ? 25_000 : 8_000);
    const etatArrivee = await puceEtat(), depuisClic = Date.now() - t0;
    await sleep(450);
    const apres = await lignes();
    etape('réponse de l’IA', { msDepuisClic: depuisClic, etatALArrivee: etatArrivee, puce: await puceEtat(), lignes: apres });
    await photo('3-dryhop-apres-ordre-ia');
    // Réel : si Gemini a répondu après la fenêtre de 3 s, l'ordre attend ; un toucher sur la puce l'applique (c'est le comportement voulu).
    if (MODE === 'reel' && (await puceEtat()) === 'prete') { await page.evaluate(() => (document.querySelector('[data-role="puce-ia"]') as HTMLElement).click()); await sleep(500); }
    // --- le toucher d'une rangée met la phrase de l'IA dans le face à face ---
    const premier = await page.evaluate(() => document.querySelector('[data-ecran="substituer"] [data-remplacant]')?.getAttribute('data-remplacant') ?? '');
    await page.evaluate((k: string) => { (document.querySelector(`[data-ecran="substituer"] [data-remplacant="${k}"]`) as HTMLElement).click(); }, premier);
    await sleep(400);
    const phrase = await page.evaluate(() => document.querySelector('[data-role="phrase-ia"]')?.textContent ?? null);
    await page.evaluate(() => document.querySelector('[data-role="phrase-ia"]')?.scrollIntoView({ block: 'center' })); await sleep(300);
    await photo('4-phrase-dans-le-face-a-face');
    etape('phrase de l’IA au toucher d’une rangée', { phrase });
    const scoresIdentiques = apres.every((l) => { const nom = l.split(' ')[0] + ' ' + l.split(' ')[1]; const a = avant.find((x: string) => x.startsWith(nom)); return !a || a.slice(nom.length) === l.slice(nom.length); });
    etape('scores inchangés (ceux du moteur)', { ok: scoresIdentiques });
    // un toucher sur la puce rend l'ordre du moteur
    await page.evaluate(() => window.scrollTo(0, 0)); await page.evaluate(() => (document.querySelector('[data-role="puce-ia"]') as HTMLElement | null)?.click()); await sleep(400);
    const rendu = await lignes();
    etape('puce touchée : ordre du moteur rendu', { identique: JSON.stringify(rendu) === JSON.stringify(avant), puce: await puceEtat() });
    await photo('5-puce-ordre-moteur-rendu');

    // --- B. réponse tardive (simulé seulement : 3,6 s) : la liste ne bouge pas, « ordre IA prêt » ---
    if (MODE === 'simule') {
      fournisseur.delai = 3600;
      await page.click('[data-ecran="substituer"] .pq-substituer-moments [data-moment="whirlpool"]');
      await sleep(600);
      const avantW = await lignes();
      const ms = await attendrePuce('prete', 10_000); await sleep(300);
      const apresW = await lignes();
      etape('réponse tardive : la liste ne bouge pas', { msAvantPuce: ms, identique: JSON.stringify(avantW) === JSON.stringify(apresW), puce: await puceEtat() });
      await page.evaluate(() => window.scrollTo(0, 0)); await photo('6-ordre-ia-pret-reponse-tardive');
    }
    const budget = await (await fetch(`${doc}/brewerAiCosts`, { headers: { Authorization: 'Bearer owner' } })).json().catch(() => null);
    etape('budget mensuel après les appels (Firestore émulé)', { documents: (budget?.documents ?? []).map((d: any) => ({ nom: String(d.name).split('/').pop(), champs: Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]: [string, any]) => [k, v.integerValue ?? v.stringValue ?? v.doubleValue])) })) });
    etape('requêtes reçues par le fournisseur', { n: fournisseur.demandes.length, detail: fournisseur.demandes });
    etape('hôtes bloqués par le banc', { n: bloques.length, exemples: bloques.slice(0, 3) });
    if (MODE === 'simule' && (puceAvant !== null || attente < 0 || etatArrivee !== 'appliquee' || phrase === null || !scoresIdentiques)) echec = true;
    if (MODE === 'reel' && (attente < 0 || phrase === null)) echec = true;
  } catch (e) {
    echec = true; rapport.erreurs.push(`banc: ${(e as Error).stack?.slice(0, 600)}`); console.error(e);
  } finally {
    writeFileSync(join(SORTIE, `rapport-${MODE}.json`), JSON.stringify(rapport, null, 1) + '\n');
    await browser?.close().catch(() => {});
    vite.kill(); fournisseur.fermer();
  }
  console.log(rapport.erreurs.length ? `erreurs de page : ${rapport.erreurs.slice(0, 4).join(' | ')}` : 'aucune erreur de page');
  process.exit(echec ? 1 : 0);
}

if (process.env.I2_INNER === '1') await interne(); else await externe();
