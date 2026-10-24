// Outil de travail de r6p3 : réécrit la section « ## Reprise » de NOTE.md depuis celle de r6n2, avec les lignes
// que le bandeau du défi change. Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/note-reprise.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(ICI, '../r6n2/NOTE.md'), 'utf8');
const r = src.split('## Reprise')[1].split('\n## ')[0].trim().split('\n');
const set = (id, txt) => { const i = r.findIndex((l) => l.startsWith('- ' + id + ' :')); if (i < 0) throw new Error(id); r[i] = '- ' + id + ' : ' + txt; };
set('y1b-defi', 'repris — au premier écran, le bandeau « ton défi » sous la réponse (un toucher ouvre la feuille Défi) ; le dock « Défi 2/4 » y mène aussi : score par houblon, amertume, 16D');
set('l5b-pistes-objectif', 'repris — au premier écran, le bandeau : une piste par objectif (Floral ↑, Résineux ↓), zone de ta 16D pâle, trait de ta stout, visée en pointillé, barre du houblon mis en avant, verdict en mot ; en grand dans la feuille Défi');
set('w2-piste-commune', 'repris — au premier écran, le bandeau : un rond lettré par houblon (I, C, G, N) sur la même piste ; deux ronds proches passent l’un sous l’autre, jamais décalés en largeur');
set('l8b-verdicts-pictos-trait', 'repris — bandeau : signe et mot du verdict du houblon mis en avant (Atteint, Approche, Aucune) ; feuille Défi : les trois ; pictos au trait partout');
set('m4-radar-degustation', 'en contexte — colonne « Ta stout » : ♣ ↓ et ❀ ↑, ta dégustation du 18.10, en signes (les mots « trop » et « plus » sont passés au bandeau)');
set('y1b-second-houblon-puis', 'en pont — Dryhopper ; feuille Frise : la case « puis » et son « + », lien « enchaîner Idaho 7 puis Galaxy », noms pris dans les données du cas');
set('v1-vraies-valeurs', 'repris — feuille Valeurs : α, β, huile, dans les colonnes des houblons, sourcés ; un losange par lot réel (CoA) sur l’huile et la chimie');
set('l8b-legende-cachee', 'repris — le « ? » en haut à droite ; la légende dit aussi le bandeau du défi et le dock');
set('h4-radar-demande', 'repris — au radar : flèche verte vers l’extérieur (floral), orangée vers le centre (résineux) ; les mêmes flèches ouvrent les deux pistes du bandeau');
const p = path.join(ICI, 'NOTE.md');
const note = fs.readFileSync(p, 'utf8');
const [avant, reste] = note.split('## Reprise\n');
const apres = reste.slice(reste.indexOf('\n## '));
fs.writeFileSync(p, avant + '## Reprise\n\n' + r.join('\n') + '\n' + apres);
console.log('NOTE : reprise écrite (' + r.length + ' lignes)');
