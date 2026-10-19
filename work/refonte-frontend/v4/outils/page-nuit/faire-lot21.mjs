// Prépare lot21.json pour la page des fils de fer : les premiers écrans des variantes du lot 21, les
// cinq candidates du critique d'abord (★). r1 (un « null », en correction), u1 et u2 (emojis, sans
// baseline) ne sont pas montrées telles quelles, comme le demande la synthèse du critique.
import fs from 'node:fs';
import path from 'node:path';

const C = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/';
const V = [
  ['y1-premier-ecran.png', '★ y1 le brassin au doigt'],
  ['x3-haut-390.png', '★ x3 ma cuve, jour après jour'],
  ['v1-haut-390.png', '★ v1 le duel à dose égale'],
  ['s3-premier-ecran-390.png', '★ s3 la carte des possibles'],
  ['w3-haut-390.png', '★ w3 dessine ta bière'],
  ['w1-haut-390.png', 'w1 la phrase qui répond'], ['x1-haut-390.png', 'x1 ligne de recette'],
  ['s1-premier-ecran-390.png', 's1 la ligne du brassage'], ['s2-premier-ecran-390.png', 's2 trois plans côte à côte'],
  ['v2-haut-390.png', 'v2 pourquoi 10′, pas 60′'], ['v3-haut-390.png', 'v3 calendrier du dry hop'],
  ['r2-haut-390.png', 'r2 la frise des jours'], ['r3-haut-390.png', 'r3 la carte du style'],
  ['e1-haut.png', 'e1 deux classements'], ['e2-haut.png', 'e2 le duel Citra / Cascade'], ['e3-haut.png', 'e3 les plans, du sage à l’osé'],
  ['a1-haut-390.png', 'a1 deux houblons, un dry hop'], ['a2-haut-390.png', 'a2 ce que la levure en fait'], ['a3-haut-390.png', 'a3 mon plan de houblonnage'],
  ['a4-haut-390.png', 'a4 le gramme suivant'], ['a5-haut-390.png', 'a5 le duel de deux plans'], ['a6-haut-390.png', 'a6 ensemble ou à la suite'],
  ['x2-haut-390.png', 'x2 l’escalier à dose égale'], ['x4-haut-390.png', 'x4 le conseiller'], ['x5-haut-390.png', 'x5 le verre et le défi'],
  ['w2-haut-390.png', 'w2 sage, franc, osé'], ['w4-haut-390.png', 'w4 tes questions'], ['w5-haut-390.png', 'w5 ça ne marchera pas'],
  ['y2-premier-ecran.png', 'y2 la cuve, jour par jour'], ['y3-premier-ecran.png', 'y3 la molette de dose'],
  ['y4-premier-ecran.png', 'y4 les levures en cartes'], ['y5-premier-ecran.png', 'y5 une bière possible'],
  ['z1-haut-390.png', 'z1 la table de brassage'], ['z2-haut-390.png', 'z2 les deux verres'], ['z3-haut-390.png', 'z3 où atterrit ma bière'],
  ['z4-haut-390.png', 'z4 la phrase'], ['z5-haut-390.png', 'z5 le pari'],
  ['u3/moment-01-avant-10min.png', 'u3 le chaudron (série libre)'], ['u4/nuage-01-avant-citra-cascade.png', 'u4 100 bières possibles (série libre)'],
  ['u5/mur-01-avant-premier-ecran.png', 'u5 le mur des preuves (série libre)'], ['u6/carte-01-avant-au-nez-citra-cascade.png', 'u6 choisir à deux (série libre)'],
];
const manquent = V.filter(([f]) => !fs.existsSync(C + f));
if (manquent.length) { console.log('MANQUENT', manquent.map((m) => m[0]).join(', ')); process.exit(1); }
const lot = {
  ticket: 119,
  ancre: 't119-lot21',
  court: 'lot 21 : 41 variantes',
  titre: 'Mieux comprendre, mieux choisir : vraies valeurs, simulation, simulateur (lot 21, 41 variantes v0, 20.10 nuit)',
  etat: 'exploration : à regarder ; 5 en amélioration',
  puces: [
    'Tes mots : « C\'est très difficile à comprendre » (le lot 20) ; « Des vrai donné, mieux présenté, mais aussi des simulation, simulateur » ; « Les deux se complément » ; « il faut que ça se voit pas que ce soit effacé ».',
    'Dix séries, une quarantaine de variantes, toutes branchées sur le nouveau profil simulé (12 familles, au style de ta 16D, toujours marqué « ~ ») et sur 10 études mesurées en bière. Les vraies valeurs sont à côté, et les plages énormes se montrent en entier.',
    'Le critique, calibré sur tes verdicts, a joué un geste sur chacune. Ses cinq, une par question : y1 le brassin au doigt (quand), x3 ta cuve jour après jour (combien de jours), v1 le duel à dose égale (Citra ou Cascade), s3 la carte des possibles (jusqu\'où), w3 dessine ta bière (quoi mettre). Elles sont en seconde passe chez leurs auteurs.',
    'Ce qui ne va pas, commun à toutes : trop d\'explications au premier écran ; la levure qui ne fait rien à l\'état de départ (dry hop après) ; quelques codes sans mot. C\'est corrigé dans la seconde passe. Relancés sur un angle précis : r3, a2 et le ladder.',
    'Les chiffres de ces images datent d\'avant une correction du moteur (bière à 4,75 % vol., source vérifiée) : environ −4 %, et Citra à 10′ ne sort plus du style en agrumes. Les cinq améliorées porteront les bons chiffres.',
    'Leçons de brasseur sorties du lot : doubler la dose ne double pas l\'arôme (×1,5, mesuré) ; la levure pèse peu, le CO₂ emporte plus ; à la suite, c\'est plus tard, pas plus ; il faudrait ~10,7 g/L de Cascade pour un Citra à 4 g/L en agrumes, et jamais en tropical.',
  ],
  images: V.map(([f, l]) => [C + f, l]),
};
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'lot21.json'), JSON.stringify(lot, null, 1) + '\n');
console.log('lot21.json · ' + V.length + ' images');
