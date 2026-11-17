#!/usr/bin/env node
/**
 * Lot G, critère G3 (port du carnet, 17.11) : les règles Firestore laissent-elles un compte autorisé écrire un carnet ?
 *
 * Le carnet d'idées vit dans `creativeItems` (types `carnet` et `carnet-message`). MISSION.md dit « aucune règle neuve
 * attendue » ; ce script le vérifie au lieu de l'affirmer. Sur l'émulateur Firestore, avec les règles produites par
 * `scripts/build-rules.mjs` lui-même (copié dans un dossier temporaire, avec un `.env` d'essai) :
 *   - un compte autorisé crée, lit, modifie et supprime un `carnet` et un `carnet-message` (8 gestes) ;
 *   - un compte vérifié mais absent de la liste est refusé sur les 8, et rien n'est écrit ni changé.
 * Sortie attendue : `REGLES CARNET OK 16/16`.
 *
 * Rien n'est écrit dans le dépôt : ni `firestore.rules`, ni `.env`, ni `firebase.json`. Le projet est `demo-carnets`
 * (préfixe `demo-` : l'émulateur refuse tout appel réseau réel). Aucune donnée réelle, aucun Gemini.
 * Le mode `--inner` est lancé par `firebase emulators:exec`, jamais à la main.
 *
 * Usage (racine du dépôt) : node scripts/check-carnets-emulator.mjs [--port 8187]
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), '..');
const PROJECT = 'demo-carnets';
const AUTORISE = { uid: 'carnet-autorise', email: 'autorise@carnet-test.ch' };
const INTRUS = { uid: 'carnet-intrus', email: 'intrus@carnet-test.ch' };
const sha = (texte) => createHash('sha256').update(texte).digest('hex');
const option = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut;
};

// ───────────────────────────── Mode externe : règles construites, puis emulators:exec ─────────────────────────────

/** Fait tourner le vrai `build-rules.mjs` dans un dossier temporaire : mêmes gardes, même jeton, sans toucher au dépôt. */
function construireRegles(tmp) {
  mkdirSync(join(tmp, 'scripts'));
  copyFileSync(join(ROOT, 'scripts/build-rules.mjs'), join(tmp, 'scripts/build-rules.mjs'));
  copyFileSync(join(ROOT, 'firestore.rules.template'), join(tmp, 'firestore.rules.template'));
  writeFileSync(join(tmp, '.env'), `VITE_AUTHORIZED_ACCOUNTS=${AUTORISE.email}\n`);
  const run = spawnSync(process.execPath, [join(tmp, 'scripts/build-rules.mjs')], { cwd: tmp, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`build-rules.mjs a échoué : ${run.stderr || run.stdout}`);
  const regles = readFileSync(join(tmp, 'firestore.rules'), 'utf8');
  if (!regles.includes(`'${AUTORISE.email}'`)) throw new Error('les règles construites ne portent pas le compte d’essai');
  if (regles.includes(INTRUS.email)) throw new Error('le compte intrus est dans les règles construites');
  return {
    sortie: run.stdout.trim(),
    sha: sha(regles),
    gabaritSha: sha(readFileSync(join(ROOT, 'firestore.rules.template'), 'utf8'))
  };
}

async function externe() {
  const port = Number(option('port', '8187'));
  const tmp = mkdtempSync(join(tmpdir(), 'carnets-regles-'));
  let code = 1;
  try {
    const regles = construireRegles(tmp);
    console.log(`règles : ${regles.sortie} (gabarit sha ${regles.gabaritSha.slice(0, 12)}, règles sha ${regles.sha.slice(0, 12)})`);
    writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({
      firestore: { rules: 'firestore.rules' },
      emulators: {
        firestore: { port, host: '127.0.0.1' },
        hub: { port: port + 300, host: '127.0.0.1' },
        logging: { port: port + 400, host: '127.0.0.1' },
        ui: { enabled: false },
        singleProjectMode: true
      }
    }, null, 2));
    const env = { ...process.env, CARNETS_REGLES_SHA: regles.sha, CARNETS_PORT: String(port) };
    for (const secret of ['GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GEMINI_KEY']) delete env[secret];
    const cli = join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
    if (!existsSync(cli)) throw new Error(`firebase-tools absent : ${cli}`);
    const inner = `"${process.execPath}" "${SELF}" --inner`;
    code = await new Promise((done) => {
      const child = spawn(process.execPath, [cli, 'emulators:exec', '--project', PROJECT, '--config', join(tmp, 'firebase.json'),
        '--only', 'firestore', inner], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
      const minuterie = setTimeout(() => { console.error('délai de 240 s dépassé : arrêt de l’émulateur'); child.kill(); }, 240_000);
      // Seules les lignes du mode interne et les erreurs remontent ; le bavardage de l'émulateur reste dans ce processus.
      child.stdout.on('data', (b) => { for (const l of String(b).split(/\r?\n/)) if (/^(REGLES|  [✓✗]|geste|erreur)/.test(l)) console.log(l); });
      child.stderr.on('data', (b) => process.stderr.write(b));
      child.on('exit', (status) => { clearTimeout(minuterie); done(status ?? 1); });
    });
  } catch (e) {
    console.error(`erreur : ${e.message}`);
    console.log('REGLES CARNET ECHEC 0/16 (préparation)');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  process.exit(code);
}

// ───────────────────────────── Mode interne : les 16 gestes, par l'API REST de l'émulateur ─────────────────────────────

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
/** Jeton non signé, accepté par l'émulateur seulement (même forme que `@firebase/rules-unit-testing`). */
function jeton({ uid, email }) {
  const iat = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, iat, exp: iat + 3600, auth_time: iat,
    sub: uid, user_id: uid, email, email_verified: true, firebase: { sign_in_provider: 'google.com', identities: {} }
  })}.`;
}

/** Encodage d'une valeur JS en `Value` Firestore (REST). */
function valeur(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valeur) } };
  return { mapValue: { fields: champs(v) } };
}
const champs = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, valeur(v)]));

/** Formes du modèle (MISSION.md § Données), marquées « ZZ TEST — … ». */
function docCarnet(id, titre) {
  return {
    id, type: 'carnet', title: titre, status: 'idea', createdAt: '2026-11-17T20:00:00.000Z',
    carnet: {
      version: 1, creeLe: '2026-11-17T20:00:00.000Z', phrase: 'ZZ TEST — embouteillage',
      criteres: [{ id: 'k1', texte: 'minimiser l’oxygène', origine: 'vous' }],
      facons: [{ id: 'f1', nom: 'contre-pression', etat: 'ouverte', origine: 'locale' }],
      articles: [], notes: [{ id: 'n1', texte: 'Plus gros seau ?', genre: 'question' }], photos: []
    }
  };
}
function docMessage(id, texte, carnetId) {
  return {
    id, type: 'carnet-message', title: texte, status: 'done', createdAt: '2026-11-17T20:00:00.000Z',
    carnetMessage: { texte, le: '2026-11-17T20:00:00.000Z', depuis: 'liste', rangement: 'locale', effets: [{ carnetId, cible: 'note', id: 'n1' }] }
  };
}

async function interne() {
  const hote = process.env.FIRESTORE_EMULATOR_HOST;
  if (!hote) throw new Error('FIRESTORE_EMULATOR_HOST absent : lancer sans --inner');
  const base = `http://${hote}/v1/projects/${PROJECT}/databases/(default)/documents`;
  const appel = async (qui, methode, chemin, corps) => {
    const r = await fetch(`${base}/${chemin}`, {
      method: methode,
      headers: { Authorization: `Bearer ${qui === 'admin' ? 'owner' : jeton(qui)}`, 'Content-Type': 'application/json' },
      body: corps ? JSON.stringify({ fields: champs(corps) }) : undefined
    });
    return { statut: r.status, corps: await r.json().catch(() => ({})) };
  };
  const lireAdmin = async (id) => appel('admin', 'GET', `creativeItems/${id}`);
  const titreDe = (r) => r.corps?.fields?.title?.stringValue;

  const vider = await fetch(`http://${hote}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  if (!vider.ok) throw new Error(`remise à zéro de l'émulateur : ${vider.status}`);

  const resultats = [];
  const noter = (nom, ok, detail) => { resultats.push(ok); console.log(`  ${ok ? '✓' : '✗'} ${nom}${ok ? '' : ` — ${detail}`}`); };

  for (const [sorte, fabrique] of [
    ['carnet', (id, t) => docCarnet(id, t)],
    ['carnet-message', (id, t) => docMessage(id, t, 'zz-carnet-1')]
  ]) {
    // Compte autorisé : les 4 gestes, chacun vérifié par une lecture administrateur.
    const id = `zz-autorise-${sorte}`;
    let r = await appel(AUTORISE, 'POST', `creativeItems?documentId=${id}`, fabrique(id, 'ZZ TEST — idée'));
    let apres = await lireAdmin(id);
    noter(`autorisé · ${sorte} · créer`, r.statut === 200 && titreDe(apres) === 'ZZ TEST — idée', `HTTP ${r.statut}`);
    r = await appel(AUTORISE, 'GET', `creativeItems/${id}`);
    noter(`autorisé · ${sorte} · lire`, r.statut === 200 && titreDe(r) === 'ZZ TEST — idée', `HTTP ${r.statut}`);
    r = await appel(AUTORISE, 'PATCH', `creativeItems/${id}?currentDocument.exists=true`, fabrique(id, 'ZZ TEST — idée renommée'));
    apres = await lireAdmin(id);
    noter(`autorisé · ${sorte} · modifier`, r.statut === 200 && titreDe(apres) === 'ZZ TEST — idée renommée', `HTTP ${r.statut}`);
    r = await appel(AUTORISE, 'DELETE', `creativeItems/${id}?currentDocument.exists=true`);
    apres = await lireAdmin(id);
    noter(`autorisé · ${sorte} · supprimer`, r.statut === 200 && apres.statut === 404, `HTTP ${r.statut}, ensuite ${apres.statut}`);

    // Compte vérifié hors de la liste : refusé sur les 4, et le document témoin reste identique.
    const neuf = `zz-intrus-neuf-${sorte}`;
    r = await appel(INTRUS, 'POST', `creativeItems?documentId=${neuf}`, fabrique(neuf, 'ZZ TEST — intrus'));
    apres = await lireAdmin(neuf);
    noter(`non autorisé · ${sorte} · créer refusé`, r.statut === 403 && apres.statut === 404, `HTTP ${r.statut}, document ${apres.statut}`);
    const temoin = `zz-temoin-${sorte}`;
    const pose = await appel('admin', 'PATCH', `creativeItems/${temoin}`, fabrique(temoin, 'ZZ TEST — témoin'));
    if (pose.statut !== 200) throw new Error(`pose du témoin : HTTP ${pose.statut}`);
    const avant = JSON.stringify((await lireAdmin(temoin)).corps.fields);
    r = await appel(INTRUS, 'GET', `creativeItems/${temoin}`);
    noter(`non autorisé · ${sorte} · lire refusé`, r.statut === 403 && !r.corps.fields, `HTTP ${r.statut}`);
    r = await appel(INTRUS, 'PATCH', `creativeItems/${temoin}?currentDocument.exists=true`, fabrique(temoin, 'ZZ TEST — modifié par intrus'));
    apres = await lireAdmin(temoin);
    noter(`non autorisé · ${sorte} · modifier refusé`, r.statut === 403 && JSON.stringify(apres.corps.fields) === avant, `HTTP ${r.statut}`);
    r = await appel(INTRUS, 'DELETE', `creativeItems/${temoin}?currentDocument.exists=true`);
    apres = await lireAdmin(temoin);
    noter(`non autorisé · ${sorte} · supprimer refusé`, r.statut === 403 && apres.statut === 200, `HTTP ${r.statut}, ensuite ${apres.statut}`);
  }

  const ok = resultats.filter(Boolean).length;
  console.log(`REGLES CARNET ${ok === 16 && resultats.length === 16 ? 'OK' : 'ECHEC'} ${ok}/16 (règles sha ${String(process.env.CARNETS_REGLES_SHA).slice(0, 12)})`);
  process.exit(ok === 16 ? 0 : 1);
}

if (process.argv.includes('--inner')) {
  interne().catch((e) => { console.log(`erreur : ${e.message}`); console.log('REGLES CARNET ECHEC (mode interne)'); process.exit(1); });
} else {
  externe();
}
