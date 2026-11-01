// Voie d60-diagnostic : met en tableau markdown les sorties de d60-mesure.ts (sorties/d60-mesure.json). Lecture seule, aucun calcul du moteur.
// Lancement : node d60-tableau.mjs  (depuis ce dossier)  →  sorties/tableau.md
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ici = path.dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(readFileSync(path.join(ici, 'sorties/d60-mesure.json'), 'utf8'));
const DEMANDES = ['plus d’agrumes', 'plus de tropicaux', 'plus floral', 'plus de résineux', 'amertume (aucune famille)', 'bannir résineux', 'tropicaux + bannir résineux'];
const lignes = [];
lignes.push('| recette | demande | stock fixture : voies montrées (dont remplacer à 60′) | sans stock : voies montrées (dont remplacer à 60′) | ajouts à 60′ (112 cas) | rang du 1er « remplacer » à 60′ dans la liste complète (stock fixture) |');
lignes.push('|---|---|---|---|---|---|');
for (const [r, v] of Object.entries(j.recettes)) {
  for (const d of DEMANDES) {
    const s = v['stock fixture'][d], n = v['sans stock'][d];
    const e = (s.entonnoirRemplacerAmertume ?? [])[0];
    const rang = e ? (e.rangDuPremierDansLaListeComplete === null ? 'aucun candidat' : `${e.rangDuPremierDansLaListeComplete} (${e.voiesAvantLui.ajouter} ajouts devant)`) : 'pas d’amérisant à 60′ dans la recette';
    lignes.push(`| ${r} | ${d} | ${s.voiesMontrees} (${s.remplacer60Montres.length}) | ${n.voiesMontrees} (${n.remplacer60Montres.length}) | ${s.ajoutsB60 + n.ajoutsB60} | ${rang} |`);
  }
}
const tot = { cas: 0, ajouts60: 0, remp60: 0 };
for (const v of Object.values(j.recettes)) for (const st of Object.values(v)) for (const x of Object.values(st)) { tot.cas++; tot.ajouts60 += x.ajoutsB60; tot.remp60 += x.remplacer60Montres.length > 0 ? 1 : 0; }
lignes.push('', `Total : ${tot.cas} cas (4 recettes × 7 demandes × 2 stocks), ajouts à 60′ montrés : ${tot.ajouts60}, cas avec au moins un « remplacer » à 60′ montré : ${tot.remp60}.`);
writeFileSync(path.join(ici, 'sorties/tableau.md'), `${lignes.join('\n')}\n`);
process.stdout.write(`${lignes.join('\n')}\n`);
