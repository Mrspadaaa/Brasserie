#!/usr/bin/env node
// GESTE-DATE-PARTOUT (22.11) — contrôle statique. Défaut du brasseur : « Plus je teste et plus je trouve des endroits où le geste au doigt choisi et
// porté PARTOUT n'a pas été porté.... ???? » (DEFAUTS-RECURRENTS.md, dernière ligne ; BUGS.md CAL-FICHE-FRISE-2).
// Règle : tout choix de date ou de période de l'app passe par la frise partagée au doigt (`ChoixDate` → `DureeFenetre seule pas="jour"`, ou `FrisePeriode`
// pour une période). Le contrôle échoue s'il reste, dans src/, un choix de date maison : champ natif (`type="date"`, `datetime-local`, `month`, `week`),
// `showPicker`, boutons « jour/semaine/mois précédent/suivant » ou « Un jour plus tôt/tard ».
//   node scripts/agents/controle-geste-date.mjs [--racine <dossier>] [--tag <ref git>] [--inventaire]
//     --tag : lit src/ du tag (git archive vers os.tmpdir(), jamais dans l'arbre) ; --racine : un autre arbre ; --inventaire : liste tout, même la liste blanche.
// Sortie : « GESTE-DATE OK » (0) ; sinon « GESTE-DATE ROUGE : n hors liste, m restants » (1) et chaque ligne fautive.
// Deux sortes de liste blanche : `legitime` (la raison dit pourquoi ce n'est pas un choix de date à porter) et `restant` (une dette datée : le contrôle reste rouge).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
let racine = path.resolve(opt('racine') ?? path.join(ICI, '..', '..'));
let aNettoyer = null;
if (opt('tag')) {
  aNettoyer = fs.mkdtempSync(path.join(os.tmpdir(), 'geste-date-tag-'));
  const tar = path.join(aNettoyer, 'src.tar');
  const a = spawnSync('git', ['archive', '--format=tar', '-o', tar, opt('tag'), 'src'], { cwd: racine, encoding: 'utf8' });
  if (a.status !== 0) { console.log(`git archive : ${a.stderr}`); process.exit(2); }
  const x = spawnSync('tar', ['-xf', 'src.tar'], { cwd: aNettoyer, encoding: 'utf8' });
  if (x.status !== 0) { console.log(`tar : ${x.stderr}`); process.exit(2); }
  racine = aNettoyer;
}

/** Les fichiers qui gardent un champ ou un geste de date hors de la frise partagée, et pourquoi. Clé : le chemin depuis src/. */
const LISTE = {
  'components/periode/FrisePeriode.tsx': { genre: 'legitime', raison: 'la frise de période partagée elle-même : ses deux champs « du / au » sont la saisie exacte à côté de la frise' },
  'ui/finance/operations/Bande.tsx': { genre: 'legitime', raison: 'bande de période des opérations : même frise de période (Frise.tsx, geste de la frise B) ; « du / au » en saisie exacte' },
  'ui/ChoixDate.tsx': { genre: 'legitime', raison: 'le composant du geste ; il cite les champs natifs qu\'il remplace en commentaire' }
  /* les restants s'ajoutent ici, genre « restant », avec ce qui manque (voir REPRISE.md) */
};
const MOTIFS = [
  ['champ-natif', /type=\{?["'`](date|datetime-local|month|week)["'`]/],
  ['showPicker', /\.showPicker\s*\?*\.?\(/],
  ['pas-maison', /(aria-label|moins|plus)=\{?["'`](Un jour plus (tôt|tard)|Jour (précédent|suivant)|Semaine (précédente|suivante)|Mois (précédent|suivant))/],
  ['reglette-jours', /<Curseur[^>]*label="Jour de brassage"/]
];

function fichiers(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...fichiers(p));
    else if (/\.(tsx|ts|jsx)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(p);
  }
  return out;
}
const src = path.join(racine, 'src');
const trouvailles = [];
for (const f of fichiers(src)) {
  const rel = path.relative(src, f).replace(/\\/g, '/');
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ligne, i) => {
    const t = ligne.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
    for (const [nom, re] of MOTIFS) if (re.test(ligne)) trouvailles.push({ rel, ligne: i + 1, nom, texte: t.slice(0, 110) });
  });
}
if (aNettoyer) fs.rmSync(aNettoyer, { recursive: true, force: true });

const horsListe = trouvailles.filter((t) => !LISTE[t.rel]);
const restants = trouvailles.filter((t) => LISTE[t.rel]?.genre === 'restant');
const legitimes = trouvailles.filter((t) => LISTE[t.rel]?.genre === 'legitime');
const montrer = (t) => console.log(`  ${t.rel}:${t.ligne} [${t.nom}] ${t.texte}`);
if (args.includes('--inventaire')) {
  console.log(`liste blanche légitime (${legitimes.length}) :`); legitimes.forEach(montrer);
  console.log(`restants (${restants.length}) :`); restants.forEach(montrer);
}
if (horsListe.length || restants.length) {
  console.log(`GESTE-DATE ROUGE : ${horsListe.length} hors liste, ${restants.length} restants`);
  const fichiersHors = new Set(horsListe.map((t) => t.rel));
  console.log(`  ${fichiersHors.size} fichiers hors liste`);
  horsListe.slice(0, 60).forEach(montrer);
  if (horsListe.length > 60) console.log(`  … ${horsListe.length - 60} de plus`);
  restants.slice(0, 20).forEach((t) => console.log(`  RESTANT ${t.rel}:${t.ligne} — ${LISTE[t.rel].raison}`));
  process.exit(1);
}
console.log(`GESTE-DATE OK (${legitimes.length} occurrences en liste blanche légitime)`);
