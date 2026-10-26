#!/usr/bin/env node
// Voie g2c (26.10) : met à jour les trois états de Suggérer dont SEULES les données ont changé par D90 (comme e3 : verif.attendu prend les nouvelles
// valeurs, verif.choisie garde les anciennes, verif.note écrit la raison). Rejouable une seule fois. Usage : node maj-etats.mjs [--ecrire]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ici, '../../../../../work/refonte-frontend/v4/choix/etats');
const ecrire = process.argv.includes('--ecrire');
const BASE = 'D90, g2c, 26.10 : une famille « moins » n’exclut plus un houblon pour une fiche isolée (Target, Cascade, Citra cryo n’ont plus de conflit sur la stout) ; dessin identique';
const CAPT = (id) => `capture après regardée : work/missions/2026-10-25-integration-houblons/voies/g2c-exclusion-style/captures/${id}-construite.png ; l’avant est la même page sur HEAD (ETATS OK 138/138)`;
const MAJ = [
  { f: 'suggerer', id: 'etat-sugg-plus', remplacer: [['Comparer (3)', 'Comparer (4)']],
    raison: `${BASE} : la page s'ouvre avec trois voies cochées au lieu de deux (Target, sans conflit, l'est maintenant), donc « + » sur Aurum donne « Comparer (4) » ; même ✓ sur Aurum, même barre.` },
  { f: 'acquis', id: 'etat-acquis-plus-comparer', remplacer: [['Comparer (3)', 'Comparer (4)']],
    raison: `${BASE} : même geste que etat-sugg-plus (« + » sur Aurum) ; trois voies cochées d'avance, donc « Comparer (4) ».` },
  { f: 'suggerer', id: 'etat-sugg-dry-hop', remplacer: [['20 g', 'Target'], ['Motueka', 'Motueka']], ajouter: ['5 g'],
    raison: `${BASE} : la section « Dry hop · actif · estimé » s'ouvre sur Target 5 g (sans conflit, devant Motueka 20 g) ; mêmes pastilles de biotransformation et « creep », même barre.` },
];
const parFichier = {};
for (const m of MAJ) {
  const chemin = path.join(DOSSIER, `${m.f}.json`);
  parFichier[m.f] ??= { chemin, j: JSON.parse(fs.readFileSync(chemin, 'utf8')) };
  const s = parFichier[m.f].j.etats.find((x) => x.id === m.id);
  if (!s) { console.log(`MAJ ECHEC : ${m.id} absent de ${m.f}.json`); process.exit(1); }
  if (s.verif.choisie) { console.log(`MAJ ECHEC : ${m.id} déjà mis à jour (verif.choisie présent)`); process.exit(1); }
  const vieux = s.verif.attendu ?? [];
  for (const [a] of m.remplacer) if (!vieux.includes(a)) { console.log(`MAJ ECHEC : ${m.id} n'attend pas « ${a} »`); process.exit(1); }
  const carte = new Map(m.remplacer);
  const neuf = vieux.map((x) => carte.get(x) ?? x);
  for (const a of m.ajouter ?? []) if (!neuf.includes(a)) neuf.push(a);
  s.verif.attendu = neuf;
  s.verif.choisie = { attendu: vieux };
  s.verif.note = `${m.raison} (${CAPT(m.id)}.)`;
  console.log(`${m.id} : ${JSON.stringify(vieux)} → ${JSON.stringify(neuf)}`);
}
if (ecrire) for (const { chemin, j } of Object.values(parFichier)) fs.writeFileSync(chemin, JSON.stringify(j, null, 1) + '\n');
else console.log('(rien écrit ; --ecrire pour écrire)');
