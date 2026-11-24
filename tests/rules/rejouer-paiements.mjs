#!/usr/bin/env node
/**
 * Voie ecr5 (24.11), E43-1 : « une correction qui écrit des paiements se rejoue contre les règles Firestore avant la mise en ligne ».
 *
 * Rejoue, sur l'ÉMULATEUR Firestore et avec les règles produites par `scripts/build-rules.mjs` (copié dans un dossier temporaire, compte d'essai),
 * les lots exacts que le client envoie pour une pièce payée dont on déplace la date, puis qu'on retire :
 *   1. créer la pièce (solde 0), la payer (un paiement + le solde, un seul lot)      → accepté
 *   2. déplacer la date : contre-paiement daté du jour d'ORIGINE (un lot), paiement au nouveau jour (un lot) → accepté
 *   3. réécrire la pièce (date changée) avec le solde et le dernier paiement VIVANTS   → accepté       (le correctif d'EditTransactionModal)
 *   4. réécrire la pièce avec le dernier paiement PÉRIMÉ (copie lue avant les paiements) → refusé 403  (le bogue : « Missing or insufficient permissions »)
 *   5. un contre-paiement daté AVANT son original                                       → refusé 403  (firestore.rules : payment.date >= original.date)
 *   6. retirer : contre-paiement du paiement vivant (un lot), puis annulation de la pièce (solde 0 inchangé) → accepté
 *   7. annuler avec un solde périmé (non nul)                                           → refusé 403
 * Sortie attendue : `REGLES PAIEMENTS OK 10/10`.
 *
 * Rien n'est écrit dans le dépôt ni en ligne : projet `demo-paiements` (préfixe `demo-` : aucun appel réseau réel). Ne déploie JAMAIS les règles.
 * Le mode `--inner` est lancé par `firebase emulators:exec`, jamais à la main.
 *
 * Usage (racine du dépôt) : node tests/rules/rejouer-paiements.mjs [--port 8188]
 */
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), '..', '..');
const PROJECT = 'demo-paiements';
const AUTORISE = { uid: 'paiements-autorise', email: 'autorise@paiements-test.ch' };
const option = (nom, defaut) => { const i = process.argv.indexOf(`--${nom}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut; };

function construireRegles(tmp) {
  mkdirSync(join(tmp, 'scripts'));
  copyFileSync(join(ROOT, 'scripts/build-rules.mjs'), join(tmp, 'scripts/build-rules.mjs'));
  copyFileSync(join(ROOT, 'firestore.rules.template'), join(tmp, 'firestore.rules.template'));
  writeFileSync(join(tmp, '.env'), `VITE_AUTHORIZED_ACCOUNTS=${AUTORISE.email}\n`);
  const run = spawnSync(process.execPath, [join(tmp, 'scripts/build-rules.mjs')], { cwd: tmp, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`build-rules.mjs a échoué : ${run.stderr || run.stdout}`);
  if (!readFileSync(join(tmp, 'firestore.rules'), 'utf8').includes(`'${AUTORISE.email}'`)) throw new Error('les règles construites ne portent pas le compte d’essai');
}

async function externe() {
  const port = Number(option('port', '8188'));
  const tmp = mkdtempSync(join(tmpdir(), 'paiements-regles-'));
  let code = 1;
  try {
    construireRegles(tmp);
    writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({
      firestore: { rules: 'firestore.rules' },
      emulators: { firestore: { port, host: '127.0.0.1' }, hub: { port: port + 300, host: '127.0.0.1' }, logging: { port: port + 400, host: '127.0.0.1' }, ui: { enabled: false }, singleProjectMode: true }
    }, null, 2));
    const env = { ...process.env, PAIEMENTS_PORT: String(port) };
    for (const secret of ['GEMINI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY', 'GEMINI_KEY']) delete env[secret];
    const cli = join(ROOT, 'node_modules/firebase-tools/lib/bin/firebase.js');
    if (!existsSync(cli)) throw new Error(`firebase-tools absent : ${cli}`);
    const inner = `"${process.execPath}" "${SELF}" --inner`;
    code = await new Promise((done) => {
      const child = spawn(process.execPath, [cli, 'emulators:exec', '--project', PROJECT, '--config', join(tmp, 'firebase.json'), '--only', 'firestore', inner],
        { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
      const minuterie = setTimeout(() => { console.error('délai de 240 s dépassé : arrêt de l’émulateur'); child.kill(); }, 240_000);
      child.stdout.on('data', (b) => { for (const l of String(b).split(/\r?\n/)) if (/^(REGLES|  [✓✗]|geste|erreur)/.test(l)) console.log(l); });
      child.stderr.on('data', (b) => process.stderr.write(b));
      child.on('exit', (status) => { clearTimeout(minuterie); done(status ?? 1); });
    });
  } catch (e) {
    console.error(`erreur : ${e.message}`);
    console.log('REGLES PAIEMENTS ECHEC 0/10 (préparation)');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  process.exit(code);
}

// ───────────────────────────── Mode interne : les lots, par l'API REST de l'émulateur ─────────────────────────────

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jeton({ uid, email }) {
  const iat = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, iat, exp: iat + 3600, auth_time: iat, sub: uid, user_id: uid, email, email_verified: true, firebase: { sign_in_provider: 'google.com', identities: {} } })}.`;
}
function valeur(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valeur) } };
  return { mapValue: { fields: champs(v) } };
}
const champs = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, valeur(v)]));
const lire = (f) => (f?.integerValue !== undefined ? Number(f.integerValue) : f?.stringValue);

async function interne() {
  const hote = process.env.FIRESTORE_EMULATOR_HOST;
  if (!hote) throw new Error('FIRESTORE_EMULATOR_HOST absent : lancer sans --inner');
  const racine = `projects/${PROJECT}/databases/(default)/documents`;
  const base = `http://${hote}/v1/${racine}`;
  const entetes = { Authorization: `Bearer ${jeton(AUTORISE)}`, 'Content-Type': 'application/json' };
  /** Un lot atomique, comme `writeBatch(db).commit()` du client. */
  const lot = async (ecritures) => {
    const r = await fetch(`${base}:commit`, { method: 'POST', headers: entetes, body: JSON.stringify({ writes: ecritures }) });
    return { statut: r.status, corps: await r.json().catch(() => ({})) };
  };
  const lireDoc = async (chemin) => (await fetch(`${base}/${chemin}`, { headers: { Authorization: 'Bearer owner' } })).json();

  const doc = (chemin, donnees, extra = {}) => ({ update: { name: `${racine}/${chemin}`, fields: champs(donnees) }, ...extra });
  /** `batch.set(ref, data, { merge: true })` + `increment` : le paiement ajuste le solde réglé et pose le dernier paiement. */
  const ajuster = (id, delta, dernier) => ({
    update: { name: `${racine}/transactions/${id}`, fields: champs({ lastPaymentId: dernier }) },
    updateMask: { fieldPaths: ['lastPaymentId'] },
    updateTransforms: [{ fieldPath: 'settlementBalanceCents', increment: { integerValue: String(delta) } }]
  });
  const paiement = (id, donnees) => doc(`financialPayments/${id}`, { id, transactionId: 'ZZ-PIECE', method: 'bank', recordedAt: '2026-11-24T10:00:00.000Z', ...donnees }, { currentDocument: { exists: false } });
  const piece = (extra = {}) => ({
    id: 'ZZ-PIECE', date: '2026-11-19', description: 'ZZ TEST — Achat', category: 'brassage', subcategory: '', amountHT: 4.5, amountTTC: 4.5, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: 'expense', amountCents: 450, lines: [], paymentStatus: 'paid', ...(extra.finance ?? {}) }, ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'finance'))
  });

  await fetch(`http://${hote}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  const resultats = [];
  const noter = (nom, ok, detail) => { resultats.push(ok); console.log(`  ${ok ? '✓' : '✗'} ${nom}${ok ? '' : ` — ${detail}`}`); };
  const accepte = (r) => r.statut === 200;
  const refuse = (r) => r.statut === 403;
  const etat = async () => { const d = await lireDoc('transactions/ZZ-PIECE'); return { solde: lire(d.fields?.settlementBalanceCents) ?? 0, dernier: lire(d.fields?.lastPaymentId) ?? '', date: lire(d.fields?.date), annule: !!d.fields?.finance?.mapValue?.fields?.voidedAt }; };

  let r = await lot([doc('transactions/ZZ-PIECE', piece(), { currentDocument: { exists: false } })]);
  noter('1a. créer la pièce, solde 0', accepte(r), `HTTP ${r.statut} ${JSON.stringify(r.corps).slice(0, 160)}`);
  r = await lot([paiement('PAI-1', { date: '2026-11-19', amountCents: 450, direction: 'out' }), ajuster('ZZ-PIECE', 450, 'PAI-1')]);
  noter('1b. payer 4,50 le 19.11 (paiement + solde, un lot)', accepte(r), `HTTP ${r.statut} ${JSON.stringify(r.corps).slice(0, 160)}`);

  // 5 d'abord (avant que PAI-1 soit inversé) : un contre-paiement daté avant son original est refusé.
  r = await lot([paiement('CONTRE-PAI-1', { date: '2026-11-14', amountCents: 450, direction: 'in', reversalOfId: 'PAI-1' }), ajuster('ZZ-PIECE', -450, 'CONTRE-PAI-1')]);
  noter('5. contre-paiement daté avant son original : refusé', refuse(r), `HTTP ${r.statut}`);

  r = await lot([paiement('CONTRE-PAI-1', { date: '2026-11-19', amountCents: 450, direction: 'in', reversalOfId: 'PAI-1' }), ajuster('ZZ-PIECE', -450, 'CONTRE-PAI-1')]);
  noter('2a. déplacer la date : contre-paiement au jour d’origine', accepte(r), `HTTP ${r.statut} ${JSON.stringify(r.corps).slice(0, 160)}`);
  r = await lot([paiement('PAI-2', { date: '2026-11-14', amountCents: 450, direction: 'out' }), ajuster('ZZ-PIECE', 450, 'PAI-2')]);
  noter('2b. déplacer la date : paiement au 14.11', accepte(r), `HTTP ${r.statut} ${JSON.stringify(r.corps).slice(0, 160)}`);

  // 4 : la copie lue AVANT les paiements (dernier paiement PAI-1, solde 450) réécrite en entier avec la nouvelle date.
  r = await lot([doc('transactions/ZZ-PIECE', piece({ date: '2026-11-14', settlementBalanceCents: 450, lastPaymentId: 'PAI-1' }), { currentDocument: { exists: true } })]);
  noter('4. pièce réécrite avec le dernier paiement périmé : refusée (le bogue E43-1)', refuse(r), `HTTP ${r.statut}`);
  // 3 : la copie relue APRÈS les paiements.
  r = await lot([doc('transactions/ZZ-PIECE', piece({ date: '2026-11-14', settlementBalanceCents: 450, lastPaymentId: 'PAI-2' }), { currentDocument: { exists: true } })]);
  noter('3. pièce réécrite avec le solde et le dernier paiement vivants : acceptée (le correctif)', accepte(r), `HTTP ${r.statut} ${JSON.stringify(r.corps).slice(0, 160)}`);
  const e3 = await etat();
  noter('3b. la pièce est au 14.11, solde 4,50, dernier paiement PAI-2', e3.date === '2026-11-14' && e3.solde === 450 && e3.dernier === 'PAI-2', JSON.stringify(e3));

  // 7 : annuler avec le solde non nul : refusé.
  r = await lot([doc('transactions/ZZ-PIECE', piece({ date: '2026-11-14', settlementBalanceCents: 450, lastPaymentId: 'PAI-2', finance: { voidedAt: '2026-11-24T10:05:00.000Z' } }), { currentDocument: { exists: true } })]);
  noter('7. annuler une pièce au solde non nul : refusé', refuse(r), `HTTP ${r.statut}`);
  // 6 : retirer = contre-paiement du paiement vivant, puis annulation.
  r = await lot([paiement('CONTRE-PAI-2', { date: '2026-11-14', amountCents: 450, direction: 'in', reversalOfId: 'PAI-2' }), ajuster('ZZ-PIECE', -450, 'CONTRE-PAI-2')]);
  const apresContre = r;
  r = await lot([doc('transactions/ZZ-PIECE', piece({ date: '2026-11-14', settlementBalanceCents: 0, lastPaymentId: 'CONTRE-PAI-2', finance: { voidedAt: '2026-11-24T10:06:00.000Z' } }), { currentDocument: { exists: true } })]);
  const e6 = await etat();
  noter('6. retirer : contre-paiement puis annulation, solde 0', accepte(apresContre) && accepte(r) && e6.annule && e6.solde === 0, `contre HTTP ${apresContre.statut}, annulation HTTP ${r.statut} ${JSON.stringify(e6)}`);

  const ok = resultats.filter(Boolean).length;
  console.log(`REGLES PAIEMENTS ${ok === resultats.length && resultats.length === 10 ? 'OK' : 'ECHEC'} ${ok}/10`);
  process.exit(ok === 10 ? 0 : 1);
}

if (process.argv.includes('--inner')) {
  interne().catch((e) => { console.log(`erreur : ${e.message}`); console.log('REGLES PAIEMENTS ECHEC (mode interne)'); process.exit(1); });
} else {
  externe();
}
