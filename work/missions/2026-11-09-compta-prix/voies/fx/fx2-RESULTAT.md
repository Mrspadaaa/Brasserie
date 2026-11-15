OK — Clôture étape 3, Prévisions regroupées, renvois « litres » avec focus, « Autre date » de la Dépense : 4 points faits, 845 tests verts

Version de départ : ddb1baaa + changements en cours (fx1 en parallèle). Aucun commit, aucun stash, Gemini jamais appelé, données de fixture en mémoire seulement. Serveur 3015 arrêté.

## Fichiers écrits
- Étape 3 : `src/ui/finance/annuel/Etapes.tsx` (petite ligne), `src/ui/finance/annuel.css` (hachures).
- Prévisions : `src/ui/finance/previsions/Previsions.tsx`.
- Litres : `src/ui/BatchDetailSheet.tsx` (prop `focus`, état `cibleFocus`, `onNoteLitres` vers ChaineArgent), `src/ui/prix/ChaineArgent.tsx`, `src/ui/prix/PrixEcran.tsx`, `src/ui/production/ImpotBiereSheet.tsx` (`onNoteLitres`), `src/ui/production/impotAnnee/ImpotAnnee.tsx`, `src/ui/finance/BrewBudgetSheet.tsx` (la feuille Impôt qu'il ouvre reçoit `onNoteLitres` = `onMesures`).
- Dépense : `src/ui/finance/ExpenseSheet.tsx`.
- Tests : `clotureInventaires`, `soldeDepartCause`, `f2ReelPrevisions`, `prixACompleter`, `depenseMedicament` (adaptés ou complétés) ; neuf : `tests/integration/litresFocus.test.tsx` (6 tests).
- `voies/fx/` : `fx2-capturer.mjs`, `captures-fx2/` (28 PNG), `fx2-tests.txt`, `fx2-tsc.txt`, `fx2-build.txt`, `fx2-run-*.txt`, `fx2-tests-rouge*.txt`.

## Les 4 points
1. **Étape 3.** Cause des hachures absentes : `.ann button { background:none }` (plus spécifique) effaçait `.ann-hachA` sur les boutons « ? ». Ajout de `.ann button.ann-hachA` (jaune net en clair, plus doux en cave, 20 %). Valable aussi pour les cases de mois de l'étape 1. Emballages sans article en stock : « bouteilles, capsules » (libellé de la nature, pas une donnée). Malt : le plus gros article avec sa quantité puis « +N » vrai (`Pilsner Malz 10 kg +7` : huit en stock, pas « +6 » comme dans FIX.md qui comptait deux noms) ; « aujourd'hui » seulement pour un article seul de 16 caractères au plus (« Pilsner 3 kg aujourd’hui »). Mesuré à 390 : `coupe:false`.
2. **Prévisions.** Trois lignes pointillées ou plus (seuil `SEUIL_TACHES = 3`) : une ligne « 3 choses à compléter pour une prévision juste › » (`aria-expanded`, chevron qui tourne) qui se déplie sur place et liste les mêmes lignes avec leurs renvois. Une ou deux : inchangées. Les tests CP-4/CP-7/CP-13 : seul le geste change (déplier d'abord), `deplier()` dans `soldeDepartCause`.
3. **Litres.** `BatchDetailSheet focus?: 'densite' | 'volume'` : « volume » ouvre Mesures et pose le focus (anneau visible) sur « Saisir le volume conditionné ». Branchés : Prix (ligne « Litres conditionnés… » → `volume`, « Densité » → `densite` ; le coût du brassin ouvert depuis Prix a aussi `onMesures`/`onNoteDensity`), feuille Impôt bière (`onNoteLitres` pour « Noter les litres » et « litres à noter › » ; sans elle, repli sur `onNoteDensity`), coût du brassin « ? L nets » (via `onMesures` déjà câblé, désormais `volume` depuis la fiche Argent), Impôt de l'année (Clients). Le brasseur y gagne aussi le focus de la densité là où il manquait (Prix, Clients).
4. **Dépense « Autre date ».** Le toucher montre le champ « Date du paiement » et la petite ligne dès le toucher : « payé le …, autre jour que l'achat (…) » si la date diffère, « payé le …, même jour que l'achat » sinon. « C'est la date » (bouton sous le champ) remet le lien : la date suit l'achat, le champ disparaît. Dans l'état « date supposée » (medicament) c'est le « C'est la date » du haut qui reste, sans changement.

## Critères
- Tests : `fx2-tests.txt` : `Test Files 81 passed (81)` · `Tests 845 passed (845)` (les fichiers qui lisent le Possède : annuel, clôture, prévisions, impôt, coût, fiche, Prix, Argent, dépense, renvois, Synthèse, + `tests/unit/depense/ecran` et `raccord`). `renvoisPartout.test.tsx` : 12 verts. Les tests serveur `tests/unit/depense/*serveur*` ne se chargent pas sur ce poste (firebase-functions absent) : sans lien avec la voie.
- `tsc --noEmit` : 2 lignes, toutes firebase-admin (poste). `vite build` : `✓ built in 29.64s`.
- Rouge d'abord : `litresFocus` 5 échecs sur 6 avant le code (`fx2-tests-rouge.txt` ; un échec venait de mon mock de Sheet, retiré ensuite : le rouge n'est donc pas pur) ; « Autre date » rouge sur `depenseMedicament` (`fx2-tests-rouge-depense.txt`). Étape 3 et Prévisions : tests adaptés en même temps que le code, pas de rouge séparé (honnêteté).

## Captures (ouvertes, L12)
390 clair, 390 cave, 1280 clair, `captures-fx2/` : `etape3`, `previsions-replie`/`-deplie`, `litres-0-argent`/`-1-feuille-impot`/`-2-fiche-focus`, `depense-0/1/2`. Ouvertes : étape 3 (390 clair, 390 cave, 1280 clair), Prévisions dépliée (390 clair, cave) et repliée (clair), fiche avec focus (390 clair), Dépense « Autre date » (390 clair). Non ouvertes une à une : le reste (1280 de Prévisions, Dépense et litres ; cave des litres et de la Dépense). « Avant » : `voies/ci/captures/390-clair-etape3-repos.png` (hachures absentes, « Pilsner M… +6 aujourd'hui » coupé) et `voies/pj/captures/1-previsions-390-clair.png`.
Combien et quels problèmes ? **3**, mineurs :
1. Cave : les hachures de l'étape 3 restent plus sombres que la maquette claire ; « ? » jaune lisible. À juger.
2. Fiche ouverte avec focus : le `scrollIntoView` centre le bouton, la ligne « Brassé le … » passe un peu sous l'en-tête de la feuille (déjà vrai pour la densité).
3. Dépense : dans l'état « date supposée », le champ s'ouvre sous les raccourcis et la ligne « même jour que l'achat » est dessous, un peu bas dans la feuille à 390.

## Doutes et limites
- Prix sur les données de démo : le brassin choisi (« Ssr ») est planifié, sans bouton « Saisir le volume conditionné » ; le focus est donc prouvé par test (Prix, mock de la fiche : `data-focus`) et par vue depuis Brassins › Argent › Impôt › « Noter les litres » sur un brassin conditionné, pas par vue depuis Prix.
- Pour un brassin planifié, le focus « volume » ne trouve pas de bouton : la fiche s'ouvre sur Mesures sans focus (aucune erreur).
- Hors Possède non touchés : `donneesPrix.ts` (clé `litres` lue telle quelle), `previsions.css` (styles en ligne pour la colonne de la ligne dépliée).

CONNAISSANCE : `.ann button { background:none }` (0,1,1) bat toute classe seule `.ann-xxx` posée sur un bouton : une classe de fond doit se doubler `.ann button.ann-xxx` (déjà vrai pour `ann-ti`, voie fz).
LEÇON PROPOSÉE : aucune
