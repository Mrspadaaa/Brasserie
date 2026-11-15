OK — Fiche m5fo-a portée : fiche rangée, facture en barre proportionnelle, segments vers le stock, testée, captures vues.

## Fichiers écrits
- `src/ui/finance/TransactionDetails.tsx` (réécrit)
- `src/ui/finance/fiche/barre.ts` (calcul en centimes, couleurs par famille), `FactureLignes.tsx` (barre + rangées), `format.ts`, `fiche.css`
- `tests/integration/ficheBarre.test.tsx` (10 tests)
- `voies/q3/` : `capturer.mjs`, `cote-a-cote.mjs`, `cap/` (20 images), `tests.txt`

## Critères
- G1 : `VITEST OK` (10/10). Les deux fichiers de tests existants qui rendent la fiche (`fiche.test.tsx` d3c, `financeWorkspace.test.tsx`) passaient avant les voies voisines (26/26).
- G2 : `TSC OK` en ignorant `functions/`. Un instant, `FinanceForms.tsx` signalait `PayerVirement` (voie q1 en cours) ; résolu au dernier passage.
- Essais : un par critère, plus un tour de correction (voir plus bas).

## Port de la maquette
En-tête (carré de catégorie de GROUPES, titre 18, « catégorie · tiers · date », croix), montant mono 28 + CHF + pastille d'état, justificatif rangé (« facture · nom.pdf »), « Dans la facture » + « 4 lignes · au stock », barre (un segment par ligne, largeurs 38,81 / 20,56 / 26,18 / 14,45 % comme la maquette), rangées à liseré de la même couleur, icône stock, Recette · titre, Modifier + Avoir ou remboursement, Échéance et prévision, Paiements (n, chevron bas), Corriger une erreur de saisie. Pas de légende à deux colonnes (doublon, NOTE).
- Une pièce sans ligne : ni barre ni « Dans la facture ». Sans justificatif : pointillé « Sans justificatif ». Une ligne à montant ≤ 0 : rangée grise, pas de segment.
- Segment = bouton qui appelle `onOpenStockItem(stockItemRef)` ; sans renvoi ou sans article : image lisible, non cliquable.
- Aucune écriture neuve : `StorageService.updateTransaction` et `FinanceService.recordPayment` (contre-paiement `CONTRE-<id>`), comme avant.

## Actions : où elles sont
- Atteignables sur l'écran : Modifier, Avoir ou remboursement, ouvrir l'article (rangée ou segment), Recette, Échéance et prévision (champs inchangés), Corriger ce paiement saisi par erreur, Annuler cette écriture.
- Ajoutée hors maquette (nécessaire) : « Noter un paiement » / « Noter un encaissement », bouton plein au-dessus de Modifier, seulement s'il reste à régler (la maquette montre une pièce payée).
- Rangées sous « … » (« Plus d'actions », seulement si utile) : « Confirmer que cette pièce reste à régler » (état à confirmer), « Traitement annuel du matériel ».
- Retirés : le bouton « Fermer » du pied (la croix de la maquette le remplace) et l'en-tête du Sheet (masqué en CSS, gardé pour le nom du dialogue).

## Écarts à la maquette (dits)
1. « Voir » devient « Justificatif » : `DocumentProofLink` n'est pas dans mon Possède et `fiche.test.tsx` attend ce nom. Voir DÉCISION.
2. Pastille d'un ouvert : « Reste à payer : 100,00 CHF » / « À payer : … » (mots historiques de la fiche, un test de `financeWorkspace` les exige), l'échéance en note dessous. Payé : texte de la maquette « ✓ payé 9 nov. · banque » (`etatDeLigne`).
3. Couleurs de barre par famille (malt jaunes, houblon verts, levure, autre bleus), tirées de la catégorie du stock, sinon du mot de la ligne ; inconnu = « autre », jamais malt.
4. Les segments très petits (< 4 px) se touchent mal au pouce ; la rangée dessous reste la cible sûre (44 px).
5. Croix 36 px comme la maquette, zone élargie à 44.

## Captures (ouvertes et regardées)
`cap/` : `paye`, `impaye`, `sanslignes`, `apres` en 390 et 1280, clair et cave ; `cote-a-cote-<largeur>-<thème>.png` (maquette à gauche). Vues : paye-390 clair et cave, cote-a-cote-390 clair, impaye-1280 clair et cave, sanslignes-390 clair et cave, apres-1280 cave (le geste ouvre l'onglet Stocks).
Défauts vus puis corrigés : bouton « Noter un paiement » noir sur noir (la règle `.fiche button` l'emportait), hachure de la pastille illisible en cave. Non rouvert après la dernière correction : le bouton en cave a été vu bon, la hachure en cave n'a pas été revue en 390 (relance faite, image impaye-1280-cave regardée sans pastille d'ouvert, car l'exemple est déjà payé).
Limite du banc : le jeu `finance-demo` marque DEMO-T1 et DEMO-T3 « payé aujourd'hui », donc la date lit « payé aujourd'hui » et non « 9 nov. », et `impaye` montre un payé. L'état ouvert est vu sur `sanslignes` (loyer : « À payer », bouton « Noter un paiement », ni barre ni lignes) et prouvé par test. La recette et le titre du plan (« Brassin Pale Ale ») n'ont pas de donnée dans le banc : non vus en rendu.

## Doutes
- Deux tests de `financeWorkspace.test.tsx` échouent au dernier passage (« Date réelle du paiement », « Enregistrer ce mouvement ») : paiement et apport, voies q1 et q2 en cours, pas la fiche.
- Le banc `localhost:3000` n'était pas lancé ; j'ai démarré `npx vite --port 3000` depuis mon worktree (processus resté actif, à arrêter). Le 5173 servait une autre copie.
- Ma suite de voie ne rejoue pas les 12 000 tests ; seuls les trois fichiers qui rendent la fiche l'ont été.

DÉCISION À PRENDRE : « Voir » au lieu de « Justificatif » (maquette). Option A : ajouter une prop `label` à `DocumentProofLink` et mettre à jour `fiche.test.tsx` (hors Possède). Option B : garder « Justificatif ». Recommandation : A, au tour de relecture.

CONNAISSANCE : une capture sur le banc doit viser le Vite de son propre worktree (`/src/…` répond 200 sur un autre port par repli SPA, test faussé) ; le jeu `finance-demo` marque ses pièces payées.
LEÇON PROPOSÉE : aucune.
