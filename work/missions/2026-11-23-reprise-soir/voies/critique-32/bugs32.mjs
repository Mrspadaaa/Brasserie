import fs from 'node:fs';
const F = 'work/missions/BUGS.md';
const C = (n) => n.split(',').map((x) => `work/missions/2026-11-23-reprise-soir/voies/critique-32/cap/${x.trim()}.png`).join(', ');
const V = '9f407872e';
const T = 'tour 32, 23.11, en ligne index-C_UsO3yZ.js';
const etats = {
  'T29-1': [`vérifié (${T} : période 01.01.24–31.12.27 → « 4 ans », cadre 1 janv. 2024 – 2 janv. 2028, axe 2024…2028 ; poignée de début en butée, « début » sur la courbe ; ${C('R1-02-plage4ans, R1-03-debut-gauche')})`, V],
  'T29-2': [`en cours — ${T} : › avance et la frise suit (24.11.27–23.11.31), mais les bornes 01.01–31.12 sont perdues, voir T32-3 ; ${C('R1-08-suivante')}`, V],
  'T29-3': [`vérifié (${T} : à 6 mois, 150 px à gauche, 14 déc. → 24 août, échelle gardée, barre sous le doigt ; ${C('R7-c-6mois-gauche150-pendant')})`, V],
  'T29-4': [`vérifié (${T} : le nom est un bouton, la case est à part ; le nom ouvre « Calendrier · Agenda » sans cocher ; la case coche puis décoche la ZZ seule, vraies lignes inchangées ; reste T32-4 ; ${C('R11-01-nom-zz, R11-02-case-zz')})`, V],
  'T29-5': [`vérifié (${T} : à 6 sem., « S36 · 31 août · lâcher ici » sous la barre, sans la couvrir ; ${C('R7-d-6sem-droite60-pendant')})`, V],
  'T29-6': [`ouvert — présent (${T} : barre tenue au bord droit à 6 sem. → la frise passe à 7, 8, 12 puis 16 sem., la barre descend sous le « + » puis hors de l’écran (y 608 → 1046), posée le 14 déc. hors du cadre 27 juil. – 15 nov. ; au bord gauche, 6 → 11 sem., barre hors de l’écran, posée le 1 juin hors du cadre 22 juin – 6 sept. ; ${C('R7-a-6sem-bord-droit-pendant, R7-a-6sem-bord-droit-apres, R8-03-bord-gauche-pendant')})`, ''],
  'T29-7': [`vérifié (${T} : « 2024 J S 2025 M J S 2026 M J S N » ; ${C('R1-04-fin-gauche100')})`, V],
  'T29-8': [`ouvert — présent (${T} : An, « S O N D J F M A M J J A S O N D J », sans année à janvier ; ${C('R4-An')})`, ''],
  'T29-9': [`vérifié (${T} : « vide » ou un montant, « −2 900 probable » ; ${C('R5-07-fin-droite3')})`, V],
  'T29-10': [`vérifié (${T} : « prévu S1 2024–S52 2027 », « prévu S9 2027–S47 2031 » ; ${C('R1-02-plage4ans, R5-07-fin-droite3')})`, V],
  'T29-11': [`vérifié (${T} : « ‹ auj. » est le bouton « Revenir à aujourd’hui » → S48–S49 ; l’en-tête ne suit pas, voir T32-1 ; ${C('R5-01-touche-auj')})`, V],
  'T29-12': [`vérifié (${T} : « 2 ans ½ », « 22 mois », « 4 ans ½ », « 8 ans » ; ${C('R1-04-fin-gauche100, R5-07-fin-droite3')})`, V],
  'T28-16': [`vérifié (${T} : à 3 mois, 72 px à droite, 23 nov. → 14 déc., échelle gardée, date = étiquette ; ${C('R6-a-3mois-droite72-pendant, R6-a-3mois-droite72-apres')})`, V],
  'CALP-5': [`vérifié (${T} : l’étiquette ne couvre plus la barre à 3 mois, 6 mois ni 6 sem. ; à 3 mois, elle cache encore le nom, voir T32-8 ; ${C('R6-a-3mois-droite72-pendant, R7-d-6sem-droite60-pendant')})`, null],
  'CALP-6': [`ouvert — présent (${T} : à 3 et 4 ans, deux lignes identiques « Jhhh · coût à venir » ; ${C('R1-02-plage4ans, R8-00-3ans')})`, null],
  'CALP-13': [`ouvert — présent (${T} : Stocks et Stocks › Matériel n’ont aucun lien de calendrier ; ${C('R10-Materiel')})`, null],
};
const S = 'Test en ligne, tour 32';
const E = (x) => `Calendrier, ${x} (390 px, en ligne index-C_UsO3yZ.js)`;
const neufs = [
  ['T32-1', E('en-tête et frise'), 'Régler la période 14.12–27.12, puis toucher « ‹ auj. » ; ou la période 21.12.26–03.01.27, puis l’échelle Jour ; ou ouvrir le calendrier de l’argent avec la période 27.07–06.09 → observé : la frise montre S48–S49 ou 23 nov. 2026 – 7 févr. 2027, l’en-tête dit toujours « 14.12–27.12 », « 21.12.26–03.01.27 » ou « 27.07–06.09 » ; après les poignées (22 mois, 8 ans), l’en-tête garde 01.01.24–31.12.27, et régler à nouveau cette même période ne recadre pas la frise ; attendu : un seul état, l’en-tête dit le cadre de la frise', 'B', 'R5-01-touche-auj, R3-01-jour, R10-Finances, R1-06-fin-droite120'],
  ['T32-2', E('échelle Jour / Semaine / Mois'), 'Période 21.12.26–03.01.27 (S52–S53), puis toucher Jour, Semaine ou Mois → observé : le cadre revient à aujourd’hui (S48–S49, 23 nov. – 3 janv., 23 nov. – 23 mai) ; attendu : l’échelle change autour du cadre choisi', 'm', 'R3-00-periode-fin-annee, R3-01-jour'],
  ['T32-3', E('Période suivante'), 'Depuis 01.01.24–31.12.27, toucher › puis ‹ → observé : 24.11.27–23.11.31 (cinq semaines en commun avec la période d’avant), puis 24.11.23–23.11.27 ; ‹ ne revient pas au 01.01.24 ; attendu : 01.01.28–31.12.31, puis retour à 01.01.24–31.12.27', 'm', 'R1-08-suivante, R1-09-precedente'],
  ['T32-4', 'Bord › Agenda, nom d’une ligne (390 px, en ligne index-C_UsO3yZ.js)', 'Toucher le nom « ZZ TEST — barre » (Travaux, 31.08.2026) → observé : « Calendrier · Agenda » s’ouvre sur 23 nov. 2026 – 7 févr. 2027, sans rangée Travaux : la chose touchée n’y est pas ; attendu : le calendrier montre la chose touchée, sa rangée et sa date', 'm', 'R11-01-nom-zz'],
  ['T32-5', E('en-tête, solde'), 'Solde « −4 563 CHF à dépenser » → observé : « dépenser » passe sous le bouton « ± » (bord du texte à 149 px, bouton à 146 px) ; attendu : le texte entier, sans chevauchement', 'm', 'R8-01-entete-zoom'],
  ['T32-6', E('frise 16 sem., rangée Brassins'), 'Cadre 27 juil. – 15 nov. → observé : la barre de la Hefe montre « H… » et « −5 + à venir » ; le nom est coupé, le montant reste ; attendu : le nom d’abord', 'm', 'R7-a-6sem-bord-droit-apres'],
  ['T32-7', E('Annuler après un glisser'), 'Barre ZZ tenue au bord gauche à 6 sem., puis Annuler → observé : la date revient (1 juin → 31 août), la frise reste à 11 sem. ; attendu : la vue d’avant le geste, 6 sem.', 'D', 'R8-03-bord-gauche-pendant, R8-05-annuler'],
  ['T32-8', E('barre glissée à 3 mois'), 'Glisser la barre ZZ de 72 px à droite → observé : « S51 · 14 déc. · lâcher ici » cache le nom de la barre (« ZZ TEST — b… ») ; attendu : l’étiquette hors du nom (suite de CALP-5)', 'D', 'R6-a-3mois-droite72-pendant'],
];
let txt = fs.readFileSync(F, 'utf8');
const lignes = txt.split('\n');
let maj = 0;
for (let i = 0; i < lignes.length; i++) {
  const m = /^\| ([A-Z0-9-]+) \|/.exec(lignes[i]); if (!m || !etats[m[1]]) continue;
  const c = lignes[i].split(' | ');
  c[5] = etats[m[1]][0]; if (etats[m[1]][1] !== null) c[6] = etats[m[1]][1] || ' ';
  lignes[i] = c.join(' | '); maj++;
}
txt = lignes.join('\n').replace(/\n*$/, '\n');
if (!txt.includes('| T32-1 |')) txt += neufs.map(([id, ecran, constat, g, cap]) => `| ${id} | ${S} | ${ecran} | ${constat} | ${g} | ouvert — présent |   | tour 32, test d’écran en ligne 23.11 ; capture ${C(cap)} |`).join('\n') + '\n';
fs.writeFileSync(F, txt);
console.log('mis à jour', maj, 'sur', Object.keys(etats).length);
