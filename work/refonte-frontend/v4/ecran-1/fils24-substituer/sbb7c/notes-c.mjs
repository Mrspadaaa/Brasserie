// NOTE.md de sbb7c (passe 3) : corrections du verdict du critique (critique/PASSE2.md), nombres recomptés sur le
// moteur (donnees-sbb.json via socle-c.mjs), sorties des contrôles. Usage : node notes-c.mjs <sorties.txt>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-c.mjs';
const ici = path.dirname(fileURLToPath(import.meta.url));
const fr = S.fr, f1 = (x) => fr(x, Number.isInteger(x) ? 0 : 1);
const sortie = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => /^(COMMUN|UNE-QUESTION|MOTS|COHERENCE|SANS-FAMILLE)|^sbb7c [0-9]/.test(l)).map((l) => '  - ' + l.trim()).join('\n');
const montres = (E) => { const st = E.cands.filter((c) => c.stock.etat === 'en stock'); return [...[...new Set([...st.slice(0, 2), E.rep, E.C['nelson-sauvin'], ...st])].slice(0, 4), ...E.achat.slice(0, 4)]; };
const ligne = (c) => `${c.nom} : ${c.plage ? '~' + c.plage.join('–') + ' (moteur ' + c.score + ')' : '~' + c.score} ${c.palier} · ~${c.dose.min !== c.dose.max ? c.dose.min + '–' + c.dose.max : c.dose.grams} g · α ${c.lot ? fr(c.alpha.valeur, 1) : c.alphaPl.map(f1).join('–')} · 46 g = ${c.ibu46.map((x) => fr(x, 1)).filter((x, i, t) => t.indexOf(x) === i).join('–')} IBU · ${c.stock.etat === 'à acheter' ? 'à acheter' : fr(c.stock.libre) + ' g' + (c.manque != null ? ' −' + c.manque : ', reste ' + c.reste)}${c.rangGeneral ? ' · ' + c.rangGeneral + 'e' : ''}`;
const rec = ['b60', 'wp'].map((m) => { const E = S.ETATS[m]; return `- ${E.mo.mot} (Nugget 46 g = ${fr(E.nug.ibu, 2)} IBU ; réponse : ${E.rep.nom} ; si tu achètes : ${E.achatSur.nom}) :\n` + montres(E).map((c) => '  - ' + ligne(c)).join('\n'); }).join('\n');
const md = `# sbb7c · Substituer, passe 3 de sbb7 : la cible (chaude)

Chaleur : chaude (passe 3, depuis sbb7b, qui reste). Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; contexte : stout 16D, Nugget 46 g à 60′ ou au whirlpool (bouton \`data-edite="moment"\` et sa feuille), « même IBU ».

- **Idée** : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock, à droite l’achat ; la réponse est le point cerclé ; la boîte touchée ouvre sa carte (α, dose, IBU à 46 g, reste, rang sur 318, composantes, ma bière).
- **Corrections du verdict (REJET de sbb7b, D10)** : quatre boîtes par côté (deux premiers du moteur, la réponse, Nelson Sauvin), hauteur 66 px dans un cadre de 330 px : chaque boîte entière dans le cadre et dans 390 px, mesuré au DOM dans les deux états (capturer-c.mjs : aucune boîte hors cadre, aucun texte qui déborde, aucun chevauchement point/boîte à 3 px près ; 16 éléments à 60′ et au whirlpool) ; la légende en mots (suffit · stock court · score ouvert · très proche (80), D90) ; Nelson Sauvin jamais « ~42 » sec : plus de la moitié de ses mots sans famille, sa composante d’arôme est ouverte, « ~29–89 » au whirlpool, « ~66–86 » à 60′, avec la raison sur sa carte (« autres 83 % sans famille : arôme du moteur 21 / 100 ») ; le cercle 50 retiré, les cercles 65 et 80 visibles entre les colonnes ; le mot de l’échelle sous le score de la carte (« très proche », « partiel ») ; radar et arômes de u4 à un toucher (« arômes › » ouvre la fiche) ; le rang du moteur sur la carte (« 76e sur 318 », style 16D).
- **Ce qui casse** : les lignes des boîtes sont serrées (texte à 1 px du bord, mesuré non tranché) ; Sabro sort du stock montré au whirlpool (la 5e boîte n’existe plus, Sabro reste dans la fiche et le classement du moteur) ; la carte du bas est longue.

Reste de sbb7b inchangé : « Annuler » à côté de « Remplacer » (D120) ; « ~ » et plages hachurées sur scores et doses ; α du lot ou plage des fiches ; stock et manque sur chaque boîte ; « Si tu achètes : … » ; poids de méthode derrière « ? » ; marqueurs \`data-ibu46\`, \`data-dose\`, \`data-alpha\` (D124). Baseline suivie, aucun écart.
Fichiers : \`sbb7c/generer-c.mjs\`, \`socle-c.mjs\`, \`donnees-sbb.json\` (copie de sbb7b, moteur du parcours en direct par \`moteur-sbb.ts\`), \`capturer-c.mjs\`, \`notes-c.mjs\`.

## Nombres recomptés sur le moteur (les huit boîtes de chaque état)
${rec}

## Captures (ouvertes)
\`captures/sbb7c-60.png\`, \`captures/sbb7c-whirlpool.png\`, \`captures/sbb7c-page.png\`, \`captures/sbb7c-whirlpool-page.png\`, \`captures/sbb7c-feuille-moment.png\`, \`captures/sbb7c-geste.png\` (Galaxy touchée), \`captures/sbb7c-fiche.png\`.

## Contrôles
${sortie}
`;
fs.writeFileSync(path.join(ici, 'NOTE.md'), md);
console.log('NOTE', md.length);
