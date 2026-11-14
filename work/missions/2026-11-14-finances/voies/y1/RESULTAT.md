OK — Synthèse ramenée à g3a sur ses données (SYNTHESE OK, 390 clair et cave) ; diagnostic Annuel : affichage à corriger, domaine juste. G3 (tsc) bloqué hors périmètre.

## Fichiers
- Changés : `src/ui/finance/synthese/Scene.tsx`, `src/ui/finance/synthese/libelles.ts` (+ `libelleVente`), `src/ui/finance/synthese.css`.
- Écrits dans la voie : `controle-synthese.mjs`, `capturer.mjs`, `temoin-head.txt`, `tests.txt`, `DIAG-ANNUEL.md`, `cap/` (syn-390/1280 clair/cave, planche-g3a.png), ce fichier.
- Aucune règle de calcul changée (`periodeSynthese`, `echelle` intacts) ; aucune donnée réelle (banc `finance-demo=reel`). Pas de commit.

## Corrections (problèmes 4 à 7 d'ANALYSE.md)
- 4 : `.syn-ecart-gain` transparent, contour pointillé `--syn-gain` (visible en cave) ; le fil pointillé de même couleur. Écart de g3a : pointillé vide.
- 5 : quand le gain écrase la pile (ici 14 px), la pile du dépensé grandit juste assez (22 px par segment, `SEGMENT_MIN`, l'écart cède d'autant) et chaque segment écrit libellé et montant exact. Même geste que MM-1, dit ici : la forme est plus haute que l'échelle (265,40 sur 5 695,00 vaut 14 px, rendu 44 px) ; la valeur est écrite. Hors cas écrasé, aucun changement (g3a avec 696,80 inchangée).
- 6 : légende « payé » prend la couleur du plus gros segment payé (gris « Autres frais »), « à payer » la hachure de la catégorie du premier reste à payer ; plus de violet par défaut. Légende « payé » masquée s'il n'y a rien de payé.
- 7 : libellé de vente : « Vente » retiré quand le texte dépasse 26 caractères (déjà sous « Entré ») + 2 lignes max (`line-clamp`) ; le nom accessible garde le texte entier.

## Critères
- G1 : `node …/controle-synthese.mjs 3000` → `SYNTHESE OK` (clair et cave : gain rgba(0,0,0,0) pointillé 2px ; segments 22 px, libellés dans leur segment ; légende « payé » rgb(154,154,154) vue ; vente 2 lignes).
- G2 : `temoin-head.txt` = sortie sur le code actuel : 18 lignes ECHEC (gain rempli rgb(86,210,123), Brassage 4,3 px et Autres frais 9,7 px avec libellés débordants, pastille violette absente, vente 3 lignes) ; `TEMOIN OK`.
- G3 : `TSC ECHEC` hors de mon périmètre : seules erreurs `functions/src/*` « Cannot find module 'firebase-admin/firestore' » (dépendance absente de ce worktree). `npx tsc --noEmit | grep -v ^functions/` → aucune erreur dans `src`. À rejouer dans un worktree où `functions/node_modules` existe.
- G4 : `VITEST OK`, 21 fichiers, 296 tests (synthèse, solde de départ, f2Réel Annuel/Opérations/Prévisions, annuel, periodeSynthese, tests/unit/finance/ et finance.test.ts). La commande du contrat (`src/ui/finance src/domain/finance`) ne trouve aucun fichier : les tests vivent sous `tests/`. Deux fichiers (`financeDocumentHistory`, `financeDocumentMigration`) plantent au chargement pour la même raison firebase-admin ; exclus.
- G5 : `DIAG-ANNUEL.md` écrit ; `DIAG OK`.

## Captures (toutes ouvertes)
`cap/planche-g3a.png` (g3a | app clair | app cave, 390), `cap/syn-1280-clair.png`, `cap/syn-1280-cave.png`. `syn-390-*` vues dans la planche. Les deux thèmes tiennent : écart vide pointillé, segments lisibles, légende cohérente, vente sur 2 lignes.

## Doutes et limites
- Le segment « Autres frais » reste sans règle de grandeur au-delà de 22 px × n segments ; avec 4+ segments payés plus un reste à payer, la pile fera 110 px et l'écart 190 px. Acceptable ; le contrôle ne l'a vu que sur la fixture (2 segments).
- Un segment à payer en cas « écrasé » garde son étiquette courte (`syn-tag-court`, points de suspension) ; non joué au banc (aucun à payer en novembre dans la fixture). Libellé long de poste (« Matériel en charge ») : possible coupe à 390 ; `scrollWidth` du contrôle le signalerait.
- 1280 : la scène reste étroite (colonne gauche), conforme à la maquette ; défaut BX-4 du bouton + hors périmètre.

## Diagnostic Annuel (résumé, détail dans DIAG-ANNUEL.md)
Règle du code : capital si lignes `equipment` ou fiche au registre ; sinon charge entière + alerte + résultat `null` (`annual.ts:123-135, 185`). La pièce REEL-T1 n'a ni ligne ni fiche : charge. Le domaine est juste et prudent ; c'est `annuel/calculs.ts:22-24` + `Tete.tsx:43` qui affichent −70,40 comme chiffre ferme sans signaler la pièce non classée. g6 : seule l'usure entre dans « Dépensé + usure ».

DÉCISION À PRENDRE : traiter « Local et travaux 5 500,00 » dans l'Annuel. Options : (a) segment hachuré « à classer » + tête « résultat à confirmer » + puce vers l'étape 4 (UI seule, aucune règle changée) ; (b) créer la fiche matériel dans la fixture ; (c) ne rien changer. Recommandation : (a), puis la classification charge ou immobilisation demandée au brasseur (travaux : entretien = charge, agencement = amorti).

CONNAISSANCE : l'Annuel compte en capital selon les lignes `equipment` ou le registre, jamais selon la seule catégorie (`annual.ts:125-135`) ; la Synthèse range à part par catégorie (`periodeSynthese.ts:11-15`). Un cas « grosse pièce sans fiche » les fait diverger.
LEÇON PROPOSÉE : aucune
