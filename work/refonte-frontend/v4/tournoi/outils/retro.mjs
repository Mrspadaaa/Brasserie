// Rétrospective : le choix du brasseur face au classement du jury, et ce que la grille doit corriger.
// Usage : node work/refonte-frontend/v4/tournoi/outils/retro.mjs <tour2.json> <choix> [« ses mots »]
// <choix> : l'id retenu par le brasseur (ex. p10). Ajoute une ligne à
// work/refonte-frontend/v4/tournoi/retro.md : rang du choix chez le jury, questions (R1, R2,
// R3) où le choix gagnait ou perdait, et l'accord global. Si le choix n'était pas premier,
// imprime GRILLE A CORRIGER avec les questions qui l'ont desservi.
import fs from 'node:fs';
import path from 'node:path';

const [file, choix, ...mots] = process.argv.slice(2);
const t2 = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const rang = t2.classement.indexOf(choix) + 1;
const cle = JSON.parse(fs.readFileSync(path.join(path.dirname(path.resolve(file)), '..', 'captures', 'paires', 'cle.json'), 'utf8'));
// Par question : victoires et défaites constantes du choix (même vainqueur dans les deux ordres).
const parQ = { R1: [0, 0], R2: [0, 0], R3: [0, 0] };
const verdict = (nn, q) => { const v = t2.brut[nn]?.[q]; const { gauche, droite } = cle[nn]; return v === 'G' ? gauche : v === 'D' ? droite : '='; };
const nns = Object.keys(cle);
for (const nn of nns) {
  const { gauche, droite } = cle[nn];
  if (gauche > droite) continue; // une seule fois par paire, ordre canonique
  if (gauche !== choix && droite !== choix) continue;
  const inverse = nns.find((m) => cle[m].gauche === droite && cle[m].droite === gauche);
  for (const q of Object.keys(parQ)) {
    const a = verdict(nn, q), b = verdict(inverse, q);
    if (a !== b || a === '=') continue;
    if (a === choix) parQ[q][0]++; else parQ[q][1]++;
  }
}
const lignes = Object.entries(parQ).map(([q, [g, p]]) => q + ' ' + g + ' gagnées / ' + p + ' perdues');
const md = path.resolve('work/refonte-frontend/v4/tournoi/retro.md');
if (!fs.existsSync(md)) fs.writeFileSync(md, '# Rétrospective : choix du brasseur face au jury\n\n');
fs.appendFileSync(md, '- ' + new Date().toISOString().slice(0, 10) + ' · ' + path.relative(process.cwd(), path.resolve(file)) + ' · choix **' + choix + '**, rang jury ' + rang + '/' + t2.classement.length + ' · ' + lignes.join(' ; ') + (mots.length ? ' · « ' + mots.join(' ') + ' »' : '') + '\n');
console.log('Choix ' + choix + ' : rang ' + rang + ' chez le jury. ' + lignes.join(' ; '));
if (rang !== 1) {
  const faibles = Object.entries(parQ).filter(([, [g, p]]) => p > g).map(([q]) => q);
  console.log('GRILLE A CORRIGER : le jury a desservi son choix sur ' + (faibles.join(', ') || 'aucune question nette (égalités)'));
} else console.log('ACCORD : le jury avait classé son choix en tête');
