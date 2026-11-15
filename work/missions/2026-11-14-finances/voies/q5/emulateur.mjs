#!/usr/bin/env node
/**
 * Voie q5 : les plans de correction du montant (Modifier) et le virement (Payer) rejoués contre les VRAIES règles Firestore, sur l'émulateur.
 *
 * Pourquoi : en `?dev-local`, `FirestoreRepo` écrit dans un cache, sans lot ni règles ; les tests d'intégration ne prouvent donc rien des règles (relecture r2, B1).
 * Ici, chaque étape d'un plan est écrite comme l'app l'écrit, dans UN lot (writeBatch) par étape :
 *   · paiement ou contre-paiement : `transactions/<id>` en `set` fusionné {settlementBalanceCents: increment(±montant), lastPaymentId} + `financialPayments/<id>` ;
 *   · montant : `transactions/<id>` en `set` complet (la pièce relue au moment même, comme `executerPlan`) + une entrée `auditLogs` (comme `logAction`).
 * Les plans viennent du vrai `planCorrection` et la répartition du vrai `repartirVirement` (empaquetés par esbuild depuis `src/`, jamais réécrits ici).
 * Règles : celles du dépôt principal (`firestore.rules`, lecture seule) copiées dans un dossier temporaire, avec l'adresse autorisée remplacée par celle du banc.
 * Aucune donnée réelle : projet `demo-q5`, pièces « ZZ TEST ». Témoin : l'ancien regroupement de toutes les étapes en un seul lot doit être refusé.
 *
 * Usage, depuis la racine du worktree : node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > .../emulateur.txt
 * Sortie : EMULATEUR OK, ou EMULATEUR ECHEC suivi du refus.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ICI = dirname(SELF);
const PROJET = 'demo-q5';
const PORT = 8089;
const UTILISATEUR = 'banc@demo-q5.test';
const monter = (debut, nom) => { for (let d = debut; ; d = dirname(d)) { if (existsSync(join(d, nom))) return d; if (dirname(d) === d) return null; } };

if (!process.argv.includes('--inner')) {
  // --- Processus extérieur : prépare le dossier temporaire et lance l'émulateur, qui rejoue ce même fichier en mode --inner.
  const fin = (texte) => { console.log(texte); process.exit(texte.startsWith('EMULATEUR OK') ? 0 : 1); };
  const racinePaquets = monter(ICI, 'node_modules/.bin/firebase.cmd') ?? monter(ICI, 'node_modules/.bin/firebase');
  const racineRegles = monter(ICI, 'firestore.rules');
  if (!racinePaquets) fin('EMULATEUR ECHEC : firebase-tools introuvable dans les dossiers parents.');
  if (!racineRegles) fin('EMULATEUR ECHEC : firestore.rules (dépôt principal) introuvable dans les dossiers parents.');
  const tmp = mkdtempSync(join(tmpdir(), 'q5-emu-'));
  const regles = readFileSync(join(racineRegles, 'firestore.rules'), 'utf8')
    .replace(/(function autorises\(\) \{\s*return )\[[^\]]*\]/, (_, tete) => `${tete}['${UTILISATEUR}']`);
  if (!regles.includes(UTILISATEUR)) fin('EMULATEUR ECHEC : la liste des comptes autorisés n’a pas été reconnue dans firestore.rules.');
  writeFileSync(join(tmp, 'firestore.rules'), regles);
  writeFileSync(join(tmp, 'firebase.json'), JSON.stringify({ firestore: { rules: 'firestore.rules' }, emulators: { firestore: { host: '127.0.0.1', port: PORT }, ui: { enabled: false } } }));
  // Le vrai code de l'app, empaqueté : plan de correction, contre-paiement, répartition d'un virement.
  const esbuild = await import(pathToFileURL(join(racinePaquets, 'node_modules/esbuild/lib/main.js')).href);
  mkdirSync(join(tmp, 'pack'), { recursive: true });
  await esbuild.build({ entryPoints: [join(ICI, 'entree.ts')], bundle: true, format: 'esm', platform: 'node', outfile: join(tmp, 'pack', 'app.mjs'), logLevel: 'error' });
  const bin = join(racinePaquets, 'node_modules/.bin', process.platform === 'win32' ? 'firebase.cmd' : 'firebase');
  const commande = `"${process.execPath}" "${SELF}" --inner "${join(tmp, 'pack', 'app.mjs')}"`;
  const r = spawnSync(`"${bin}" emulators:exec --only firestore --project ${PROJET} --config "${join(tmp, 'firebase.json')}" "${commande.replace(/"/g, '\\"')}"`,
    { shell: true, encoding: 'utf8', timeout: 240_000, cwd: tmp, env: { ...process.env, NODE_PATH: join(racinePaquets, 'node_modules') } });
  const sortie = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.split(/\r?\n/);
  const utiles = sortie.filter(l => l.startsWith('Q5| ')).map(l => l.slice(4));
  if (utiles.some(l => l.startsWith('EMULATEUR OK') || l.startsWith('EMULATEUR ECHEC'))) fin(utiles.join('\n'));
  fin(`EMULATEUR ECHEC : l'émulateur n'a pas rendu de verdict (code ${r.status}).\n${sortie.filter(l => l.trim()).slice(-15).join('\n')}`);
}

// --- Processus intérieur : tourne sous l'émulateur Firestore (FIRESTORE_EMULATOR_HOST posé par emulators:exec).
const { initializeApp } = await import('firebase/app');
const fs = await import('firebase/firestore');
const { getFirestore, connectFirestoreEmulator, writeBatch, doc, collection, getDoc, getDocs, query, where, increment, terminate } = fs;
const app = await import(pathToFileURL(process.argv[process.argv.indexOf('--inner') + 1]).href);
const { planCorrection, contrePaiement, repartirVirement, creanceDeTropPaye, paiementDeCreance } = app;

const sortir = (texte) => console.log(`Q5| ${texte}`);
const base = initializeApp({ projectId: PROJET, apiKey: 'banc' });
const db = getFirestore(base);
connectFirestoreEmulator(db, '127.0.0.1', PORT, { mockUserToken: { sub: 'banc-q5', email: UTILISATEUR, email_verified: true } });

const MAINTENANT = '2026-11-15T09:00:00.000Z', AUJOURDHUI = '2026-11-15';
let compteur = 0;
const neuf = (prefixe) => `${prefixe}-ZZ${++compteur}`;
const refus = (e) => `${e?.code ?? 'erreur'} : ${e?.message ?? e}`;

// ---- Écritures, telles que l'app les met en lot ----
const pieceDe = (id, cents, extra = {}) => ({
  id, date: '09.11.2026', description: `ZZ TEST ${id}`, category: 'nettoyage', subcategory: 'CIP', amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...(extra.vendor ? { vendor: extra.vendor } : {}), ...(extra.dueDate ? { dueDate: extra.dueDate } : {}) }
});
/** Les opérations d'un paiement ou d'un contre-paiement : le solde et le dernier paiement de la pièce, puis le paiement (immuable). */
const opsPaiement = (p) => [
  { ref: doc(db, 'transactions', p.transactionId), data: { settlementBalanceCents: increment(p.reversalOfId ? -p.amountCents : p.amountCents), lastPaymentId: p.id }, merge: true },
  { ref: doc(db, 'financialPayments', p.id), data: p }
];
/** L'opération d'une étape « montant » : la pièce VIVANTE relue, avec le nouveau montant (comme `aEnregistrer` + `updateTransaction`), et son entrée de journal. */
async function opsMontant(id, cents) {
  const vivante = (await getDoc(doc(db, 'transactions', id))).data();
  const nouvelle = { ...vivante, amountHT: cents / 100, amountTTC: cents / 100, finance: { ...vivante.finance, amountCents: cents } };
  return [{ ref: doc(db, 'transactions', id), data: nouvelle }, { ref: doc(db, 'auditLogs', neuf('LOG')), data: { id: id, action: 'Modification', details: `montant ${cents}` } }];
}
const commit = async (ops) => {
  const lot = writeBatch(db);
  for (const o of ops) o.merge ? lot.set(o.ref, o.data, { merge: true }) : lot.set(o.ref, o.data);
  await lot.commit();
};
const lire = async (id) => (await getDoc(doc(db, 'transactions', id))).data();
const paiementsDe = async (id) => (await getDocs(query(collection(db, 'financialPayments'), where('transactionId', '==', id)))).docs.map(d => d.data());

/** Une pièce neuve et ses paiements (chacun dans son lot : un paiement par pièce et par lot), écrits par les mêmes règles que l'app. */
async function semer(id, cents, paiements = [], extra = {}) {
  await commit([{ ref: doc(db, 'transactions', id), data: pieceDe(id, cents, extra) }]);
  const ecrits = [];
  for (const [i, [montant, date]] of paiements.entries()) {
    const p = { id: `PAI-${id}-${i + 1}`, transactionId: id, date, amountCents: montant, direction: 'out', method: 'bank', recordedAt: `${date}T08:00:00.000Z` };
    await commit(opsPaiement(p)); ecrits.push(p);
  }
  return ecrits;
}

/** Les opérations de chaque étape du plan, dans l'ordre (la pièce et les paiements sont relus au moment de l'étape). */
async function opsDeEtape(etape, id, originaux) {
  if (etape.type === 'contre') return opsPaiement({ ...contrePaiement(originaux.find(p => p.id === etape.paiementId), MAINTENANT), note: 'Contre-écriture : montant de la pièce corrigé' });
  if (etape.type === 'montant') return opsMontant(id, etape.cents);
  // FN-10 (t2) : la créance « À récupérer », écrite comme `creanceDeTropPaye` (une dépense de l'excédent), dans son propre lot ; sa sortie suit (étape `creance-sortie`, un lot de plus).
  if (etape.type === 'avoir') {
    const creance = creanceDeTropPaye({ ...(await lire(id)) }, etape, { aujourdhui: AUJOURDHUI, maintenant: MAINTENANT }, neuf('MOUV'), originaux.map(p => p.date).sort().at(-1));
    creanceEcrite = creance;
    return [{ ref: doc(db, 'transactions', creance.id), data: creance }];
  }
  if (etape.type === 'creance-sortie') return opsPaiement(etape.paiement);
  return opsPaiement({ id: neuf('PAI'), transactionId: id, date: etape.date || AUJOURDHUI, amountCents: etape.cents, direction: etape.direction, method: etape.method, note: 'Paiement après correction du montant de la pièce', recordedAt: MAINTENANT });
}
/** `parLot` : un lot par étape (la correction de q5). `false` : toutes les étapes dans un seul lot (l'ancien regroupement, le témoin). */
async function jouer(id, plan, parLot) {
  const originaux = await paiementsDe(id);
  if (parLot) {
    for (const etape of plan) {
      await commit(await opsDeEtape(etape, id, originaux));
      // FN-10 (t2) : après l'étape « avoir », la sortie qui porte la créance, dans son propre lot (la pièce existe déjà), comme `executerPlan`.
      if (etape.type === 'avoir') {
        await commit(await opsDeEtape({ type: 'creance-sortie', paiement: paiementDeCreance(creanceEcrite, etape, originaux, { aujourdhui: AUJOURDHUI, maintenant: MAINTENANT }, neuf('PAI')) }, id, originaux));
      }
    }
    return;
  }
  const tout = [];
  for (const etape of plan) tout.push(...await opsDeEtape(etape, id, originaux));
  await commit(tout);
}
let creanceEcrite = null;
const piecePourPlan = async (id) => ({ ...(await lire(id)) });
const planDe = async (id, cents, choix) => planCorrection(await piecePourPlan(id), await paiementsDe(id), cents, choix);

const resultats = [];
const verifier = (nom, ok, detail) => { resultats.push({ nom, ok, detail }); sortir(`${ok ? 'ok' : 'KO'}  ${nom} : ${detail}`); };
const etat = async (id) => { const t = await lire(id); return { montant: t.finance.amountCents, solde: t.settlementBalanceCents ?? 0, dernier: t.lastPaymentId }; };

async function scenario(nom, { cents, paiements, nouveau, choix, attendu }) {
  const id = neuf('T');
  try {
    await semer(id, cents, paiements);
    const plan = await planDe(id, nouveau, choix);
    await jouer(id, plan, true);
    const e = await etat(id), ps = await paiementsDe(id);
    const bon = e.montant === attendu.montant && e.solde === attendu.solde && (!attendu.dateRemplacement || ps.filter(p => !p.reversalOfId && !p.id.startsWith(`PAI-${id}-`)).every(p => p.date === attendu.dateRemplacement));
    verifier(nom, bon, `${plan.length} étapes, ${plan.length} lots : montant ${e.montant}, réglé ${e.solde}, ${ps.length} paiements (attendu ${attendu.montant} / ${attendu.solde})`);
  } catch (e) { verifier(nom, false, `refusé : ${refus(e)}`); }
}
async function temoin(nom, { cents, paiements, nouveau, choix, exige }) {
  const id = neuf('T');
  try {
    await semer(id, cents, paiements);
    const plan = await planDe(id, nouveau, choix);
    await jouer(id, plan, false);
    sortir(`${exige ? 'KO' : 'info'}  témoin ${nom} (un seul lot) : ACCEPTÉ${exige ? ' : le témoin devait échouer' : ''}`);
    if (exige) resultats.push({ nom: `témoin ${nom}`, ok: false, detail: 'accepté' });
  } catch (e) {
    sortir(`ok  témoin ${nom} (un seul lot) : refusé comme attendu (${refus(e)})`);
  }
}

try {
  await scenario('hausse + le paiement suit', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4550, choix: 'suit', attendu: { montant: 4550, solde: 4550 } });
  await scenario('hausse + reste à payer', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4550, choix: 'reste', attendu: { montant: 4550, solde: 4200 } });
  await scenario('baisse sous le payé + le paiement suit', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4000, choix: 'suit', attendu: { montant: 4000, solde: 4000, dateRemplacement: '2026-11-09' } });
  // q6, point 1 : sous le payé, « reste à payer » n'existe plus (le payé ne disparaît jamais) : le plan demandé en « reste » est celui du paiement qui suit.
  await scenario('baisse sous le payé, « reste à payer » demandé : le paiement suit quand même (q6)', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4000, choix: 'reste', attendu: { montant: 4000, solde: 4000, dateRemplacement: '2026-11-09' } });
  // FN-10 (t2) : virement de 52,00 sur deux pièces (42,00 + 10,00), « j'ai bien payé 42,00 : 2,00 trop payé » sur la première : contre-paiement, montant, paiement, pièce « À récupérer », sa sortie (un lot chacun), contre les règles du dépôt.
  // Les sorties du virement restent 52,00 à leur date et par leur moyen ; la créance est une dépense de 2,00 payée par une vraie sortie de 2,00 ; aucun avoir.
  {
    const id = neuf('T'), autre = neuf('T'), jour = '2026-11-09';
    try {
      await semer(id, 4200, [[4200, jour]]);
      await semer(autre, 1000, [[1000, jour]]);
      const sorties = async () => (await getDocs(collection(db, 'financialPayments'))).docs.map(d => d.data()).filter(p => p.date === jour && p.method === 'bank' && [id, autre, creanceEcrite?.id].includes(p.transactionId)).reduce((n, p) => n + (p.direction === 'out' ? p.amountCents : -p.amountCents), 0);
      const avant = await sorties();
      const plan = await planDe(id, 4000, 'avoir');
      await jouer(id, plan, true);
      const e = await etat(id), apres = await sorties();
      const creance = creanceEcrite ? await lire(creanceEcrite.id) : null;
      const sortiesCreance = creance ? await paiementsDe(creance.id) : [];
      const avoirs = (await getDocs(query(collection(db, 'transactions'), where('finance.refundOfId', '==', id)))).docs.length;
      const bon = plan.at(-1)?.type === 'avoir' && e.montant === 4000 && e.solde === 4000 && avant === 5200 && apres === 5200 && avoirs === 0 && creance?.finance.kind === 'expense' && creance.finance.amountCents === 200
        && creance.settlementBalanceCents === 200 && sortiesCreance.length === 1 && sortiesCreance[0].direction === 'out' && sortiesCreance[0].date === jour && sortiesCreance[0].method === 'bank';
      verifier('baisse sous le payé + « j’ai bien payé » : la créance « À récupérer » de 2,00 et sa sortie sont acceptées, les 52,00 du virement restent sortis', bon, `${plan.length} étapes : montant ${e.montant}, réglé ${e.solde}, sorties du jour ${avant} puis ${apres}, créance ${creance?.finance.amountCents ?? '—'} réglée ${creance?.settlementBalanceCents ?? '—'}, ${avoirs} avoir(s)`);
    } catch (e) { verifier('baisse sous le payé + « j’ai bien payé »', false, `refusé : ${refus(e)}`); }
  }
  await scenario('baisse avec deux paiements inversés + le paiement suit', { cents: 4200, paiements: [[3000, '2026-11-05'], [1200, '2026-11-09']], nouveau: 2500, choix: 'suit', attendu: { montant: 2500, solde: 2500, dateRemplacement: '2026-11-09' } });
  await scenario('baisse avec un seul paiement inversé (le reste tient)', { cents: 4200, paiements: [[3000, '2026-11-05'], [1200, '2026-11-09']], nouveau: 4000, choix: 'suit', attendu: { montant: 4000, solde: 4000, dateRemplacement: '2026-11-09' } });

  // Virement sur deux pièces d'un même fournisseur : un paiement par pièce, deux pièces différentes, dans UN lot (comme PayerVirement).
  {
    const a = neuf('T'), b = neuf('T');
    try {
      await semer(a, 6000, [], { vendor: 'ZZ TEST Atelier', dueDate: '2025-12-20' });
      await semer(b, 40000, [], { vendor: 'ZZ TEST Atelier', dueDate: '2099-11-25' });
      const rep = repartirVirement([{ id: a, resteCents: 6000, echeance: '2025-12-20', date: '2026-11-09' }, { id: b, resteCents: 40000, echeance: '2099-11-25', date: '2026-11-09' }], 30000);
      const ops = rep.parts.filter(p => p.partCents > 0).flatMap(p => opsPaiement({ id: neuf('PAI'), transactionId: p.id, date: AUJOURDHUI, amountCents: p.partCents, direction: 'out', method: 'bank',
        note: `Virement de 300.00 réparti sur ${rep.parts.length} pièces`, recordedAt: MAINTENANT, proofDocumentId: 'proof-VIR-ZZ', proofFileName: 'preuve.pdf' }));
      await commit(ops);
      const ea = await etat(a), eb = await etat(b);
      verifier('virement de 300,00 sur deux pièces du même fournisseur (un lot)', ea.solde === 6000 && eb.solde === 24000, `pièce 1 réglée ${ea.solde}/6000, pièce 2 réglée ${eb.solde}/40000`);
    } catch (e) { verifier('virement de 300,00 sur deux pièces du même fournisseur (un lot)', false, `refusé : ${refus(e)}`); }
  }

  // Témoins : l'ancien regroupement. Les deux premiers sont certains (deux paiements d'une même pièce dans un lot) ; les deux suivants éclairent le cas « montant + paiement ».
  await temoin('baisse sous le payé + suit', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4000, choix: 'suit', exige: true });
  await temoin('baisse avec deux paiements', { cents: 4200, paiements: [[3000, '2026-11-05'], [1200, '2026-11-09']], nouveau: 2500, choix: 'suit', exige: true });
  await temoin('hausse + suit', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4550, choix: 'suit', exige: false });
  await temoin('baisse + reste', { cents: 4200, paiements: [[4200, '2026-11-09']], nouveau: 4000, choix: 'reste', exige: false });
} catch (e) {
  resultats.push({ nom: 'banc', ok: false, detail: refus(e) });
}
const ko = resultats.filter(r => !r.ok);
sortir(ko.length ? `EMULATEUR ECHEC : ${ko.map(r => `${r.nom} (${r.detail})`).join(' ; ')}` : `EMULATEUR OK : ${resultats.length} contrôles joués contre les règles du dépôt, un lot par étape ; témoins refusés`);
await terminate(db).catch(() => undefined);
process.exit(0);
