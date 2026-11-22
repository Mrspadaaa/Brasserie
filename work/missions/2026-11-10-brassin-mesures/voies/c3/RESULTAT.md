OK — problèmes 5 à 23 corrigés sur c3/jour (ba87e866), 34 tests brewJourC3, tsc et build verts, captures avant/après ouvertes.

## Commits (c3/jour, base 10f5fd33, worktree `C:/Users/mrspa/AppData/Local/Temp/c3-wt`)
- e528d9f9 WIP : levure sans dose (5, 8, 14 à 17), « À vérifier » (7), bilan de clôture (12), test `tests/integration/brewJourC3.test.tsx`.
- 196075cb : 6, 9, 11, 13, 17 à 23 et la ligne répétée sous le curseur.
- 14d27bb8 : `brewWorkspace` n'attend plus le bilan retiré (n° 12).
- ba87e866 (final) : l'alerte restante nomme sa cause ; « À préciser » et le suivi thermique en police du texte ; onglet actif sans souligné ; fixture `?levure=`.

## Preuves de la reprise (rejouées sur ba87e866)
- `npx vitest run tests/integration/brewJourC3.test.tsx` : 34/34 verts (30 avant la reprise, +4 pour la cause de l alerte). Avec yeastWorkflow, yeastPitchingExecution, yeastEnrichmentUi, brewWorkspace : 77/77.
- `npx tsc --noEmit -p .` : seules les 2 erreurs `firebase-admin` d'environnement.
- `VITE_HOP_V4=on npx vite build` : vert (28 s).
- Suite complète (`tests.txt`, avant les derniers petits changements) : 17 rouges + fichiers `firebase-admin` (environnement). Connus du tag : fuzzSaisie ×2, recipeAiWorkflow ×4, recipeEditing ×6, designTokens ×1, virgule-transversale ×1 (mêmes violations que le tag). `hopV55RecipeColdContactWorkbench` ×3 : verts isolément, timeouts sous charge. Rien de nouveau.
- Essais : un par critère, sauf la cause « À vérifier » (voir ci-dessous).

## « À vérifier » d'Aides et repères encore rouge après « 1 sachet » : cause trouvée
Diagnostic par `banc-notice.mjs` (liste les `[data-notice]` du repli, sur le vrai rendu) :
- Avant « 1 sachet » : 3 alertes : « Ensemencer à 18 °C · Quantité à préciser », « À cru prévu · 9 g/L », « Choisis une quantité… ».
- Après « 1 sachet » : une seule, « À cru prévu · 9 g/L ». Ce n'était pas `guide.stale` (pas de texte « L'objectif et les réglages… » à l'écran).
- Cause réelle : les 3 dry hops de la fixture `BrewPreview` ont un jour (`dayOffset`) mais pas de phase (`aromaTiming`) ; `yeastRecipeHopSummary` les classe `unknown`, et c'est voulu (« un numéro de jour ne permet pas de déduire la phase »). L'alerte est donc juste pour une recette sans phase ; la fixture la déclenche parce qu'elle ne dit pas la phase.
- Correction : le titre dit la cause (« À cru prévu · 9 g/L · phase à préciser », au lieu d'un compte caché dans le détail) ; le détail dit le geste (« Dire, pour chaque ajout, s'il va en fermentation active ou après ») ; l'étiquette du repli fermé reprend la cause (« À cru · phase à préciser ») quand une seule cause est nommée, sinon « À vérifier ». Elle s'éteint quand chaque ajout dit sa phase. `BrewAide` lit la cause dans `data-notice="…"`.
- Tests : dry hop sans phase → alerte nommée ; avec `fermentation` ou `postFermentation` → ni alerte ni « préciser » ; `BrewAide` : une cause = son texte, deux causes ou alerte sans nom = « À vérifier » ; le guide pose la cause sur le seul `dt` du dry hop.
- Capture : `captures/apres/clair-fin2-03-un-sachet-pose.png` : « Aides et repères · À cru · phase à préciser » (rouge, une étiquette). Cave : `cave-fin2-01-ensemencement-repos.png` (avant « 1 sachet » : deux causes, donc « À vérifier »).

## Captures
- `captures/avant/` et `captures/apres/`, 390 tactile, clair et cave, jeu complet (journal : `journal-apres.txt`), plus `*-fin2-*` (ensemencement, éditeur, « 1 sachet », confirmation, après clôture : `fin2-apres.txt`).
- Ouvertes et jugées après les derniers changements : `clair-23-11ensemencement-repos-a` (« À préciser » en police du texte, champ « Moût à l'ajout » cadré, « Pas de dose prévue · à choisir à l'ajout »), `clair-05-3empatage-repos-a` (suivi thermique : « à mesurer », « 60 min » en texte, marge), `clair-04-3empatage-mes-temp` (onglet actif en pastille, sans souligné ; Enregistrer gris), `cave-fin2-03-un-sachet-pose`, `clair-fin2-03-un-sachet-pose`.
- Doute : les captures `captures/apres/` du jeu complet (hors `*-fin2-*`) datent d'avant la phrase du dry hop ; seul le titre de cette ligne a changé depuis.

## Montage nettoyé
Vite :3041 et :3042 arrêtés ; `c3-ref` retiré (`git worktree remove --force`). `c3-wt` reste (branche c3/jour).

## Par numéro (cause → correction → test `brewJourC3`)
- **5, 15** Levure sèche sans quantité : le pied « J'ai ajouté la levure » ouvrait un bandeau vert « Choisis la quantité… » loin de la ligne. Cause : aucune quantité posable en un geste. Correction : le pied ouvre l'éditeur de la ligne Levure, qui propose « 1 sachet » (un toucher pose 1 sachet, quantité mesurée) ; un second toucher ouvre la confirmation qui clôt avec 1 sachet ; plus de bandeau. Test : 3 tests (« n° 5 et 15 »).
- **7, 16** Deux « À vérifier » pour une cause ; l'alerte restait rouge après la quantité. Correction : `BrewAide` ne montre l'étiquette que repliée ; l'alerte « quantité » s'éteint quand la dose est prévue, la quantité réelle posée ou le choix fait. Tests : BrewAide imbriqué et ouvert, page.
- **8** « Préparer la levure / sèche. Renseigner… aucun sachet ni nombre de cellules ». Correction : titre « Préparer la levure », détail « Quantité à choisir à l'ajout. » (≤ 80 car.). Dans Préparer, la ligne Levure n'existant pas, ni bouton ni rouge (un bouton qui n'ouvre rien aurait été un cul-de-sac, L11) ; le bouton « Choisir la quantité » ne vit que là où l'éditeur existe (fiche). Tests : 3.
- **9** Chevrons orphelins : `.brew-aide-body details > summary` et `.yeast-brew-guide details > summary` en flex, chevron à droite. Test CSS.
- **10** Au jour de brassage, plus de graphe J0–J10, tableau de dry hop ni sources : « Programme, ajouts à cru et sources » seulement en phase fiche. Test.
- **11** Refroidissement : carte « Ensuite · Ensemencement » avec la levure (« à choisir » sans dose) et la température d'ensemencement ; case « Au fermenteur · cible 19 L · au transfert » (grise). **Décision du pilote appliquée** : le volume relevé dans cette case s'enregistre `measurementStage: 'fermenter'` (volume au fermenteur, fidèle à m2) ; `volumeTarget` donne la cible à Refroidissement ; la case ignore un volume de cuve (`kettle-cold`). Tests : 2.
- **12** Doublon dans Relevés du jour : le bilan de clôture n'est plus rendu quand les cases Densité et Volume sont là. Test : 2.
- **13** « Moût à l'ajout » : règle `.bz-moutajout-val :is(input, textarea)` (bord 1 px, fond, hauteur), clair et cave. Test CSS.
- **14, 17** « guide Levure », « Aucune quantité prévue valide », « OG inconnue » : « Pas de dose prévue · à choisir à l'ajout », « sans dose prévue », « Densité initiale pas relevée · volume au fermenteur pas relevé » ; `.brew-confirm .bg-alert` en `nowrap` (bouton sur une ligne). Tests : 2 (+ 2 anciens tests mis à jour qui encodaient l'ancien jargon).
- **18** Suivi thermique : padding intérieur ; « Exposition entre les relevés inconnue » et « La montée ne remplace pas le maintien » retirés (un temps non mesurable n'est pas écrit) ; « Conditions suivies · volume à préciser » devient « Volume chauffé · à saisir ». Test : 2.
- **19** Mesurer : bouton « Volume + densité » retiré de `.bz-actions` (m2 : « Conseil » seul ; la paire reste atteignable depuis la page) ; onglet actif = pastille (plus de bord 2 px ni soulignement). Tests : 2.
- **20** Cave : « Enregistrer » grisé = fond du bandeau, texte pâle, `opacity: 1`, jamais l'ocre plein. Test CSS.
- **21** Grains cochés à `mash-0` (ou extraction à froid) seulement ; plus au Mashout. Test : 2.
- **22** Polices : le minuteur, l'heure de fin, les cibles, « maintenant », « à mesurer », « À préciser » reprennent la police du texte (m2 : « 59 : 36 »), chiffres alignés ; la chasse fixe reste aux doses et à la valeur de la feuille. Test CSS.
- **23** Ébullition › Simuler : « Minutes écoulées depuis le début de l'ébullition » et « Contact avant la fin : N min » (plus de « +75 min écoulées = … La notation de la recette exprime… »). Test.
- **6** pH et densité : plus de placeholder « 5,4 » / « 1,056 » qui passe pour une valeur. Test.
- **Ligne « Température : 96 °C / Relevé rattaché à cette étape. »** : un verdict neutre qui recopie la valeur n'est plus rendu sous le curseur (la valeur se dit une fois). Test.

## À montrer (goût, non tranché)
- « 1 sachet » sans le poids : « 1 sachet (11,5 g) » demanderait la masse du sachet du catalogue (non lue ici).
- Le panneau « Houblons · vigilances et potentiel » (Hazy IPA, Simuler ×8, BJCP, Tinseth) reste dans les Aides, replié ; l'ôter du jour de brassage est un choix.
- Le dialogue de clôture ne permet toujours pas de relever densité et volume depuis lui (il dit « pas relevé »).
- Dans Préparer, la quantité de levure n'a pas de ligne où se choisir : elle se choisit à l'ensemencement. Une ligne Levure en Préparer serait un choix de conception.
- Polices : seules les valeurs de dose et celle de la feuille Mesurer restent en chasse fixe ; l'autre option est tout en police du texte.
