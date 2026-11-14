# Diagnostic Annuel — « Local et travaux 5 500,00 » dans « Dépensé + usure » (lecture seule, aucun code touché)

## Constat (banc `?dev-local&finance-demo=reel`, capture `analyse/cap/ann-390-clair.png`)
- Annuel : tête « −70,40 CHF perdus », colonne « Dépensé + usure 5 765,40 » avec « Local et travaux 5 500,00 » en plein dans la pile. Ventes 5 695,00 − 5 765,40 = −70,40.
- Opérations et Synthèse rangent la même pièce « Matériel · à part » (Synthèse : colonne « Matériel 5 500,00 à part »).
- La pièce de la fixture (`src/dev/financeDemo.ts:73`, `REEL-T1`, catégorie `renovation`) n'a **ni ligne `equipment`** (`lines: []` ni `tx.finance` utile) **ni fiche au registre des immobilisations**.
- `usureCents` = 0 sur ce banc : aucune fiche matériel, donc aucun amortissement. Le matériel de 5 500,00 n'est ni en usure ni « à part » dans l'Annuel : il est en **charge entière**.

## Règle du code (`src/domain/finance/annual.ts`)
Une dépense (`kind === 'expense'`, l.123) entre en capital, en charge, ou les deux, selon ce qui la décrit, pas selon sa catégorie :
1. **Lignes `equipment` présentes** (l.125-128) : le capital = somme des lignes `equipment` dont `capitalTreatment !== 'expense'`. Une fiche matériel n'est pas requise pour compter en capital ; son absence ajoute seulement une alerte (l.133-135).
2. **Aucune ligne `equipment`** : le capital = somme des `acquisitionCents` des fiches du registre liées à la pièce (`a.transactionId === tx.id`, l.124 et 128). **Avec fiche : capital ; sans fiche : zéro capital.**
3. Le reste (`amount − capex`, × `businessUsePct`) est une **charge** (l.130) : `operatingExpensesCents` et `categories`.
4. Une pièce sans `finance` de catégorie `materiel` ou `renovation` (le cas de REEL-T1) reste donc en charge entière, et le code le sait : `missing.push('… confirmer charge ou immobilisation et compléter le registre.')` + `unclassifiedCapital = true` (l.133-135).
5. Le capital n'entre jamais dans le résultat. Il y passe par l'amortissement (`depreciationForYear`, l.38-70) : première année = coût pro × taux × `firstYearFraction`, linéaire sur le coût ou dégressif sur la valeur comptable ; **zéro tant que `openingConfirmed` est faux** (l.41, la ligne reste dans `missing`).
6. `resultCents` reste `null` tant qu'une pièce de capital est non classée ou qu'un inventaire n'est pas confirmé (l.185). C'est la bonne prudence : le domaine ne publie **pas** −70,40 comme résultat.

Test de la divergence connue : `src/domain/finance/periodeSynthese.ts:11-15` l'écrit (« ÉCART ASSUMÉ avec l'Annuel »), `tests/unit/periodeSynthese.test.ts:49` la fige côté Synthèse.

## Où le −70,40 naît (UI, pas domaine)
`src/ui/finance/annuel/calculs.ts:22-24` (`perteAvantStock`) = `revenueCents − operatingExpensesCents − depreciationCents + ajustements + cession`, **sans regarder `piecesNonClassees(report)`** (calculs.ts:14, qui existe pour la piste). `Tete.tsx:43` en tire la grande valeur rouge « CHF perdus » ; seul le stock inconnu est signalé (puce « Stock au 31 déc. ? »). Rien ne dit que 5 500,00 de la pile n'est pas classé. Le chiffre a l'air ferme alors que le domaine le refuse.

## Est-ce juste ?
- **Règle du domaine : juste et prudente.** Pour un indépendant suisse en comptabilité simple (raison individuelle, CO 957 et suivants, notice AFC A 1995 citée dans `DEPRECIATION_SOURCE`), un bien durable se **porte à l'actif et s'amortit** (taux dégressifs 20-45 %, linéaires = moitié, repris dans `DEPRECIATION_CATEGORIES`) ; un petit achat ou un entretien se passe en charge. Ce n'est pas la catégorie qui tranche mais la nature : les « travaux » dans un local sont une **charge** s'ils entretiennent et un **agencement amortissable** s'ils améliorent (et s'ils profitent à un local loué, la durée d'usage est celle du bail). Le code ne devine pas : il compte en charge, alerte, et bloque le résultat. C'est correct.
- **Affichage de la tête : faux.** Il présente en rouge ferme −70,40 (5 695,00 − 5 765,40) une « perte » qui dépend entièrement des 5 500,00 non classés. Le brasseur lit « j'ai perdu 70 » alors que la vraie réponse est « 5 500 non classés ; si c'est de l'actif, 5 429,60 avant usure (la Synthèse dit +5 429,60) ». Deux écrans de la même app se contredisent sans avertir.
- **Conformité g6** (`ref/g6/NOTE.md`) : la tête g6 est « ventes 720,00 − 909,80 − usure 288,00 = −477,80 », donc **seule l'usure** du matériel entre dans « Dépensé + usure », jamais l'achat (étape 4 : escalier 1 800,00 → 1 440,00 → 1 152,00, usure −288,00 ; joints 28,60 « Matériel / Petit achat » ; fermenteur 750,00 → 2027). Un achat de matériel de 5 500,00 sans fiche, compté en charge, **n'est pas dans la grammaire de g6** ; g6 suppose que la pièce est classée (fiche créée à l'étape 4).
- **Cas voisin à nommer** : une pièce de capital **avec** fiche mais sans `openingConfirmed` donne usure = 0 : elle disparaît de « Dépensé + usure » (ni charge, ni usure) avec une alerte, sous-estimant la dépense. Prudent côté résultat (null), mais là encore la tête affiche un chiffre ferme.

## Verdict
**Verdict : à corriger** pour l'affichage de la tête (`annuel/calculs.ts`, `annuel/Tete.tsx`) ; la règle du domaine (`annual.ts`) est **juste, à ne pas toucher**. Reste **à demander** au brasseur (ou à la fiduciaire) la nature de « Local et travaux 5 500,00 » : charge ou immobilisation amortie, et sur quelle durée. Le code ne peut pas le décider.

## Correctif proposé (le pilote décide ; rien n'est fait)
1. **Ne plus afficher un chiffre ferme tant qu'une pièce est non classée** (UI seule, aucune règle de calcul) : dans `colonnesAnnee`, sortir du segment « Dépensé » les pièces citées par `piecesNonClassees(report)` (les poser en segment hachuré « à classer 5 500,00 » comme g6 hachure l'inconnu) ; la tête devient « −70,40 ? » ou « résultat à confirmer », avec une puce « 1 pièce à classer » qui ouvre l'étape 4 « Matériel et usure », sur le modèle de la puce « Stock au 31 déc. ? ». Un banc : `controle-annuel` rouge sur « le total de la pile contient une pièce non classée sans le dire ».
2. **Classer la pièce à l'étape 4** : proposer « Charge » ou « Matériel · amortir » (fiche, taux, reprise) ; une fois la fiche créée et `openingConfirmed`, le code sort le coût de la charge et compte l'usure : la tête redevient celle de g6.
3. **Aligner Synthèse et Annuel** (alignement futur déjà noté `periodeSynthese.ts:15`) : tant que la pièce n'est pas classée, la Synthèse dit « à part » et l'Annuel « charge ». Au minimum, un même mot (« à classer ») dans les deux. Choix de grammaire : à montrer au brasseur en mini maquettes si un état nouveau est dessiné (L24), sinon ranger dans l'état hachuré de g6 (L03).
4. Données de banc : si l'on veut que `REEL-T1` illustre le cas normal, lui donner une ligne `equipment` + fiche ; garder la version actuelle comme cas « non classé » du contrôle.
