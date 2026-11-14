OK — Synthèse et Annuel : points 1, 2, 3, 7, 8, 9, 10, 12 corrigés, contrôle r1 vert (témoin rouge gardé).

## Fichiers écrits (tous dans « Possède »)
- `src/ui/finance/annuel/Tete.tsx` : P2, P7, P8. Résultat « ? » + « CHF : résultat en attente » + une seule étiquette pointillée « À classer 5 500,00 » dans le haut de la pile Entré (g6) ; part « + à classer 5 500,00 » hachurée à part sous « Dépensé + usure 265,40 » (= le plein de la colonne) ; plus de « sans lui, perte avant stock » en attente ; la puce « Stock au 31 déc. ? › » ouvre l'étape 3 (`c.act.aller(3)`) ; repli au-dessus de la pile quand elle est trop basse (< 150 px).
- `src/ui/finance/annuel/Feuilles.tsx` : Mois par mois dit « à classer 5 500,00 » (même `piecesAClasser`), plus « compte en charge », renvoi « Classer ces pièces (étape 4) › » ; TVA (P3) : `TvaFeuille` reçoit tout le statut.
- `src/ui/finance/annuel/Etapes2.tsx` : étape 8 « ventes 5 695,00 − dépensé 265,40 − usure 0,00 ± stock ? · à classer 5 500,00 › à part » (bouton hachuré → étape 4).
- `src/ui/finance/TaxWorkspace.tsx` : passe le statut TVA entier.
- `src/ui/finance/FinanceOverview.tsx` : P1, le lien « Matériel à part » passe la catégorie qui porte le plus de montant (`renovation` ici).
- `src/ui/finance/synthese/Scene.tsx`, `synthese.css` : P9 légende « payé » = une pastille par couleur de charge payée (bandes quand plusieurs, éléments `<i>` : chacun a la couleur d'un segment) ; P10 mois vide = deux colonnes pointillées, « 0,00 » écrit, phrase dans la colonne.
- `src/ui/finance/TransactionDetails.tsx` : P12 « 10 pièces » (`accord`, liste d'unités comptables ; kg, L inchangés).
- `voies/r1/` : `controle-r1.mjs`, `capturer.mjs`, `temoin-head.txt`, `tests.txt`, `cap/` (22 captures).
- Pas touché : `annual.ts`, `periodeSynthese.ts`, Opérations, `annuel.css`, `TaxClosingSheet.tsx`, `tax.css`.

## Critères
- G1 `controle-r1.mjs 3000` : `R1 OK` (10 lignes, un point par ligne). Cause du P3 : le domaine ne rédige `message` qu'à partir de 80 % du seuil ; à 5,7 % il est vide, la feuille n'affichait que `<p>{''}</p>`. Elle dit maintenant 5 % du seuil, CA 5 695,00 CHF sur 12 mois, seuil 100 000,00, reste 94 305,00.
- G2 `lire.mjs temoin-head.txt "R1 ECHEC" TEMOIN` : `TEMOIN OK` (code d'avant : 8 points sur 8 KO ; P2 en partie vrai déjà).
- G3 `controle-synthese.mjs 3000` : `SYNTHESE OK`. G4 `controle-annuel.mjs 3000` : `ANNUEL OK`.
- G5 ECHEC pour cause d'environnement : `tests.txt` (`npx vitest run tests/unit --reporter=dot --no-color`) = 6 tests échoués et 55 fichiers non chargés sur 885 (10 249 tests verts). Causes lues : `firebase-admin`, `firebase-functions`, `cheerio` absents du poste (ces fichiers touchent `functions/`, comme les deux erreurs `tsc` à ignorer) et un délai de 15 s dépassé. Aucun fichier de Synthèse ou d'Annuel dans cette liste ; `annuelPiecesAClasser`, `periodeSynthese*` passent. `vitest-lu.mjs` rend donc `VITEST ECHEC` ; le pilote juge s'il l'accepte, ou installe les modules manquants et rejoue.
- `npx tsc --noEmit` : aucune erreur hors `functions/` (au dernier passage, avant la retouche de taille du « ? »).
- Essais : 3 passes du contrôle (ajustements : sélecteur de la ligne vente, écart de colonnes ≤ 5 px).

## Captures (`cap/`, 390 et 1280, clair et cave)
Ouvertes : `r1-ann-tete-390-clair.png` (colonne Entré avec « ? » et une seule étiquette, colonnes alignées, part hachurée à part) et `r1-syn-sept-390-cave.png` (deux colonnes pointillées, « 0,00 », phrase dedans). Les 20 autres non ouvertes une à une (planche ouverte ensuite, voir Suite) (`r1-syn-nov`, `r1-ann-mois`, `r1-ann-tva`, `r1-ann-etape8` aux quatre formats) ; planche côte à côte avec g6/g3a non faite (plafond de contexte) : à faire par l'exécutant.

## Suite (14.11) : tests alignés, « ? » à 28 px, critères, captures
- Tests alignés (ancien comportement voulu changé : perte ferme 70,40 devenue « ? » en attente) : `tests/integration/f2ReelAnnuel.test.tsx` réécrit (2 cas neufs : « ? » dans l'Entré, ni « CHF perdus » ni liseré, « à classer 5 500,00 » ; le « ? » et « À classer › » sont deux renvois, le second ouvre l'étape 4 « Matériel »). Le cas « brasserie complète » est inchangé. `annuelEcran` et `annuelGestes` : verts sans changement (aucun ne décrivait l'ancien comportement).
- `renvoisPartout` (Annuel) : le test avait raison. Vrai manque de code : le « ? » du résultat en attente n'était entouré d'aucun renvoi. Corrigé dans `Tete.tsx` (Possède r1), pas dans le test : composant `ResultatAttente`, bouton sans cadre ni fond (même dessin) qui ouvre l'étape 4 ; la puce « À classer › » reste. Le renvoi du stock reste atteignable par la piste (étape 3), l'étape 8 et, une fois les pièces classées, la puce de la tête (cas `annuelEcran`, contrôle P7).
- « ? » à 28 px : tsc `npx tsc --noEmit` : aucune erreur hors functions/ ; contrôle r1 : P8 « ? » dans le haut de l'Entré, colonnes à 3,2 / 3,0 px.
- G1 `R1 OK` (10/10) ; G2 `TEMOIN OK` ; G3 `SYNTHESE OK` ; G4 `ANNUEL OK`.
- G5 `VITEST ECHEC` pour une cause d'environnement et de voies voisines, aucune de r1 : 4 tests rouges, 10 251 verts ; 53 fichiers ne se chargent pas (`cheerio`, `firebase-functions` absents du worktree : functions/ sans node_modules). Les 4 : `brewerHopAdviceTransportV1.browser` (2, bundle functions) ; `designTokens` (`text-cave-300` dans `controlesCroisesVue.tsx` et `depense/Ligne.tsx`, fichiers non modifiés) ; `virgule-transversale` (26 occurrences ; une seule dans un fichier modifié : `TransactionJournal.tsx`, voie f1). Aucun de mes fichiers n'y figure. `tests.txt` = sortie complète. Tests Opérations : verts au passage.
- Captures rejouées (22) puis planche `cap/r1-planche.png` (g6-page et g3a-page à côté de l'Annuel 390 clair et cave, Synthèse nov. clair, sept. cave), ouverte, et `r1-ann-tete-390-clair.png` ouverte : « ? » lisible, une seule étiquette pointillée dans la pile Entré, part à classer hachurée à part, colonnes alignées. Génération : `voies/r1/planche.mjs`.

## POUR f1 (TransactionJournal.tsx)
Mon lien envoie une seule catégorie (`renovation` ou `materiel`, la plus lourde de la période). Si les deux coexistent, l'autre est absente de la liste. Correctif exact : dans le filtre de catégorie (`TransactionJournal.tsx` l. 197), accepter `category === 'apart'` = `t.category` dans `['materiel','renovation']` ou une ligne `equipment` non passée en charge, et l'afficher « Matériel · à part » dans le filtre actif (l. 286) ; je passerai alors `category: 'apart'` dans `FinanceOverview.categorieMateriel`.

## Doutes et limites
- Le test d'intégration `tests/integration/f2ReelAnnuel.test.tsx` (l. 22 à 36) attend encore « 70,40 » et « CHF perdus » : périmé depuis a1 (hors Possède), et `renvoisPartout`/`annuelEcran` cherchent la puce stock sur la tête (absente tant qu'une pièce attend son classement, par consigne « une seule étiquette »). À rejouer et aligner.
- Quand une pièce est à classer, le renvoi « Stock au 31 déc. ? » n'est plus sur la tête (une seule étiquette) : il reste à l'étape 8 (« ± stock ? ») et par la piste (étape 3).
- Mon test (`tests/unit/annuelPiecesAClasser.test.ts`) n'a pas reçu de cas neuf : les points sont des gestes, couverts par `controle-r1.mjs`.
- P1 : voir « POUR f1 ».

CONNAISSANCE : le domaine TVA (`tvaThreshold.ts`) ne rédige un message que dès 80 % du seuil ; sous ce seuil toute UI qui l'affiche seul sera vide.
LEÇON PROPOSÉE : aucune
