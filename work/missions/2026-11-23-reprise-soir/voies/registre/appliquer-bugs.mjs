// Voie registre (23.11 soir) : met a jour la seule colonne d'etat (6), le commit (7) et la preuve (8) des 30 lignes citees de work/missions/BUGS.md.
// Relit le fichier juste avant d'ecrire, ne touche aucune autre ligne ; refuse une ligne dont le nombre de cellules differe.
import fs from 'node:fs';
const F = 'work/missions/BUGS.md';
const R = 'work/missions/2026-11-23-reprise-soir/voies/registre/en-ligne/';
const T = 'tour26/';
const C = 'work/missions/2026-11-23-carnet-en-ligne/';
const BANC = C + 'banc-liens/mesures/ia-9.json';
const FIN = 'commit en ligne tour 26 (b44b191d3)';
// id : [etat, commit a ajouter (ou null), preuve a ajouter]
const M = {
  'GH-1': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 : revérifié en ligne au tour 26 : lien gastro-held ECO 400 collé dans un carnet ZZ, article lu et rangé (913,90 CHF HT, 22 caractéristiques, 12 photos), 5 à 10,6 s sans coupure ; ' + C + T + 'RAPPORT.md, L5-carte.txt'],
  'GH-2': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 : photos du lien gastro-held lues en ligne (12 photos) ; ' + C + T + 'RAPPORT.md'],
  'GH-3': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 : nom entier « GastroHero Armoire réfrigérée professionnelle ECO 400 GN 1/1 », lien entier gardé, article complet ; ' + C + T + 'L5-carte.txt'],
  'GH-4': ['corrigé (vérifié en ligne tour 26, 23.11)', 'c33a68dc5, 21bd69fd0', '23.11 : en ligne, un lien lu dit « ✓ Article rangé ici, à l’instant » sans « page non lue » (L3, L5, L6) ; « page non lue : adresse introuvable » seulement pour le lien mort (L7) ; retourCarnet.ts:5-12 (état d’après la réponse) ; ' + C + T + 'L3-carte.txt, L7-carte.txt'],
  'BL-4': ['corrigé (vérifié en ligne tour 26, 23.11)', 'c33a68dc5, 21bd69fd0', '23.11 : pages lues en ligne (gastro-held, speidel, Galaxus) : « ✓ Article rangé ici », jamais « page non lue » ; la mention reste pour le lien mort et les pages bloquées ; ' + C + T + 'L3-carte.txt, L5-carte.txt, L7-carte.txt'],
  'BL-5': ['corrigé (vérifié en ligne tour 26, 23.11)', '24099a754, f558a6e28', '23.11 : banc 63 liens rejoué ' + BANC + ' (liens 1 et 2 : photo juste) ; en ligne 12 photos gastro-held ; ' + C + T + 'RAPPORT.md'],
  'BL-6': ['corrigé (vérifié en ligne tour 26, 23.11)', 'b5598cd5f, d57aadea2', '23.11 : caractéristiques 44/48 (92 %) au banc ' + BANC + ' (liens 10, 12, 13, 21, 22, 23 lus) ; en ligne : 22 caractéristiques gastro-held, 4 brouwland, 8 Galaxus ; libellés Galaxus encore en allemand (T26-1, D) ; ' + C + T + 'L6-fiche.txt'],
  'BL-7': ['non vérifiable en ligne (23.11) : coller un lien écrit dans un carnet ; corrigé au banc', 'f558a6e28 (délai de lecture 8 s portée à 12 s)', '23.11 : LIEN_DELAI_MS 8000 puis 12000 au tour 26 (lireLien.ts:23) ; banc ' + BANC + ' lien 22 : Schwerlastregal 180 × 160 × 60 cm, 79,95 CHF, photo, 8 caractéristiques ; la lenteur du serveur vers landi (8,2 s) n’a pas été rejouée en ligne'],
  'BL-8': ['corrigé (au banc rejoué 23.11 ; non rejoué en ligne)', 'f558a6e28, b5598cd5f', '23.11 : banc ' + BANC + ' lien 15 : « Starter pack, 4-valve setup », 879 EUR, photo, redirection suivie ; pas recollé en ligne (écrit)'],
  'BL-9': ['corrigé (vérifié en ligne tour 26, 23.11)', 'f558a6e28, b5598cd5f', '23.11 : en ligne « Kibernetik KS240L » (marque et modèle) ; banc : « Kibernetik KS340L », « Candy CNCQ2T518EB » (liens 17, 18) ; ' + C + T + 'L6-carte.txt'],
  'BL-10': ['corrigé (vérifié en ligne tour 26 sur un lien jumeau, 23.11)', '24099a754', '23.11 : même cause que GH-1 (propertyOrdering) ; en ligne le lien gastro-held ECO 400 est rangé en 5 à 10,6 s sans coupure ; le lien Mastro lui-même n’a pas été recollé ; ' + C + T + 'RAPPORT.md'],
  'BL-11': ['corrigé (vérifié en ligne tour 26, 23.11)', '7d86bf6b6, a2661212d', '23.11 : en ligne « 1 990 € ≈ 1 828 CHF » (speidel), « ≈147 CHF · 159,99 € TTC · douane, port et envoi non comptés » (brouwland), « HT » sur gastro-held, « TTC » sur sios et hopfenmarkt ; ' + C + T + 'B6-fiche.txt, L3-carte.txt, L1-fiche.txt'],
  'BL-12': ['corrigé (vérifié en ligne tour 26, 23.11)', 'f558a6e28', '23.11 : banc lien 8 : produit retiré dit « retire », pas de photo « no-image » ; en ligne Galaxus KS240L : 4 vraies photos ; ' + BANC],
  'BL-13': ['ouvert — présent (revérifié 23.11)', null, '23.11 : le vendeur coupe lui-même son titre à 100 caractères (JSON de la page kegland, relevé par curl 23.11 : « … Stick on Thermomet - KegLand ») ; le banc ' + BANC + ' rend « … Stick on Thermomet » ; couper() (lienProduit.ts:55) ne coupe que nos propres coupures : à faire, retirer le dernier mot incomplet d’un nom de 100 caractères'],
  'BL-14': ['ouvert — présent (revérifié 23.11)', null, '23.11 : src/ui/carnets/Bandeau.tsx:197 affiche l’adresse telle quelle (sans décoder) et :217 cite « votre lien : « adresse » » telle que collée ; seule domaineEtChemin (comparer.ts:898) décode ; non rejoué en ligne avec le lien Mastro (écrit)'],
  'BL-15': ['corrigé (vérifié en ligne tour 26, 23.11)', 'f558a6e28, 21bd69fd0', '23.11 : en ligne lien mort brewtools : « Lien rangé ici · page non lue : adresse introuvable » ; banc lien 21 hornbach : « retire » ; reste la ligne « Lien introuvable » gardée (T26-4, D) ; ' + C + T + 'L7-carte.txt, RAPPORT.md'],
  'CALP-1': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne 390 : poignée de début tirée de 45 px : 23 nov. → 12 oct. 2026, puis → 3 août 2026 (bande S26…) ; parcours local sur fixture : « frise du haut (reculer) S44 → S37 » ; code présent au tag (historique comprimé 875751dcb, les commits cités n’en sont plus ancêtres) ; ' + R + 'c02b-poignee-debut-recule-entiere.png, c03-poignee-debut-recule-2.png'],
  'CALP-2': ['corrigé (vérifié sur fixture locale, 23.11 ; non joué en ligne : il écrit)', null, '23.11 : scripts/parcours/calendrier.mjs sur le tour 26 : « glisser une barre 4 semaines au passé : Hefe S45 → S41 », « Annuler (passé) : S45 », « B8 barre au passé : S53 → S47, dessinée où le doigt l’a lâchée » ; ' + 'work/missions/2026-11-23-reprise-soir/voies/registre/parcours.log'],
  'CALP-3': ['corrigé (vu en ligne tour 26, 23.11 ; critère c non rejoué)', null, '23.11 en ligne : après un toucher de la courbe, aucun rond pointillé ne couvre la frise ; ' + R + 'c04-courbe-touchee.png'],
  'CALP-4': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne 390 : menu de période x 8–308, durées 2 sem., 6 sem., 3 mois, 6 mois, An sans chevauchement ; parcours local « menu de période : 8–308 sur 390 » ; ' + R + 'c01-menu-periode.png, journal.txt'],
  'CALP-5': ['non vérifiable en ligne (23.11) : l’étiquette se juge au glisser d’une barre, geste qui écrit', null, '23.11 : critères e et b2 de controle-cal-passe.mjs non rejoués ; le parcours du 23.11 ne lit pas l’étiquette de durée ; code présent au tag'],
  'CALP-6': ['ouvert — présent pour les brassins (revérifié 23.11) ; corrigé pour les achats de brassin', null, '23.11 en ligne : deux brassins homonymes « Jhhh » (5 et 7 sept., LOT-005 et LOT-007, hors de la frise) se lisent en deux lignes identiques « Jhhh · coût à venir » ; distinguerHomonymes (Rangee.tsx:181) ne traite que les achats liés (brassinLie) ; parcours local : « ligne en double : aucune » ; ' + R + 'c05-brassins-19sem.png, c02b-poignee-debut-recule-entiere.png'],
  'CALP-7': ['corrigé (vérifié sur fixture locale, 23.11 ; non joué en ligne : il écrit)', null, '23.11 : parcours sur le tour 26 : date écrite puis relue après rechargement pour fête, vente, achat, papier, travaux (Jour) ; « Modifier sur place » ; en ligne, la feuille Modifier d’une fête s’ouvre à sa date (12 oct. 2026), fermée sans enregistrer ; ' + R + 'c07-fete-modifier-sur-place.png'],
  'CALP-8': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne 390 : solde négatif de ses données visible : zone rose sous zéro, ligne 0 en tirets, « −1 663 CHF à dépenser » ; ' + R + 'c00-calendrier-ouvert.png'],
  'CALP-9': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne 390 : poignées de la frise x 36–80 et 310–354, 44 × 68 px, entières dans l’écran ; parcours local Calendrier et Finances 44 × 45 ; ' + R + 'c02b-poignee-debut-recule-entiere.png'],
  'CALP-10': ['corrigé en partie (vérifié en ligne tour 26, 23.11) ; doute G3 toujours ouvert', null, '23.11 en ligne : semaine en cours teintée d’un seul bloc (S48) ; icône du format des ventes et loyer mensuel non visibles dans ses données ; parcours local : G3 « filtres au premier plan » 0 visible, « Filtrer par type » est dans le menu : décision du brasseur ; ' + R + 'c00-calendrier-ouvert.png'],
  'CALP-11': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne : une fête touchée s’ouvre en fiche sur place (Modifier, Lier), Modifier ouvre la feuille « Fêtes · Modifier », Fermer ramène au Calendrier ; seule la fête a été jouée (pas d’événement ni d’idée dans ses données) ; ' + R + 'c06-fete-touchee.png, c07-fete-modifier-sur-place.png'],
  'CALP-12': ['corrigé (vérifié en ligne tour 26, 23.11)', null, '23.11 en ligne 390 : Finances › Synthèse › « Calendrier de l’argent » : rangées ventes, achats, travaux, papiers ; Brassins › « Calendrier des brassins » : brassins et ventes ; Bord › Agenda › Gérer : brassins, fêtes, activités ; ' + R + 'c13-section-finances.png, c14-section-brassins.png, c16-agenda-gerer.png'],
  'CALP-13': ['ouvert — présent (revérifié 23.11)', null, '23.11 : en ligne Stocks › Matériel (Carnets) n’a aucun lien de calendrier de section ; au tag seuls LienSection finances (FinancesTab.tsx:146) et brassins (ProductionTab.tsx:218) sont posés ; ' + R + 'c11b-stocks-materiel.png'],
  'CALP-14': ['ouvert — présent (revérifié 23.11) : le parcours existe mais ne bloque plus la mise en ligne', null, '23.11 : deploy-leger.sh (D440) « plus de parcours figé » ; scripts/parcours/calendrier.mjs rejoué sur le tour 26 : 55 ok, ECHEC (3) : controle-base G2 et G10, B9 lecture de la courbe, C1-GLISSER (note G3) ; ' + 'work/missions/2026-11-23-reprise-soir/voies/registre/parcours.log']
};
const lire = () => fs.readFileSync(F, 'utf8');
let texte = lire();
const fin = texte.includes('\r\n') ? '\r\n' : '\n';
const lignes = texte.split(fin);
const fait = [], refus = [];
const avant = {};
for (let i = 0; i < lignes.length; i++) {
  const l = lignes[i];
  if (!l.startsWith('| ')) continue;
  const cel = l.split('|');
  const id = (cel[1] ?? '').trim();
  if (!(id in M)) continue;
  if (cel.length !== 10) { refus.push(id + ' : ' + cel.length + ' cellules'); continue; }
  const [etat, commit, preuve] = M[id];
  avant[id] = cel[6].trim();
  cel[6] = ' ' + etat + ' ';
  if (commit) { const c0 = cel[7].trim(); cel[7] = ' ' + (c0 && !commit.split(', ').every((x) => c0.includes(x)) ? c0 + ', ' + commit : (c0 || commit)) + ' '; }
  cel[8] = ' ' + cel[8].trim() + ' ; ' + preuve + ' ';
  lignes[i] = cel.join('|');
  fait.push(id);
}
const attendus = Object.keys(M);
const manque = attendus.filter((x) => !fait.includes(x) && !refus.some((r) => r.startsWith(x)));
// relecture juste avant l'ecriture : le fichier n'a pas change entre-temps
if (lire() !== texte) { console.log('BUGS.md a change pendant le calcul : relancer'); process.exit(2); }
fs.writeFileSync(F, lignes.join(fin));
console.log(JSON.stringify({ fait: fait.length, refus, manque }));
console.log(JSON.stringify(avant));
