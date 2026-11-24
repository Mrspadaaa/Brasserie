// Met à jour l'état des lignes E35 et ajoute les lignes E38 en fin de work/missions/BUGS.md
import fs from 'node:fs';
const F = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md';
const C = 'work/missions/2026-11-23-reprise-soir/voies/critique-38e/cap/';
const V = 'en ligne index-DU-8kJuj.js, critique-38e 23.11';
const etats = {
  'E35-1': ['vérifié — ' + V + ' : les 3 récurrentes retirées, aucune prévision ZZ restée, à dépenser −463 revenu', '1761845a5'],
  'E35-2': ['en cours — total « à encaisser » corrigé ; reste : apports dessinés et comptés « reçu » dans la rangée Ventes, voir E38-1', ''],
  'E35-3': ['en cours — Opérations dit « Autre entrée » ; reste : comptée en ventes partout ailleurs, voir E38-2', ''],
  'E35-4': ['ouvert — non reproduit hors du bord (' + V + ' : 21.11 montré = 21.11 lâché ; 80 pas lents : 1 nov. puis défilement au bord, 13.10 lu, 12.10 lâché)', ''],
  'E35-5': ['vérifié — ' + V + ' : « + autre » ouvre « Client : un nom, ou créer », 5 clients proposés, « Créer « ZZ » »', '8eb141472'],
  'E35-6': ['en cours — plus de dette ; reste : « Le paiement suit » déplace le paiement à aujourd’hui, voir E38-3', ''],
  'E35-7': ['vérifié — ' + V + ' : bouton « À recevoir +4,80 »', '8eb141472'],
  'E35-8': ['vérifié — ' + V + ' : à payer / à recevoir, curseur bloqué au 23.11 avec « Pas de date après le 23 nov. »', '8eb141472'],
  'E35-9': ['vérifié — ' + V + ' : Vente à recevoir en pastille pointillée, « à payer / à recevoir » dans chaque libellé', '1761845a5'],
  'E35-10': ['vérifié — ' + V + ' : Achat 18.11, Autre sortie 19.11, Pour moi 21.11 dessinés', '1761845a5'],
  'E35-11': ['en cours — Modifier a Règlement, compte, note, coche ; reste : autre fiche que la saisie, voir E38-4', ''],
  'E35-12': ['vérifié — ' + V + ' : Ouvrir depuis le Calendrier ne pose plus de recherche, Opérations sans filtre au retour', '8eb141472'],
  'E35-13': ['ouvert — présent (' + V + ' : Apport et Pour moi sans Revient ni TVA/référence, carte de fin avec ligne de compte ; cap/PL-fin2.png)', ''],
  'E35-14': ['vérifié — ' + V + ' : toucher la piste à droite porte la date au 23.11', '8eb141472'],
  'E35-15': ['vérifié — ' + V + ' : « Pour moi · Prélèvement privé »', '1761845a5'],
  'E35-16': ['en cours — Opérations dit « Impôts » ; reste : étiquette et groupe « Autres frais », voir E38-7', ''],
};
const L = (id, ou, obs, g, cap) => `| ${id} | Test en ligne, tour 38 (écritures) | ${ou} (390 px, en ligne index-DU-8kJuj.js) | ${obs} | ${g} | ouvert — présent |   | tour 38, test d’écran en ligne 23.11 ; capture ${cap.map((c) => C + c).join(', ')} |`;
const neuves = [
  L('E38-1', 'Calendrier, rangée Ventes', 'Apport ZZ +5 (21.11) et le vrai « De ma poche +1 200 » → observé : tous deux dessinés dans la rangée Ventes ; sans vente à encaisser, l’en-tête dit « +1 200 reçu S48–S53 » : un apport compté comme vente reçue (suite de E35-2) ; attendu : apports hors de la rangée et du total Ventes', 'B', ['N8-cal.png', 'F2-cal.png']),
  L('E38-2', 'Saisir à la main › Ça rentre › Autre (pas un prêt), puis Finances', 'Enregistrer ZZ TEST — Autre entrée +1,10 → observé : étiquette « Ventes » dans la saisie et la carte de fin, Mon mois +1,10, Opérations rangée sous « Ventes +5,90 », Synthèse « Entré 5,90 · 2 ventes », pastille « +6 Ventes » (suite de E35-3) ; attendu : une autre rentrée n’est pas une vente', 'B', ['R3-18-fin.png', 'O1-operations.png']),
  L('E38-3', 'Finances › Opérations › ZZ TEST — Achat (payé 18.11, 3,50) › Modifier', 'Montant 3,50 → 4,50, choix par défaut « Le paiement suit », Enregistrer → observé : « payé aujourd’hui » au lieu du 18 nov., et au Calendrier un second « ZZ TEST — Achat, 23 nov., −1 » à côté de « 18 nov., −4 » (suite de E35-6) ; attendu : corriger une faute de frappe garde la date du paiement, un seul paiement de 4,50 le 18.11', 'B', ['N1-achat-montant.png', 'N2-achat-enregistre.png', 'N8-cal.png']),
  L('E38-4', 'Finances › Opérations › écriture › Modifier (Achat et Vente)', 'Ouvrir Modifier → observé : autre fiche que la saisie : champs en colonnes (Nom, Catégorie, Précision, Date, Montant « sans TVA »), pas de Revient, pas de pastille de date ni de curseur (suite de E35-11) ; attendu : les blocs de la saisie', 'm', ['M8-achat-modifier.png', 'N6-vente-modifier.png']),
  L('E38-5', 'Saisir à la main, curseur de date (Achat, Vente, Payé / Reçu)', 'Glisser le curseur vers le passé → observé : pastille et titre suivent (18.11), mais le bouton reste « Payé aujourd’hui » / « Reçu aujourd’hui » jusqu’au lâcher ; attendu : « Payé » dès que la date n’est plus aujourd’hui', 'm', ['A1-05-curseur-pendant.png', 'G3-doigt-arrete.png']),
  L('E38-6', 'Calendrier, récurrentes à payer (Salaire mois, Loyer trim.)', 'ZZ Salaire et Loyer à payer d’ici le 23.12, Revient → observé : la 1re occurrence est placée à son échéance (23 déc.), les suivantes à leur date sans délai : deux « Salaire −5 » le 23 déc., Loyer 2e au 23 févr. (échéance 23 mars) ; à dépenser compte deux salaires en S52 ; attendu : chaque occurrence à son échéance', 'm', ['K0-3.png', 'M1-cal-6sem.png']),
  L('E38-7', 'Saisir à la main › Impôts › Impôt sur la bière, puis Opérations', 'Enregistrer ZZ TEST — Impôts → observé : étiquette « Autres frais » dans la saisie et la carte de fin, ligne rangée sous « Autres frais 134,20 » aux Opérations (libellé « Impôts » seul corrigé, suite de E35-16) ; attendu : « Impôts » partout', 'D', ['A5-18-fin.png', 'O1-operations.png']),
  L('E38-8', 'Saisir à la main, compte « Banque ⌄ »', 'Toucher le compte 4 fois → observé : Banque → Espèces → TWINT → Autre → Banque, sans liste ; le chevron annonce une liste ; attendu : la liste des comptes, ou pas de chevron', 'D', ['G2-compte-1.png']),
];
let t = fs.readFileSync(F, 'utf8');
const nl = t.includes('\r\n') ? '\r\n' : '\n';
let n = 0;
t = t.split(nl).map((l) => {
  const m = /^\| (E35-\d+) \|/.exec(l); if (!m || !etats[m[1]]) return l;
  const c = l.split(' | '); // c[5] = état, c[6] = commit
  c[5] = etats[m[1]][0]; c[6] = etats[m[1]][1] ? '`' + etats[m[1]][1] + '`' : ' ';
  n++; return c.join(' | ');
}).join(nl);
if (t.includes('| E38-1 |')) throw new Error('E38 déjà versé');
t = t.replace(/\s*$/, '') + nl + neuves.join(nl) + nl;
fs.writeFileSync(F, t);
console.log('E35 mis à jour', n, '; E38 ajoutés', neuves.length);
