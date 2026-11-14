OK — Bloquants 1, 2, 3 et mineurs 4, 8, 11, 14 corrigés ; cinq contrôles et 38 tests verts

## Fichiers écrits
- `src/ui/finance/operations/plage.ts` : `joursDeCompte` (à payer → échéance, payé → dernier paiement, sinon date de pièce), `redater`, `periodeSurJours` accepte `jours`.
- `src/ui/finance/TransactionJournal.tsx` : liste, « hors plage », piles de la plage, frise et nombre d'opérations suivent `joursDeCompte` ; phrase vide des archives ; carte vide de la liste « nue ».
- `src/ui/finance/operations/Bande.tsx`, `Piles.tsx` : prop `videTexte`.
- `src/ui/finance/operations.css` : poignée à fond translucide (4), « Doublons » désactivé en contour (14), carte vide nue (11).
- `src/ui/finance/annuel/Tete.tsx`, `Feuilles.tsx`, `calculs.ts` : puce du stock sur une ligne dans le trou, nombre en haut (1) ; `pctSeuil` partagé (8).
- `tests/unit/operationsPlageJours.test.ts` (+2 tests), `tests/integration/operationsPeriode.test.tsx` (+4 tests).
- `work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs` : vérifie la règle de s2ap2.
- `voies/f3/captures.mjs`, `voies/f3/cap/` (32 captures), `voies/f3/tests.txt`.

## Point 2 : la date de la vue du mois (à dire, non touchée)
La vue du mois (`periodeSynthese`, `dansPeriode`) range une pièce par sa DATE DE PIÈCE (`tx.date`), jamais par échéance ni par paiement. Elle diffère de la règle de s2ap2 ; je n'y ai pas touché. La règle s2ap2 ne vaut que dans la frise (barres, nombre d'opérations) et dans la plage (liste, « hors plage », piles). Conséquence connue : une facture d'octobre à payer le 5 novembre est dans « octobre » au mois, et au 5 nov. dans la frise de novembre. Mois « saisi » (inconnu ≠ 0) tient compte des deux dates.
Limites : une pièce partiellement payée compte en entier à son échéance ; un avoir et la facture qu'il corrige gardent leur date (le contrôle de date de l'avoir s'y appuie, `refundLinkIssue`) ; sans échéance ou paiement inconnu : date de pièce, aucun jour inventé. Au banc, tout est payé le 14 (aujourd'hui) : le paiement est donc au 14, le loyer à payer au 25.

## Critères (sortie décisive)
- G1 `controle-frise.mjs 3000` : FRISE OK. Rouge avant : avec `joursDeCompte` neutralisé (comportement de c398e064), 4 KO (barre hachurée au 14, loyer non « hors plage », à payer 400,00, 1er → 24 inchangé) ; puis restauré, vert.
- G2 `controle-v6a.mjs 3000` : V6A OK.
- G3 `controle-annuel.mjs 3000` : ANNUEL OK.
- G4 `controle-r1.mjs 3000` : R1 OK. (`controle-synthese.mjs` : SYNTHESE OK.)
- G5 `vitest-lu.mjs` : VITEST OK (4 fichiers, 38 tests ; sortie sans couleur, `NO_COLOR=1`, sinon la regex de `vitest-lu` ne lit pas le résumé).
- `npx tsc --noEmit` : aucune erreur hors `functions/`.

Tests : `NO_COLOR=1 FORCE_COLOR=0 npx vitest run tests/unit/operationsPlageJours.test.ts tests/integration/operationsPeriode.test.tsx tests/integration/f2ReelAnnuel.test.tsx tests/unit/annuelPiecesAClasser.test.ts --reporter=dot > work/missions/2026-11-14-finances/voies/f3/tests.txt`

## Captures ouvertes (f3/cap/, 390 et 1280, clair et cave pour chaque point)
Vues en plein format : p1-annuel-complete (390 clair, 1280 cave), p2p4-plage-14 (390 clair), p2-plage-25 (1280 cave), p11-mois-vide (390 clair), p3-archives (390 cave), p14-doublons (1280 cave), p8-tva-feuille (390 clair). Les autres variantes sont prises par le même script mais non ouvertes une à une.
- 1 : « −506,40 », « CHF perdus », puis la puce « Stock au 31 déc. ? », empilés, rien ne se couvre. Le test `f2ReelAnnuel` impose le trou de g6 avec son texte dedans à la brasserie complète : la puce reste donc sur une ligne dans le trou (comme g6) ; son « sans lui, perte avant stock › » reste dans son nom accessible et s'écrit quand elle a la place (au-dessus du liseré).
- 2 : barre hachurée au 25 ; 1er → 14 : loyer « hors plage · à payer 25 nov. », à payer 0,00, dépensé 296,80 (comme s2ap2) ; 1er → 25 : loyer en ligne, à payer 400,00.
- 3 : « Aucune année archivée. » dans la bande, plus de « tout l'historique ». Avec des années archivées : « Ni vente ni dépense dans les années archivées / l'année archivée AAAA ».
- 4 : l'anneau de la poignée a un fond à 28 % d'opacité ; la barre du 14 se voit dedans (limite : elle est seulement vue à travers l'anneau, pas à côté).
- 8 : ligne et feuille « 0,7 % » ; test : 5,695 → « 5,7 % » pour les deux.
- 11 : une carte hachurée (celle de la bande) ; sous elle, seulement les liens « Voir toutes les opérations » ; le titre et la phrase restent pour le lecteur d'écran (les tests existants `financeJournalUx` les cherchent). Un filtre actif sans résultat garde sa carte entière.
- 14 : « Doublons » désactivé en contour, texte du ton courant : `rgb(216,206,197)` en cave (≈ 12:1 sur le fond cave), `rgb(51,51,51)` en clair.

## Essais
Un seul essai par critère, sauf point 1 (3 essais : seuil du trou, puis puce sur une ligne, puis nombre en haut).

## Doutes
- Point 4 : une barre vue à travers un anneau translucide reste discrète ; une autre option (poignée au-dessous de l'axe) s'éloignerait de s2ap2.
- Le mois vide garde, par l'accessibilité, un titre redondant ; seul le visuel est dédoublonné.

CONNAISSANCE : la vue du mois range par date de pièce, la frise et la plage par échéance (à payer) ou dernier paiement (payé) : deux règles de jour, voulues par s2ap2.
LEÇON PROPOSÉE : aucune
