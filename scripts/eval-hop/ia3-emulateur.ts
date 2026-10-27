// Voie ia3, mise à jour par ia5 (D132) : l'IA de Suggérer À LA DEMANDE (un toucher sur la puce), invite `suggerer-v2`, modèle 3.8 Flash choisi par le serveur.
// Le callable `hopReclasserIA` (mode « suggerer ») dans l'émulateur des fonctions, appelé par l'app en `?dev-local` (Vite dev, Chrome 390 × 844).
// Simulé : le fournisseur cite la fiche (mots du houblon), répond une liste fixe, ou 503 (l'échec). Réel : 3 appels au plus (accord D130), section « ia5 » du journal.
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
import { analyserReponseSuggerer, contexteDe, chiffresInventes, motsDeLigne } from '../../functions/src/hopReclassCore';

const ICI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(ICI, '../..');
const SELF = fileURLToPath(import.meta.url);
const SORTIE = resolve(ROOT, 'work/missions/2026-10-25-integration-houblons/voies/ia5-ia-a-la-demande/img');
const PROJECT = 'demo-ia5';
const USER = { sub: 'brasseur-demo-ia5', email: 'brasseur@demo-ia5.test' };
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
  if (MODE === 'reel') requirePaidAiTestOptIn({ label: 'Gemini réel · ia5 · callable hopReclasserIA, mode suggérer, sur émulateur', command: 'npx vite-node scripts/eval-hop/ia3-emulateur.ts -- --mode=reel --confirm-paid-ai' });
  for (const p of [...Object.values(PORTS), PORT_FOURNISSEUR, PORT_VITE]) if (await portOpen(p)) throw new Error(`Port ${p} déjà occupé : rien n'est lancé.`);
  mkdirSync(SORTIE, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'affinee-ia5-emu-'));
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
  console.log(code === 0 ? (MODE === 'simule' ? 'IA5-EMULATEUR-OK' : 'IA5-REEL-OK') : `ÉCHEC (exit ${code})`);
  process.exit(code);
}

// ============================ Le fournisseur local : simulé, ou transmis à Gemini par les garde-fous ============================
const ENVELOPPE = { appels: 3, micro: 300_000 };
const SECTION = '## Petit essai réel du callable hopReclasserIA, mode suggérer, Gemini 3.8 Flash à la demande, sur l\'émulateur (ia5) — enveloppe D130';
const COMPTEUR = new RegExp(`\\*\\*Compteur ia5 : (\\d+) \\/ ${ENVELOPPE.appels} · (\\d+(?:\\.\\d+)?) CHF \\/ ${ENVELOPPE.micro / 1e6}\\*\\*`);
const texteCompteur = (n: number | string, micro: number) => `**Compteur ia5 : ${n} / ${ENVELOPPE.appels} · ${(micro / 1e6).toFixed(4)} CHF / ${ENVELOPPE.micro / 1e6}**`;
const EN_TETE = [SECTION, '', `- Accord de l'utilisateur (D130, il restait 6,27 CHF) : petit essai réel de la voie ia5, l'IA de Suggérer à la demande (gemini-3.8-flash, réflexion basse, invite \`suggerer-v2\`, 3 à 12 candidats par appel). Enveloppe : **${ENVELOPPE.appels} appels au plus, ${ENVELOPPE.micro / 1e6} CHF estimés**. Arrêt au premier dépassement ou à la première erreur répétée.`,
  '- Chemin : app (?dev-local) → toucher sur la puce → callable `hopReclasserIA` (émulateur des fonctions) → fournisseur local → garde-fous de `scripts/gemini38LiveCore.ts` → Gemini. Données : fiches du catalogue et recettes d\'essai, aucune donnée réelle du brasseur. Clé jamais journalisée. Jamais dans `npm test`.',
  '- Lanceur : `scripts/eval-hop/ia3-emulateur.ts` (mis à jour par ia5).', '', texteCompteur(0, 0), '',
  '| # | Heure | Issue | Test | Modèle observé | Tokens entrée / sortie | Coût estimé | Résultat |', '|---|---|---|---|---|---|---|---|'].join('\n');
function reserver(): number {
  return withJournalLock(VERROU, () => {
    let t = readFileSync(JOURNAL, 'utf8');
    if (!t.includes(SECTION)) t = `${t.replace(/\n*$/, '\n')}\n${EN_TETE}\n`;
    const c = COMPTEUR.exec(t);
    if (!c) throw new Error('Compteur ia5 illisible : aucun appel.');
    const n = Number(c[1]), micro = Math.round(Number(c[2]) * 1e6);
    if (n + 1 > ENVELOPPE.appels) throw new Error(`Enveloppe ia5 atteinte (${n} / ${ENVELOPPE.appels}) : requête refusée avant l'envoi.`);
    if (micro >= ENVELOPPE.micro) throw new Error(`Budget ia5 atteint (${(micro / 1e6).toFixed(4)} CHF) : requête refusée avant l'envoi.`);
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
    const bloc = t.slice(debut, fin).replace(/\n*$/, '\n') + liveJournalRow(call, '#ia5', test, resultat) + '\n';
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
interface Fournisseur { appels: Appel[]; delai: number; cas: string; erreurs: number; arret: boolean; /** Simulé seulement : le fournisseur répond 503 (l'échec de l'écran). */ panne: boolean; fermer: () => void }
async function demarrerFournisseur(): Promise<Fournisseur> {
  const etat: Fournisseur = { appels: [], delai: 1500, cas: '', erreurs: 0, arret: false, panne: false, fermer: () => {} };
  let reel: ReturnType<typeof guardLiveFetch> | null = null, cle: string | undefined;
  if (MODE === 'reel') {
    cle = cleLocaleOuArret();
    reel = guardLiveFetch(fetch, { cap: ENVELOPPE.appels, reserve: reserver, onCall: (call) => ligne(call, `ia3-emulateur.ts · ia5 · toucher → callable → fournisseur local → Gemini · suggerer-v2 · ${etat.cas}`, call.error ? `échec réseau (${call.error})` : `HTTP ${call.status}, ${call.latencyMs} ms, demandé ${call.model}, réflexion ${call.thinkingLevel ?? 'non fournie'}, fin ${call.finishReason ?? 'non fournie'}`) });
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
    if (etat.arret) { statut = 503; json = { error: { code: 503, status: 'UNAVAILABLE', message: 'ia5 : arrêt (budget ou erreur répétée)' } }; }
    else if (etat.panne && !reel) { statut = 503; json = { error: { code: 503, status: 'UNAVAILABLE', message: 'ia5 : panne simulée' } }; }
    else if (reel) {
      try {
        const r = await reel.fetch(liveEndpoint(modele), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! }, body: brut, signal: AbortSignal.timeout(30_000) });
        statut = r.status; json = await r.json();
      } catch (e) { statut = 502; json = { error: { code: 502, status: 'UNAVAILABLE', message: (e as Error).message.slice(0, 120) } }; etat.arret = /Budget|Enveloppe/.test((e as Error).message); }
    } else {
      await sleep(etat.delai);
      // L'ordre simulé : c09 d'abord, puis l'ordre du moteur. Chaque phrase dit qu'elle est simulée et CITE la fiche : les mots du houblon lus dans sa ligne du message
      // (jamais un arôme hors fiche, ni un chiffre : les gardes du serveur les retireraient).
      const ordre = ['c09', ...ids.filter((i) => i !== 'c09')].filter((i) => ids.includes(i));
      const sortie = JSON.stringify({ classement: ordre.map((id, i) => { const mots = motsDeLigne(texte, id).slice(0, 3); return { id, phrase: `Simulé (essai local) : ${nomDe(id)}${mots.length ? `, fiche : ${mots.join(', ')}` : ''}${i === 0 ? ' ; remonté en tête pour cette demande' : ' ; gardé dans l’ordre du moteur'}.` }; }) });
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

  const viteEnv = { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true', VITE_HOP_V4: 'on', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-ia3-key', VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT}.firebaseapp.com`,
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
      e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-IA5';
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

    // Voie ia5 : l'IA est À LA DEMANDE. Rien ne part à l'ouverture ; un toucher sur la puce fait l'appel. Mesures de la puce : sa boîte (x, y, largeur, hauteur) au repos,
    // en attente, à l'arrivée ; elle ne doit pas bouger (0 px).
    const boite = (): Promise<{ x: number; y: number; w: number; h: number } | null> => page.evaluate(`(() => { const e = document.querySelector('[data-role="puce-ia"]'); if (!e) return null; const r = e.getBoundingClientRect(); const a = (v) => Math.round(v * 10) / 10; return { x: a(r.left), y: a(r.top + window.scrollY), w: a(r.width), h: a(r.height) }; })()`);
    const puceTexte = (): Promise<string | null> => page.evaluate(`document.querySelector('[data-role="puce-ia"]')?.textContent ?? null`);
    const toucherPuce = (fois = 1) => page.evaluate(`(() => { const b = document.querySelector('[data-role="puce-ia"]'); for (let i = 0; i < ${fois}; i++) b.click(); })()`);
    const ecart = (...bs: ({ x: number; y: number; w: number; h: number } | null)[]) => { const v = bs.filter((b) => b !== null) as { x: number; y: number; w: number; h: number }[]; return v.length < 2 ? -1 : Math.max(...(['x', 'y', 'w', 'h'] as const).map((k) => Math.max(...v.map((b) => b[k])) - Math.min(...v.map((b) => b[k])))); };
    const verdicts: Record<string, boolean> = {};

    // ---------- Chauffe (simulé seulement) : le premier appel tombe sur une fonction froide (émulateur : démarrage du worker, plusieurs secondes). Une visée à part, un toucher. ----------
    if (MODE === 'simule') {
      fournisseur.cas = 'neipa v3 · chauffe de la fonction (visée à part)'; fournisseur.delai = 300;
      await ouvrirSuggerer({ tropical: 2.5 });
      let chauffe: Record<string, number | string> = { visee: 'aucune visée de chauffe n\'a de groupe à ranger' };
      for (const v of [{ tropical: 2.5 }, { floral: 2.5 }, { resin: 2.5 }]) {
        await poserVisee(v); await sleep(2000);
        if ((await puceEtat()) === 'repos') { await toucherPuce(); chauffe = { visee: JSON.stringify(v), msJusquALaPuce: await attendrePuce('appliquee', 60_000) }; break; }
      }
      etape('chauffe de la fonction (appel froid, hors mesure)', chauffe);
    } else await ouvrirSuggerer({ citrus: 2.5 });
    const appelsChauffe = fournisseur.appels.length;

    // ---------- A. neipa v3, « plus d'agrumes » : le repos, l'attente, l'ordre appliqué, la phrase, le retour au moteur ----------
    fournisseur.cas = 'neipa v3 · agrumes · dry hop actif'; fournisseur.delai = 2000;
    await poserVisee({ citrus: 2.5 }); await sleep(250);
    await page.evaluate(`window.scrollTo(0, 0)`);
    const msRepos = await attendrePuce('repos', 20_000); await sleep(5000);
    verdicts['aucun appel à l’ouverture ni au repos (5 s)'] = msRepos >= 0 && fournisseur.appels.length === appelsChauffe;
    const rangeesMoteur = await rangees(), nomsMoteur = await noms(), p0 = await positions(), b0 = await boite(), texte0 = await puceTexte();
    verdicts['repos : « classer par l’IA »'] = texte0 === 'classer par l’IA';
    etape('repos : le moteur, la puce « classer par l’IA », aucun appel', { rangees: nomsMoteur, puce: texte0, boite: b0, appelsPendantLeRepos: fournisseur.appels.length - appelsChauffe });
    await defiler(); await photo('1-repos-liste-du-moteur');

    const tToucher = Date.now();
    await toucherPuce(2);                                                    // un double toucher : un seul appel
    const msAttente = await attendrePuce('attente', 3000);
    const bAtt = await boite(), texteAtt = await puceTexte(), pAtt = await positions();
    verdicts['attente : « l’IA classe… » et la liste ne bouge pas'] = msAttente >= 0 && texteAtt === 'l’IA classe…' && JSON.stringify(await rangees()) === JSON.stringify(rangeesMoteur);
    etape('attente : la puce garde sa place', { texte: texteAtt, boite: bAtt, positions: pAtt });
    await defiler(); await photo('2-attente');
    const ms = await attendrePuce('appliquee', MODE === 'reel' ? 90_000 : 20_000);
    const dureeMs = Date.now() - tToucher; await sleep(500);
    const b1 = await boite(), p1 = await positions(), nomsIA = await noms(), rangeesIA = await rangees(), texte1 = await puceTexte();
    const decalPuce = ecart(b0, bAtt, b1);
    const decalage = p0 && p1 ? { titre: (p1.titre ?? 0) - (p0.titre ?? 0), premiereRangee: (p1.premiereRangee ?? 0) - (p0.premiereRangee ?? 0), levure: (p1.levure ?? 0) - (p0.levure ?? 0), hauteurGroupe: (p1.hauteurGroupe ?? 0) - (p0.hauteurGroupe ?? 0) } : null;
    const decalTotal = decalage ? Math.abs(decalage.titre) + Math.abs(decalage.premiereRangee) + Math.abs(decalage.levure) + Math.abs(decalage.hauteurGroupe) : -1;
    verdicts['un double toucher : un seul appel'] = fournisseur.appels.length - appelsChauffe === 1;
    verdicts['l’ordre arrive et s’applique : « classé par l’IA », l’ordre change'] = ms >= 0 && texte1 === 'classé par l’IA' && JSON.stringify(rangeesIA) !== JSON.stringify(rangeesMoteur);
    verdicts['la puce ne bouge pas (0 px) du repos à l’arrivée'] = decalPuce === 0 && (MODE === 'reel' || decalTotal === 0);   // réel : d'autres houblons prennent les rangées, la hauteur du groupe peut changer ; la puce, jamais
    etape('réponse de l’IA', { msJusquALaPuce: ms, depuisLeToucherMs: dureeMs, rangees: nomsIA, decalagePuceMax: decalPuce, decalagePx: decalage });
    await defiler(); await photo('3-ordre-ia-applique');
    const taillePuce = await taille('[data-role="puce-ia"]');
    // un toucher sur une rangée : la phrase de l'IA (celle de m6)
    await page.evaluate(`(() => { const s = ${SECTION_JS}; s.querySelector('[data-role="ligne-houblon"]').click(); })()`); await sleep(400);
    const phrase: string | null = await page.evaluate(`document.querySelector('[data-role="phrase-ia"]')?.textContent ?? null`);
    const taillePhrase = await taille('[data-role="phrase-ia"]');
    verdicts['la phrase au toucher d’une rangée, 14 px au moins'] = !!phrase && (taillePhrase ?? 0) >= 14 && (taillePuce ?? 0) >= 12;
    await defiler(-120); await photo('4-phrase-au-toucher');
    etape('phrase de l’IA au toucher d’une rangée', { phrase, taillePxPhrase: taillePhrase, taillePxPuce: taillePuce });
    // un toucher sur la puce : l'ordre du moteur ; un autre : l'ordre de l'IA, sans nouvel appel
    const appelsAvantBascule = fournisseur.appels.length;
    await toucherPuce(); await sleep(500);
    const apresToucher = await rangees(), etatApres = await puceEtat(), texteApres = await puceTexte();
    await defiler(); await photo('5-retour-ordre-du-moteur');
    verdicts['retour au moteur : l’ordre du moteur, « appliquer l’ordre IA »'] = JSON.stringify(apresToucher) === JSON.stringify(rangeesMoteur) && etatApres === 'prete';
    etape('puce touchée : l’ordre du moteur rendu', { identique: JSON.stringify(apresToucher) === JSON.stringify(rangeesMoteur), puce: etatApres, texte: texteApres });
    await toucherPuce(); await sleep(500);
    verdicts['un autre toucher remet l’ordre IA sans nouvel appel'] = JSON.stringify(await rangees()) === JSON.stringify(rangeesIA) && (await puceEtat()) === 'appliquee' && fournisseur.appels.length === appelsAvantBascule;
    const budget1 = await (await fetch(`${doc}/brewerAiCosts`, { headers: { Authorization: 'Bearer owner' } })).json().catch(() => null);
    etape('budget mensuel après les appels (Firestore émulé)', { documents: (budget1?.documents ?? []).map((d: any) => ({ nom: String(d.name).split('/').pop(), champs: Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]: [string, any]) => [k, v.integerValue ?? v.stringValue ?? v.doubleValue])) })) });

    if (MODE === 'simule') {
      // ---------- B. l'échec : le fournisseur répond 503 ; la puce revient au repos et dit « IA indisponible », une seule fois ----------
      fournisseur.cas = 'neipa v3 · échec simulé (503)'; fournisseur.panne = true;
      for (const v of [{ citrus: 2.5, tropical: 2.5 }, { citrus: 2.5, floral: 2.5 }, { tropical: 2.5, floral: 2.5 }, { citrus: 2.5, resin: 2.5 }]) { await poserVisee(v); await sleep(900); if ((await puceEtat()) === 'repos') break; }
      await page.evaluate(`window.scrollTo(0, 0)`); await sleep(300);
      const avantE = await rangees(), bE0 = await boite();
      await toucherPuce();
      const msE = await attendrePuce('echec', 20_000); await sleep(300);
      const texteE = await puceTexte(), bE1 = await boite(), tailleE = await taille('[data-role="puce-ia"]');
      const occurrences: number = await page.evaluate(`(document.body.innerText.match(/IA indisponible/g) ?? []).length`);
      verdicts['échec : la puce dit « IA indisponible » (12 px au moins), une seule fois, la liste reste celle du moteur, la puce ne bouge pas'] = msE >= 0 && texteE === 'IA indisponible' && (tailleE ?? 0) >= 12 && occurrences === 1 && JSON.stringify(await rangees()) === JSON.stringify(avantE) && ecart(bE0, bE1) === 0;
      etape('échec : « IA indisponible »', { msJusquAuMessage: msE, texte: texteE, tailleePx: tailleE, occurrences, boiteAvant: bE0, boiteApres: bE1 });
      await defiler(); await photo('6-echec');
      fournisseur.panne = false;
      // ---------- C. hors ligne : aucun appel, aucune puce, aucun message ----------
      const avantHL = fournisseur.appels.length;
      await page.evaluate(`Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true })`);
      await poserVisee({ citrus: 1.5 }); await sleep(2500);
      const puceHL = await puceEtat(), placeHL = await place();
      verdicts['hors ligne : aucun appel, aucune puce'] = fournisseur.appels.length === avantHL && puceHL === null && !placeHL;
      await page.evaluate(`window.scrollTo(0, 0)`); await sleep(300);
      await page.evaluate(`(() => { const e = document.querySelector('[data-groupe]:not([data-groupe="levure"])'); if (e) window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 80)); })()`); await sleep(300);
      await photo('7-hors-ligne-ordre-du-moteur');
      etape('hors ligne : aucun appel, aucune puce', { appelsAvant: avantHL, appelsApres: fournisseur.appels.length, puce: puceHL, placeInvisible: placeHL, messageVisible: await page.evaluate(`/hors ligne|erreur|échec/i.test(document.body.innerText)`) });
    } else {
      // ---------- Réel (3 appels au plus, accord D130) : 1 = agrumes (ci-dessus), 2 = tropicaux, 3 = la 21C ----------
      fournisseur.cas = 'neipa v3 · tropicaux · dry hop actif'; await poserVisee({ tropical: 2.5 }); await attendrePuce('repos', 20_000); await sleep(800);
      await toucherPuce(); const m2 = await attendrePuce('appliquee', 90_000); await sleep(600); await defiler(); await photo('8-neipa-tropicaux');
      etape('réel : neipa v3 tropicaux', { msJusquALaPuce: m2, puce: await puceEtat(), rangees: await noms() });
      if (!fournisseur.arret) {
        const c = CAS[2];
        fournisseur.cas = `${c.nom} · plus d’agrumes`;
        await ouvrirCas(c); await ouvrirSuggerer({ citrus: 2.5 }); await attendrePuce('repos', 20_000); await sleep(800);
        // Sur la 21C, la visée « agrumes » peut n'avoir aucun groupe de 3 ex æquo : pas de puce, donc pas d'appel (constaté au 27.10).
        if ((await puceEtat()) !== 'repos') { etape(`réel : ${c.nom} : pas de puce (moins de 3 ex æquo), aucun appel`, { puce: await puceEtat() }); }
        else { await toucherPuce(); }
        const m3 = (await puceEtat()) === null ? -1 : await attendrePuce('appliquee', 90_000); await sleep(500); await defiler(); await photo('9-21c-agrumes');
        etape(`réel : ${c.nom}`, { msJusquALaPuce: m3, puce: await puceEtat(), rangees: await noms() });
      }
    }
    // ---------- Le rapport : les rangs de ses six, l'ordre IA contre l'ordre du moteur ----------
    const neipa = fournisseur.appels.filter((a) => a.cas.startsWith('neipa v3'));
    etape('rangs de ses six dans le pool (moteur) et dans l’ordre IA', { parAppel: neipa.map((a) => ({ cas: a.cas, candidats: a.candidats, six: SIX.map((n) => ({ houblon: n, moteur: rangDe(a.moteur, n), ia: rangDe(a.ia, n) })) })) });
    etape('requêtes reçues par le fournisseur', { n: fournisseur.appels.length, detail: fournisseur.appels.map((a) => ({ cas: a.cas, modele: a.modele, ms: a.ms, candidats: a.candidats, valide: a.valide, retirees: a.retirees, erreurs: a.erreurs, entreeTokens: a.entreeTokens, sortieTokens: a.sortieTokens, moteurTete: a.moteur.slice(0, 6), iaTete: a.ia.slice(0, 6), phrases: a.phrases })) });
    etape('hôtes bloqués par le banc', { n: bloques.length, exemples: bloques.slice(0, 3) });
    rapport.appels = fournisseur.appels.map((a) => ({ ...a, message: undefined }));
    writeFileSync(sortie('message-exemple.txt'), fournisseur.appels[0]?.message ?? '');
    if (MODE === 'reel') { verdicts['réel : au plus 3 appels'] = fournisseur.appels.length <= 3; verdicts['réel : ordre reçu et phrase'] = ms >= 0 && !!phrase; }
    else verdicts['aucune réponse invalide du fournisseur simulé'] = !fournisseur.appels.some((a) => a.valide === false);
    etape('verdicts', verdicts);
    const rates = Object.entries(verdicts).filter(([, v]) => !v).map(([k]) => k);
    if (rates.length) { echec = true; rapport.erreurs.push(`verdicts en échec : ${rates.join(' | ')}`); }
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
