# Corrections f2, tour 2 (critique k3, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c'est une règle ; capture 390 et 1280, clair et cave, OUVERTE), ou écarté avec raison. Même contrat et même « Possède » que voies/f2/VOIE.md : COMMUN.md, test rouge d'abord, commit par chemins « Bugs tous (f2) k3 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement, de données réelles ni de Gemini réel, jamais stash/reset/checkout. Interdits : src/ui/etapeLevure/** ; src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx (travail non commité d'une autre session). Plafond : à 200 k de contexte, « ## Fait » à jour et rendre « REPRISE : … ».

## Problèmes (voies/k3/RAPPORT.md)
13. f2 / T3-9 / operations-844x340-clair-apres.png, operations-844x340-cave-apres.png / téléphone couché : le « + » flottant cache le montant « +720,00 » et le bouton « + pièce » de « Vente au marché » (colonne de droite) / gênant
14. f2 / LR3-NOTE-1 / vente-libre-1280-cave.png / deux lignes ambre disent la même chose l'une sous l'autre (« Le tarif de 569,50 CHF fait 759,33 CHF le litre : à corriger… » puis « 569,50 CHF l'unité, soit 759,33 CHF le litre : hors de l'ordinaire. Vérifie le prix. ») : n'en garder qu'une / gênant
15. f2 / LR3-NOTE-1 / vente-libre-1280-cave.png, vente-ticket-1280-clair.png / la tuile 75 cl dit « prix ? » et, dessous, « 759,33 CHF le litre » : prix inconnu et prix au litre à la fois, se lit comme une contradiction / gênant
16. f2 / LR3-NOTE-1 / vente-ticket-1280-clair.png / « Encaisser 569,50 CHF » en blanc sur gris moyen (environ 2,5:1, estimé à l'œil) : se lit comme désactivé alors que la voie dit « alerte, pas refus » / gênant
17. f2 / LR3-NOTE-1 / vente-libre-390-clair.png / la barre « Mon mois / Encaisser – CHF » recouvre le panier : « prix exemple » coupé au-dessus, « Payé ici / Facture QR » dépassent dessous / gênant

## Doutes
- f2 / T3-8 : aucune capture de la barre Apports (jeu de démo sans apport) ; +8 290,00 n'est prouvé que par Vitest.
- f2 / vente-ticket-1280-clair : « Encaisser » est peut-être réellement désactivé (« prix exemple ») ; dans ce cas le n° 16 devient une question de règle, pas de contraste.
- Point 13 : gouttière du + (src/ui/floating-actions.css, git diff d'abord) à 844×340 pour la colonne de droite des Opérations.
- Points 14 et 15 : une seule alerte ; la tuile dit le motif sans « prix ? » contradictoire.
- Point 16 : si « Encaisser » est vraiment désactivé tant que le prix est un exemple, le dire en mots ; sinon contraste ≥ 4,5:1.

## Preuves demandées (à produire toi-même)
5. f2 caisse à 390 tactile (prix non tapé : `vente-*-390-*` montrent « Prix unitaire — » et le panier vide) : corriger `voies/f2/banc-vente.mjs` (attendre la caisse ouverte, viser le champ par son libellé « Prix unitaire (CHF) » à 390), puis `node scripts/with_server.mjs --server "npm run dev -- --port 3106 --strictPort" --port 3106 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/f2/banc-vente.mjs`. Sortie attendue `VENTE OK` ; captures `vente-libre-390-{clair,cave}.png` et `vente-ticket-390-{clair,cave}.png`, avis visible et ticket lisible. Dire aussi si « Encaisser 569,50 CHF » est actif (attribut `disabled`).
6. f2 T3-8 : ajouter au banc une fixture d'apports (800, 3 890 et 3 600, catégorie `apports`, dont deux sans bloc finance) et capturer Opérations « Tout » à 1280 et 390, clair et cave : `operations-apports-<largeur>-<thème>.png`. Attendu : barre « Apports » +8 290,00, égale à la section « Apports et prélèvements ».

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/f2/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs f2` et `--tests` OK. Réponse : une ligne.

## Fait
13 | corrigé 09e971e5d | operations-844x340-{clair,cave}-apres.png (ouvertes) : « +720,00 » et « + pièce » à gauche du + ; mesure du banc : liste jusqu'à x=756, + à x=776 (rouge avant : 832)
14 | corrigé 8b9152ebc | vente-libre-1280-cave.png, vente-libre-390-clair.png : une seule ligne ambre (l'alerte remplace la note du tarif) ; test bugs-f2-k3-caisse
15 | corrigé 8b9152ebc | mêmes captures : la tuile dit « tarif à corriger » + « 759,33 CHF le litre », plus de « prix ? »
16 | corrigé 8b9152ebc | vente-ticket-390-cave.png, vente-ticket-1280-clair.png : « Encaisser » est réellement désactivé (disabled) faute de moyen de paiement ; le ticket le dit « Choisis TWINT ou Espèces pour encaisser » (pas de contraste à relever : un bouton désactivé reste grisé)
17 | corrigé 8b9152ebc | vente-libre-390-clair.png : la barre se ferme jusqu'au bord de la feuille (plus de panier visible sous la barre). Le chevauchement du panier par la barre collante au défilement est le comportement voulu (« Mon mois / Encaisser » toujours à portée), non modifié
Preuve 5 | banc-vente.mjs corrigé (textarea au doigt) : VENTE OK ; captures vente-{libre,ticket}-390-{clair,cave}.png ouvertes ; « Encaisser 569,50 CHF » : disabled = true (moyen de paiement non choisi)
Preuve 6 | banc-apports.mjs : APPORTS OK ; operations-apports-{390,1280}-{clair,cave}.png (+ -section.png) ouvertes : barre Apports +8 290,00 = section « Apports et prélèvements » +8 290,00
Tests : 17 fichiers, 113 passés (tests.txt) ; tsc : aucune erreur sur les fichiers touchés
