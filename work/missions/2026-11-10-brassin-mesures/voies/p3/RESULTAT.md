OK — p3 : 5C, 1C (retouche c1c faite), 4C, 2B/2C, 3C commités sur p3/choix (c0236fba) ; suite complète et build au pilote

État au 11.11 (agent 3). Worktree `C:/Users/mrspa/AppData/Local/Temp/p3-wt`, branche `p3/choix`.

## Commits
- 5C d5f428a0, 1C e71ebae3, 4C b3b4c077, 2B/2C fcbf7652, **3C 8c795048**.

## 3C (cet agent)
- Test d'abord : 4 tests « 3C » dans `tests/integration/brewJourP3.test.tsx`, vus rouges sur le code sans 3C (4 échecs : pas de groupe « Densité initiale »), puis verts.
- `src/ui/BrewClotureReleves.tsx` (nouveau) : deux blocs « Densité initiale · moût refroidi » et « Au fermenteur · au transfert » : valeur 28 px (« ? » tant que rien n'est posé, jamais 0) + crayon qui ouvre le champ décimal (jamais `type="number"`), pas −/+ (0,001 ; 0,1), case d'étalonnage (« Densité refroidie ou corrigée à l’étalonnage » ; « Volume ramené à 20 °C »), curseur (`MeasureSlider` réemployé, désormais exporté), verdict « −0,003 sous la cible » + « cible 1,059–1,063 » ; volume sans bande : échelle des bornes plausibles, « au repère » / « repère 19,0 L » (le volume de la recette). Aide « Densité sur échantillon refroidi ; 1056 est accepté pour 1,056. », un seul « Pourquoi maintenant » qui dit les deux raisons (`raisonMesure`). Une ligne discrète quand une valeur est posée sans sa case : le relevé reste au journal mais ne compte pas comme OG / volume au fermenteur (comportement réel de `finalBrewReadings`).
- `src/ui/Sheet.tsx` : `ConfirmSheet` reçoit `children` (additif) ; `what` passe en `sr-only` quand il y en a (les autres confirmations ne changent pas).
- `src/pages/BrewDayPage.tsx` : brouillon `clotureReleves` repris à l'ouverture depuis `finalBrewReadings().rawGravity/rawVolume` ; seulement quand la levure n'est pas encore ajoutée (« Finaliser la synchronisation ? » garde l'ancien texte). À « Confirmer la levure ajoutée » : les relevés modifiés (`stepId: 'ensemencement'`, `at: brewNow()`, volume avec `volumeBasis: 'cold'` si la case est cochée) sont écrits dans le même `update` que `recordPitch`, juste avant lui ; une valeur inchangée n'écrit rien. `og` et `volumeBrewedL` sortent donc qualifiés seulement si la case est cochée.
- `src/pages/brew-day.css` : bloc « 3C » sous `.brew-confirm` (mise en page seule ; les gestes réemploient les classes `bz-*`). Le portail vaul est hors `.brew-page.bz` : les enfants sont enveloppés dans `<div className="brew-page bz bz-cl">` (les `--bz-*` y vivent, cave compris via `:root[data-theme='cave']`).

## Critères
- `npx vitest run tests/integration/brewJourP3.test.tsx tests/integration/brewJourC3.test.tsx tests/integration/brewDayWorkflow.test.tsx tests/integration/brassageLevureAbsenteParcours.test.tsx` : 62 verts sur 62 (après le dernier correctif, P3 + brewDayWorkflow : 27/27 ; C3 et LevureAbsente verts au passage précédent, avec 1 échec corrigé dans mon test).
- `npx tsc --noEmit -p .` : 4 erreurs, les mêmes qu'avant la voie et étrangères à p3 (`firebase-admin/firestore` dans `functions/src`, `../data/seedData` absent du worktree). Zéro autre.
- `VITE_HOP_V4=on npx vite build` : vert (« built in 26.59s »).
- Non lancé (consigne) : suite complète, captures. `rouge-avant.txt` (tests P3 sur le tag) reste à produire par le pilote ; la preuve rouge de 3C sur le code d'avant est vue ici.

## Doutes et limites
- 4C : le rappel est à l'ébullition (comme z1), pas en Préparer (c4c) : voir REPRISE-2.md.
- 3C n'est pas encore vu en Chrome : écarts de mise en page possibles avec `c3c-apres.png` (alignement du titre, taille du champ de saisie à 901 px et plus, espacement). À juger sur capture (390 clair et cave, état « ? » et état saisi, « Pourquoi maintenant » ouvert).
- Le brouillon reprend un relevé brut déjà au journal (même non qualifié) avec sa case telle qu'il l'a ; non modifié, il n'est pas réécrit.
- Un test existant (`brewDayWorkflow`) lit encore « Densité initiale pas relevée · volume au fermenteur pas relevé. » : la phrase reste dans le DOM en `sr-only`, il passe sans changement.
- `ConfirmSheet` : `children` passé comme prop JSX `children=` (lint `react/no-children-prop` possible si actif ; `tsc` ne s'en plaint pas).

## DEMANDE EXECUTANT
Banc `../vj/jour.mjs`, `?preview=brew&view=brassage&levure=seche-sans-quantite`, 390 tactile clair et cave : éditeur de la levure (1 puis 2 sachets), ensemencement Aides ouvert, ébullition (À anticiper), fenêtre de clôture avant relevés (« ? »), après pas + cases, avec « Pourquoi maintenant » ouvert ; côte à côte avec `page-v3/img/c1c-*`, `c2b-repos`, `c2c-ens`, `c3c-repos`, `c3c-apres`, `c3c-apres-cave`, `c4c-apres`, `c5c-*` ; dans `voies/p3/captures/`, toutes ouvertes.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Retouche 1C (11.11, « C'est vraiment bien, pas de nouvelles mini maquettes, implémente comme telle ») — commit c0236fba sur p3/choix

- Rendu comme `page-v3/img/c1c-repos|apres|deux.png` (+ `c1c-apres-cave.png`) : trois boutons « 1 sachet · Mesurée · Sans mesure » sur une ligne à 390 (flex, plus la grille à 2 colonnes ; `tops` identiques au banc) ; jauge sur toute la largeur ; ni « Unité réelle : À choisir » ni « Pas de dose prévue » avant choix (le champ Unité ne revient que pour « Mesurée », la ligne « Pas de dose prévue » reste éditeur fermé : test C3) ; pastille « à choisir » en pointillé gris (grise aussi éditeur ouvert), puis « 1 sachet », « 2 sachets » (pluriel, pastille et pas) ; pas « ? sachet » avant choix ; verdict « ✓ dans la plage fabricant » ; boutons de repos en trait plein.
- Test d'abord : 4 tests ajoutés dans `tests/integration/brewJourP3.test.tsx` ; sur 8c795048 : 3 rouges (c1c-repos, boutons sur une ligne, « dans la plage fabricant ») : `captures/1c/rouge-avant.txt`. Verts après.
- tsc : 2 erreurs, étrangères (`firebase-admin/firestore` dans `functions/src`). Tests : `tests/integration/brew*`, `brassage*`, `yeastPitchingExecution`, `sachetLevure` : 514 verts sur 514 (46 fichiers). Build non relancé (CSS et TSX seuls).
- Captures (Chrome réel, banc local, clés Firebase factices, 390 tactile, ouvertes) : `captures/1c/p3-{clair,cave}-{repos,apres,deux}.png`, planches `cote-*.png` (gauche : c1c, droite : rendu). Scripts : `banc-1c.mjs`, `cote-a-cote.mjs`. Cave : seule `c1c-apres-cave.png` existe côté dessin, comparée aux trois états.
- Écarts restants, mineurs : la ligne « sachet 11,5 g · Fermentis · vu le 27.09.2026 » sous la jauge n'est pas dessinée (gardée : la source du poids est exigée par la voie ; une ligne à retirer si le brasseur la juge en trop) ; le pas −/+ est un peu plus large, avec « 1 » et « sachet » à la même taille ; le pas 11,5 g « 11,5 g » en police du texte (5C) et non en chasse fixe.

### yeastPitchingExecution (rouge avec p3, vert sur le tag)
Cause trouvée par bissection : commit 2B/2C fcbf7652 (vert à e71ebae3, rouge à fcbf7652). 2C ouvre les Aides à l'ensemencement ; `BrewAide` n'affiche l'étiquette « À vérifier » que replié (VB-4 : ouvert, la cause rouge est dans le corps). Les deux tests s'en servaient seulement comme attente de montage (`findAllByText('À vérifier')`). Ce n'est donc pas une régression : le test encode l'ancien rendu. Mis à jour (attente `findByText(/^Levure ·/)`, raison en commentaire) : 11 verts sur 11.

DÉCISION À PRENDRE : la ligne de source sous la jauge (voir écarts) : garder (honnêteté du poids) ou retirer (fidélité stricte à c1c) ? Recommandation : garder.
CONNAISSANCE : le banc `?preview=brew` en Vite dev exige `src/data/seedData.ts` (ignoré par Git : copie de `seedData.example.ts`) et des clés `VITE_FIREBASE_*` factices.
LEÇON PROPOSÉE : aucune
