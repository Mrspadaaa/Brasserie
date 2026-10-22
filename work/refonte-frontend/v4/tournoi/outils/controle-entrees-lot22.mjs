// D102 (22.10, leçon L08) : les entrées du lot 22 (Comparer, stout 16D, Cascade, Idaho 7, Galaxy, et
// Nelson Sauvin pour la porte « Je n'ai pas X ») sont vérifiées avant l'éventail des variantes. Au lot
// 21, 33 variantes ont été faites sur un moteur à un mauvais taux d'alcool ; la correction à 4,75 %
// vol. a fait changer 15 cas de drapeau, et toutes les pages étaient à refaire.
// Écrit par le pilote (voie r6e-entrees, mission 2026-10-22-reprise-lot21) ; la voie ne le modifie pas.
// Règle, sur fils22-comparer/donnees/comparer-stout.json (contrat : voies/r6e-entrees/VOIE.md) :
//   1. dans le fichier de profils qu'il déclare (sources.profils), les clés lues par le lot 22 (ancre,
//      biere, style, echelle, familles, formatGrille, grille) sont identiques à une régénération
//      fraîche par prototypes/houblons-v4/scripts/profil-simule-cas.ts (--regenere). Les cas K, textes
//      et sources du lot 21 ne sont pas comparés : le fichier versionné y porte en plus les mesures
//      publiées (E01, E06…), ajoutées après la sortie du moteur (constat du 22.10) ;
//   2. l'ancre est à 4,75 % vol. ;
//   3. les quatre houblons sont là, avec α, huiles, ibuParGramme, et leur grille recopiée telle quelle
//      (moments b10, wp, dryActive, dryPost ; doses 1, 2, 4, 8 ; US-05) ;
//   4. la part sans famille, l'effet égal (interpolation de delta entre doses), l'IBU égal (ibu ÷ IBU
//      par gramme ÷ volume) et les parts de l'option B se recalculent à l'identique.
// Témoin intégré : --temoin fausse la dose d'effet égal de Galaxy avant de vérifier (doit échouer).
// Usage : node controle-entrees-lot22.mjs <comparer-stout.json> --regenere=<profils régénérés> [--temoin] ;
// imprime ENTREES OK, ou ENTREES ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const args = process.argv.slice(2);
const fichier = args.find((a) => !a.startsWith('--'));
const regenere = (args.find((a) => a.startsWith('--regenere=')) || '').slice(11);
const temoin = args.includes('--temoin');
const fautes = [];
const faute = (m) => fautes.push(m);
const lireJson = (f) => JSON.parse(fs.readFileSync(path.resolve(RACINE, f), 'utf8'));
const finir = () => {
  if (fautes.length) { console.log(`ENTREES ECHEC ${fautes.length} problème(s)`); for (const x of fautes) console.log('  ' + x); process.exit(1); }
  console.log('ENTREES OK');
};
if (!fichier || !regenere) { console.log('Usage : node controle-entrees-lot22.mjs <comparer-stout.json> --regenere=<fichier>'); process.exit(2); }

let C;
try { C = lireJson(fichier); } catch (e) { faute(`${fichier} illisible : ${e.message}`); finir(); }
if (temoin) { const e = (C.egalites?.effetEgal || []).find((x) => x.famille === 'citrus'); if (e?.doses) e.doses.Galaxy = (e.doses.Galaxy ?? 0) + 1; }

// 1. Profils identiques à une régénération fraîche.
let P = null;
try {
  P = lireJson(C.sources?.profils ?? '');
  const R = lireJson(regenere);
  for (const k of ['ancre', 'biere', 'style', 'echelle', 'familles', 'formatGrille', 'grille']) {
    if (JSON.stringify(P[k]) !== JSON.stringify(R[k])) faute(`profils : « ${k} » de ${C.sources?.profils} diffère de la régénération ${regenere}`);
  }
} catch (e) { faute(`profils ou régénération illisible : ${e.message}`); }
if (!P) finir();

// 2. Ancre à 4,75 % vol.
if (P.ancre?.abv !== 4.75) faute(`ancre à ${P.ancre?.abv} % vol. (4,75 attendu)`);

// 3. Les quatre houblons, leur fiche et leur grille.
const F = lireJson('prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy', 'Nelson Sauvin'];
const US05 = 'fermentis-us05';
const H = Object.fromEntries((C.houblons || []).map((h) => [h.nom, h]));
// aromes[].mots est une liste de groupes { source, mots[] } : on compte les mots, pas les groupes
// (erreur du 22.10, relevée par la voie r6e ; même calcul que controle-sans-famille.mjs).
const mots = (l) => (l || []).reduce((s, a) => s + (a.mots || []).reduce((t, g) => t + (g.mots || []).length, 0), 0);
for (const nom of NOMS) {
  const h = H[nom], f = F.find((x) => x.name === nom);
  if (!h) { faute(`${nom} absent de houblons[]`); continue; }
  if (!f) { faute(`${nom} absent de pack-fiches.json`); continue; }
  if (h.key !== f.key) faute(`${nom} : key ${h.key} ≠ ${f.key}`);
  for (const k of ['alpha', 'huiles', 'ibuParGramme', 'aromes']) if (JSON.stringify(h[k]) !== JSON.stringify(f[k])) faute(`${nom} : ${k} ne recopie pas pack-fiches.json`);
  const sf = (f.motsSansFamille || []).length, part = sf / (mots(f.aromes) + sf);
  if (Math.abs((h.partSansFamille ?? -1) - part) > 0.01) faute(`${nom} : partSansFamille ${h.partSansFamille} ≠ ${part.toFixed(2)}`);
  const attendue = P.grille.filter((g) => g.houblon === f.key);
  if (JSON.stringify(h.grille) !== JSON.stringify(attendue)) faute(`${nom} : grille ≠ entrées de la grille des profils (${(h.grille || []).length} contre ${attendue.length})`);
  for (const m of ['b10', 'wp', 'dryActive', 'dryPost']) for (const d of [1, 2, 4, 8]) {
    const sec = m.startsWith('dry');
    if (!attendue.some((g) => g.moment === m && g.dose_gL === d && g.levure === US05 && (!sec || g.jours === 3))) faute(`${nom} : pas de cas ${m} ${d} g/L US-05${sec ? ' 3 j' : ''} dans la grille`);
  }
  if (!Array.isArray(h.panels)) faute(`${nom} : panels absent (un tableau, vide si aucune étude)`);
}

// 4a. Effet égal : delta de la famille par interpolation linéaire entre (0, 0) et les doses de la grille.
const delta = (key, fam, d, m, j) => P.grille.find((g) => g.houblon === key && g.moment === m && g.dose_gL === d && g.levure === US05 && g.jours === j)?.delta?.[fam];
const doseEffet = (key, fam, cible, m, j) => {
  const pts = [[0, 0], ...[1, 2, 4, 8].map((d) => [d, delta(key, fam, d, m, j)])];
  for (let i = 1; i < pts.length; i++) {
    const [d0, v0] = pts[i - 1], [d1, v1] = pts[i];
    if (v1 == null || v0 == null) return undefined;
    if (cible >= v0 && cible <= v1 && v1 > v0) return d0 + ((cible - v0) / (v1 - v0)) * (d1 - d0);
  }
  return null;
};
const EG = C.egalites || {};
const de = EG.doseEgale || {};
if (de.dose_gL !== 4 || de.moment !== 'dryPost' || de.jours !== 3 || de.levure !== US05) faute('egalites.doseEgale ≠ { 4 g/L, dryPost, 3 j, US-05 }');
for (const [fam, ref] of [['citrus', 'Cascade'], ['tropical', 'Galaxy']]) {
  const e = (EG.effetEgal || []).find((x) => x.famille === fam);
  if (!e) { faute(`egalites.effetEgal : ${fam} absent`); continue; }
  const kref = F.find((x) => x.name === ref).key, cible = delta(kref, fam, 4, 'dryPost', 3);
  if (e.reference?.nom !== ref || e.reference?.dose_gL !== 4) faute(`effetEgal ${fam} : référence ${ref} 4 g/L attendue`);
  if (Math.abs((e.cible ?? NaN) - cible) > 0.01) faute(`effetEgal ${fam} : cible ${e.cible} ≠ ${cible}`);
  for (const nom of NOMS) {
    const attendu = doseEffet(F.find((x) => x.name === nom).key, fam, cible, 'dryPost', 3);
    const v = e.doses?.[nom];
    const ok = attendu === null ? v === null && (e.horsGrille || []).includes(nom) : v != null && Math.abs(v - attendu) <= 0.06;
    if (!ok) faute(`effetEgal ${fam} : ${nom} ${v} ≠ ${attendu === null ? 'null (hors grille)' : attendu.toFixed(2)}`);
  }
}
// 4b. IBU égal : dose_gL = ibu ÷ IBU par gramme (moment) ÷ volume.
for (const [m, ibu] of [['b10', 10], ['wp', 5]]) {
  const e = (EG.ibuEgal || []).find((x) => x.moment === m);
  if (!e || e.ibu !== ibu || e.volumeL !== 20) { faute(`egalites.ibuEgal : ${m} ${ibu} IBU, 20 L attendu`); continue; }
  for (const nom of NOMS) {
    const ipg = F.find((x) => x.name === nom).ibuParGramme.moments.find((x) => x.code === m)?.ibuPerGram?.value;
    const attendu = ipg ? ibu / ipg / 20 : null;
    const v = e.doses?.[nom];
    if (attendu == null ? v != null : v == null || Math.abs(v - attendu) > 0.011) faute(`ibuEgal ${m} : ${nom} ${v} ≠ ${attendu?.toFixed(2)}`);
  }
}
// 4c. Option B : concepts sans famille hors génériques, part, seuil, plafond, à corriger.
const B = C.descripteurs?.B || {};
if (B.seuil !== 0.25 || B.plafond !== 0.33 || !B.aCorriger || !(B.generiques || []).length) faute('descripteurs.B : seuil 0.25, plafond 0.33, generiques et aCorriger attendus');
const gen = new Set((B.generiques || []).map((x) => x.toLowerCase()));
for (const nom of NOMS) {
  const f = F.find((x) => x.name === nom), b = B.parts?.[nom];
  const concepts = [...new Set((f.motsSansFamille || []).map((x) => x.mot.toLowerCase()).filter((x) => !gen.has(x)))];
  const part = concepts.length / (mots(f.aromes) + concepts.length || 1);
  if (!b) { faute(`descripteurs.B.parts : ${nom} absent`); continue; }
  if (JSON.stringify([...(b.concepts || [])].sort()) !== JSON.stringify([...concepts].sort())) faute(`B ${nom} : concepts ${JSON.stringify(b.concepts)} ≠ ${JSON.stringify(concepts)}`);
  if (Math.abs((b.part ?? -1) - part) > 0.01 || b.visible !== part >= 0.25 || Math.abs((b.partDessinee ?? -1) - Math.min(part, 0.33)) > 0.01) faute(`B ${nom} : part ${b.part}, visible ${b.visible}, dessinée ${b.partDessinee} (attendu ${part.toFixed(2)}, ${part >= 0.25}, ${Math.min(part, 0.33).toFixed(2)})`);
}
// 4d. Option A : la groseille à maquereau de Nelson Sauvin passe dans Petits fruits.
const A = C.descripteurs?.A || {};
if (A.famille !== 'berries' || !(A.effets?.['Nelson Sauvin']?.deplaces || []).some((m) => /groseille|gooseberry/i.test(m))) faute('descripteurs.A : famille berries et groseille à maquereau déplacée pour Nelson Sauvin attendues');
finir();
